/**
 * 文章正文公式操作（formula-actions）：一键复制 LaTeX + 导出图片（SVG / PNG）
 *
 * 仅作用于文章页正文（main .sl-markdown-content）中由构建期注入过
 * data-latex 的公式（见 src/utils/rehype-katex-source.mjs）：
 *   - 行间公式 $$...$$（.katex-display）：操作钮悬浮于公式块右上角；
 *   - 行内公式 $...$（.katex）：包一层透明宿主，操作钮悬浮于公式上方。
 *
 * 设计无感：操作钮默认完全隐藏，鼠标悬停（或键盘聚焦 / 触屏点按）才浮现；
 * 导出图片按钮只保留一个图标，SVG / PNG 作为其下拉菜单里的二级选项。
 * 零依赖、零网络请求（导出用“纯 SVG”：按页面上已渲染公式 DOM 的最终矩形，
 * 逐叶文本节点转 <text>、空元素边框转 <rect>、拉伸定界符内嵌 <svg> 原样搬入，
 * 公式用到的 KaTeX 字体族以 data URI 内嵌；PNG 由该 SVG 经 canvas 栅格化）。
 * 注意：不用 foreignObject 快照 —— 新版 Chrome 会把含 foreignObject 的 SVG
 * 图片整体视为跨域数据，canvas.toBlob 抛 SecurityError，PNG 导出必挂。
 */

const COPIED_LABEL = '已复制';
const COPY_FAILED_LABEL = '复制失败';
const SVG_DONE_LABEL = 'SVG 已下载';
const PNG_DONE_LABEL = 'PNG 已下载';
const DOWNLOAD_FAILED_LABEL = '下载失败';
const TOOLTIP_MS = 1600;
const TOUCH_REVEAL_MS = 2600;
const SVG_PAD = 6;       // SVG 内边距（px），避免字形被裁切
const PNG_SCALE = 2;     // PNG 导出倍率，保证高清
const PNG_BG = '#ffffff'; // PNG 背景（文档场景白底最稳妥）

/** 复制图标（内联 SVG，无外部资源；与下载图标共用同一光学安全区，保证视觉对齐） */
function copyIconSvg(): string {
  return (
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="6" y="6" width="8.67" height="8.67" rx="1.33"/>' +
    '<path d="M3.33 10V3.33A1.33 1.33 0 0 1 4.67 2h6.67"/>' +
    '</svg>'
  );
}

/** 导出图标（触发器，SVG / PNG 通过其下拉菜单选择） */
function downloadIconSvg(): string {
  return (
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M14 10v2.67a1.33 1.33 0 0 1-1.33 1.33H3.33A1.33 1.33 0 0 1 2 12.67V10"/>' +
    '<path d="M4.67 6.67 8 10l3.33-3.33"/>' +
    '<path d="M8 10V2"/>' +
    '</svg>'
  );
}

/** 对勾图标（操作成功反馈） */
function checkIconSvg(): string {
  return (
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.9" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M3.25 8.5l3.1 3.1 6.4-7.1"/>' +
    '</svg>'
  );
}

/** 写入剪贴板：优先 Clipboard API，失败时回退到 execCommand（http 等环境） */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 继续走回退方案
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.opacity = '0';
    ta.style.pointerEvents = 'none';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ *
 *  SVG 生成：把页面上已渲染的公式 DOM 转成“纯 SVG”（无 foreignObject）
 *   - 逐叶文本节点按最终渲染矩形转 <text>，空元素边框转 <rect>，
 *     内嵌 <svg>（拉伸定界符）原样搬入；
 *   - 公式实际用到的 KaTeX 字体族以 data URI 内嵌，自包含、字形一致。
 * ------------------------------------------------------------------ */

/** 缓存：页面样式表在本次会话内不会变化 */
let katexFontFacesCache: Array<{ family: string; weight: string; style: string; url: string }> | null = null;
/** 缓存：字体文件 base64（按 URL 缓存避免重复请求） */
const fontDataUriCache = new Map<string, string>();

/** 从页面样式表收集全部 KaTeX @font-face（含字体文件绝对地址） */
function collectKatexAssets(): Array<{ family: string; weight: string; style: string; url: string }> {
  if (katexFontFacesCache) return katexFontFacesCache;

  const faces: Array<{ family: string; weight: string; style: string; url: string }> = [];
  const seen = new Set<string>();

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | null = null;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // 跨域样式表无法读取，跳过
    }
    if (!rules) continue;

    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      const family = (rule.style.getPropertyValue('font-family') || '').replace(/['"]/g, '').trim();
      const src = rule.style.getPropertyValue('src');
      const m = src.match(/url\(["']?([^"')]+)["']?\)/);
      if (!family || !m) continue;
      const url = new URL(m[1], location.href).href;
      const weight = rule.style.getPropertyValue('font-weight') || 'normal';
      const style = rule.style.getPropertyValue('font-style') || 'normal';
      const key = `${family}|${weight}|${style}`;
      if (seen.has(key)) continue;
      seen.add(key);
      faces.push({ family, weight, style, url });
    }
  }

  katexFontFacesCache = faces;
  return katexFontFacesCache;
}

/** 收集元素实际用到的字体族（取每个节点 computed font-family 的首选族） */
function usedFontFamilies(el: HTMLElement): Set<string> {
  const families = new Set<string>();
  const nodes: Element[] = [el, ...Array.from(el.querySelectorAll('*'))];
  for (const node of nodes) {
    const first = (getComputedStyle(node).fontFamily || '').split(',')[0].trim().replace(/['"]/g, '');
    if (first) families.add(first);
  }
  return families;
}

/** 拉取字体文件并转 base64 data URI（供 PNG 栅格化的自包含 SVG 使用） */
async function fetchFontDataUri(url: string): Promise<string | null> {
  const cached = fontDataUriCache.get(url);
  if (cached !== undefined) return cached;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    let bin = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    const dataUri = 'data:font/woff2;base64,' + btoa(bin);
    fontDataUriCache.set(url, dataUri);
    return dataUri;
  } catch {
    return null;
  }
}

/** XML 文本转义（<text> 内容用） */
function escapeXmlText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/** 共享的 2D 上下文，用于测量字体基线（懒初始化） */
let measureCtx: CanvasRenderingContext2D | null = null;

/** 用 canvas measureText 量出某字体下文本的实际 descent（基线偏移），失败返回 0 */
function textDescent(font: string, text: string): number {
  try {
    if (!measureCtx) {
      const c = document.createElement('canvas');
      measureCtx = c.getContext('2d');
    }
    if (!measureCtx) return 0;
    measureCtx.font = font;
    const m = measureCtx.measureText(text);
    return m.actualBoundingBoxDescent || 0;
  } catch {
    return 0;
  }
}

/**
 * 生成公式的“纯 SVG”（text / rect / 内嵌 svg，不含 foreignObject）：
 *   Chrome 新版本把含 foreignObject 的 SVG 图片整体视为跨域数据，canvas 导出
 *   PNG 直接抛 SecurityError（“下载 PNG 无效果”的根因之一），因此 PNG 栅格化
 *   必须用纯 SVG。字形按页面上已渲染公式 DOM 的最终矩形逐叶节点转成 <text>，
 *   分数线/根号线等空元素转成 <rect>，拉伸定界符等内嵌 <svg> 原样搬入，
 *   用到的字体族以 data URI 内嵌，保证脱离页面后字形一致。
 * 失败（无法测量尺寸等）返回 null。
 */
async function buildFormulaSvg(source: HTMLElement): Promise<string | null> {
  const target = source.classList.contains('katex-display')
    ? (source.querySelector('.katex') as HTMLElement | null) ?? source
    : source;

  const rootRect = target.getBoundingClientRect();
  const width = Math.max(rootRect.width, target.scrollWidth) + SVG_PAD * 2;
  const height = Math.max(rootRect.height, target.scrollHeight) + SVG_PAD * 2;
  if (!(width > 0) || !(height > 0)) return null;

  // 公式实际用到的字体族 → 内嵌 data URI 的 @font-face
  const used = usedFontFamilies(target);
  const faces = collectKatexAssets();
  const usedFaces = faces.filter((f) => used.has(f.family));
  const fontCss: string[] = [];
  for (const f of usedFaces) {
    const dataUri = await fetchFontDataUri(f.url);
    if (!dataUri) continue; // 拉取失败则跳过，浏览器按回退字体渲染
    fontCss.push(
      `@font-face{font-family:${JSON.stringify(f.family)};font-style:${f.style};font-weight:${f.weight};` +
        `src:url("${dataUri}") format("woff2")}`
    );
  }

  const w = width.toFixed(1);
  const h = height.toFixed(1);
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
  ];
  if (fontCss.length) parts.push(`<style>${fontCss.join('\n')}</style>`);

  const rootLeft = rootRect.left;
  const rootTop = rootRect.top;

  // 1) 内嵌 <svg>（KaTeX 拉伸定界符等）：按最终矩形定位后原样搬入
  target.querySelectorAll('svg').forEach((svg) => {
    const r = svg.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    const copy = svg.cloneNode(true) as SVGSVGElement;
    copy.removeAttribute('width');
    copy.removeAttribute('height');
    copy.setAttribute('x', (r.left - rootLeft + SVG_PAD).toFixed(1));
    copy.setAttribute('y', (r.top - rootTop + SVG_PAD).toFixed(1));
    copy.setAttribute('width', r.width.toFixed(1));
    copy.setAttribute('height', r.height.toFixed(1));
    if (!copy.getAttribute('xmlns')) copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    parts.push(copy.outerHTML);
  });

  // 2) 文本叶节点 → <text>（按渲染矩形定位，基线用字体实测 descent）
  const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const text = node.textContent ?? '';
    if (!text) continue;
    if (node.parentElement?.closest('svg')) continue; // 交给第 1 步的内嵌 svg
    const range = document.createRange();
    range.selectNodeContents(node);
    const r = range.getBoundingClientRect();
    if (r.width < 0.5 || r.height < 0.5) continue;
    const cs = getComputedStyle(node.parentElement!);
    if (cs.visibility === 'hidden') continue; // \phantom 等不可见内容不输出
    const family = (cs.fontFamily || '').split(',')[0].trim().replace(/['"]/g, '');
    const size = parseFloat(cs.fontSize) || 16;
    const weight = /bold|^[6-9]00$/.test(cs.fontWeight) ? 'bold' : 'normal';
    const style = cs.fontStyle === 'italic' ? 'italic' : 'normal';
    const font = `${style} ${weight} ${size}px ${family}`;
    const x = (r.left - rootLeft + SVG_PAD).toFixed(1);
    const y = (r.bottom - rootTop + SVG_PAD - textDescent(font, text)).toFixed(1);
    const color = cs.color;
    parts.push(
      `<text x="${x}" y="${y}" font-family="${escapeXmlText(family)}" font-size="${size}"` +
        (weight === 'bold' ? ` font-weight="bold"` : '') +
        (style === 'italic' ? ` font-style="italic"` : '') +
        (color && color !== 'rgb(0, 0, 0)' && color !== '#000000' && color !== '#000' ? ` fill="${color}"` : '') +
        `>${escapeXmlText(text)}</text>`
    );
  }

  // 3) 空元素上的边框线（分数线 \frac、根号线 \sqrt、上/下划线等）→ <rect>
  target.querySelectorAll('*').forEach((el) => {
    if (el.closest('svg')) return;
    const cs = getComputedStyle(el);
    const bw = parseFloat(cs.borderBottomWidth) || 0;
    const bt = parseFloat(cs.borderTopWidth) || 0;
    if (bw <= 0 && bt <= 0) return;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    if (bw > 0) {
      parts.push(
        `<rect x="${(r.left - rootLeft + SVG_PAD).toFixed(1)}" y="${(r.bottom - rootTop + SVG_PAD - bw).toFixed(1)}"` +
          ` width="${r.width.toFixed(1)}" height="${bw.toFixed(1)}" fill="#000"/>`
      );
    }
    if (bt > 0) {
      parts.push(
        `<rect x="${(r.left - rootLeft + SVG_PAD).toFixed(1)}" y="${(r.top - rootTop + SVG_PAD).toFixed(1)}"` +
          ` width="${r.width.toFixed(1)}" height="${bt.toFixed(1)}" fill="#000"/>`
      );
    }
  });

  parts.push('</svg>');
  return parts.join('\n');
}

/* ------------------------------------------------------------------ *
 *  下载
 * ------------------------------------------------------------------ */

/** 触发浏览器下载一个文件 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 导出 SVG 文件（返回是否成功） */
async function exportSvg(source: HTMLElement): Promise<boolean> {
  const svg = await buildFormulaSvg(source);
  if (!svg) return false;
  downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), 'formula.svg');
  return true;
}

/** 加载图片：优先 decode()，异常时回退到 onload 事件 */
function loadImage(img: HTMLImageElement): Promise<void> {
  return new Promise((resolve, reject) => {
    if (img.complete && img.naturalWidth > 0) {
      resolve();
      return;
    }
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('image load failed'));
    if (typeof img.decode === 'function') {
      img.decode().then(resolve, () => {
        // decode 失败（部分浏览器对 SVG 的兼容问题）时等待 onload 兜底
      });
    }
  });
}

/** 导出 PNG 文件：纯 SVG → canvas 栅格化（返回是否成功） */
async function exportPng(source: HTMLElement): Promise<boolean> {
  const svg = await buildFormulaSvg(source);
  if (!svg) return false;
  const blobUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.src = blobUrl;
    await loadImage(img);
    const w = Math.max(1, Math.round((img.naturalWidth || 0) * PNG_SCALE));
    const h = Math.max(1, Math.round((img.naturalHeight || 0) * PNG_SCALE));
    if (!w || !h) return false;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.fillStyle = PNG_BG;
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return false;
    downloadBlob(blob, 'formula.png');
    return true;
  } catch {
    return false;
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

/* ------------------------------------------------------------------ *
 *  操作钮（复制 + 导出触发器 + SVG/PNG 二级菜单）挂接
 * ------------------------------------------------------------------ */

function makeButton(className: string, label: string, iconHtml: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = className;
  btn.setAttribute('aria-label', label);
  btn.title = label;
  const icon = document.createElement('span');
  icon.className = `${className}-icon`;
  icon.innerHTML = iconHtml;
  const tip = document.createElement('span');
  tip.className = `${className}-tip`;
  btn.append(icon, tip);
  return btn;
}

function makeMenuItem(label: string): HTMLButtonElement {
  const item = document.createElement('button');
  item.type = 'button';
  item.className = 'katex-menu-item';
  item.setAttribute('role', 'menuitem');
  item.textContent = label;
  return item;
}

function makeActions(): {
  wrap: HTMLSpanElement;
  copyBtn: HTMLButtonElement;
  triggerBtn: HTMLButtonElement;
  menu: HTMLSpanElement;
  svgItem: HTMLButtonElement;
  pngItem: HTMLButtonElement;
} {
  const wrap = document.createElement('span');
  wrap.className = 'katex-actions';

  const copyBtn = makeButton('katex-copy-btn', '复制公式 LaTeX', copyIconSvg());

  const triggerBtn = makeButton('katex-download-btn', '导出公式图片（SVG / PNG）', downloadIconSvg());
  triggerBtn.setAttribute('aria-haspopup', 'menu');
  triggerBtn.setAttribute('aria-expanded', 'false');

  const menu = document.createElement('span');
  menu.className = 'katex-download-menu';
  menu.setAttribute('role', 'menu');
  const svgItem = makeMenuItem('SVG');
  const pngItem = makeMenuItem('PNG');
  menu.append(svgItem, pngItem);

  wrap.append(copyBtn, triggerBtn, menu);
  return { wrap, copyBtn, triggerBtn, menu, svgItem, pngItem };
}

/** 关闭页面上所有打开的导出菜单 */
function closeAllMenus(): void {
  document.querySelectorAll<HTMLElement>('.katex-actions.is-open').forEach((wrap) => {
    wrap.classList.remove('is-open');
    const trigger = wrap.querySelector<HTMLElement>('.katex-download-btn');
    trigger?.setAttribute('aria-expanded', 'false');
    // 还原菜单内联定位（is-open 期间菜单被提升为 fixed 以逃逸祖先 overflow 裁剪）
    const menu = wrap.querySelector<HTMLElement>('.katex-download-menu');
    if (menu) {
      menu.style.position = '';
      menu.style.top = '';
      menu.style.left = '';
      menu.style.right = '';
    }
  });
}

/**
 * 为单个公式挂接操作交互。
 * @param source   携带 data-latex 的公式根元素（.katex 或 .katex-display）
 * @param interact 操作钮所在的交互容器（行内公式为透明宿主，行间公式即公式块本身）
 */
function wireActions(
  source: HTMLElement,
  interact: HTMLElement,
  actions: { wrap: HTMLSpanElement; copyBtn: HTMLButtonElement; triggerBtn: HTMLButtonElement; menu: HTMLSpanElement; svgItem: HTMLButtonElement; pngItem: HTMLButtonElement }
): void {
  const { wrap, copyBtn, triggerBtn, menu, svgItem, pngItem } = actions;
  const copyIcon = copyBtn.querySelector<HTMLElement>('.katex-copy-btn-icon');
  const copyTip = copyBtn.querySelector<HTMLElement>('.katex-copy-btn-tip');
  const triggerIcon = triggerBtn.querySelector<HTMLElement>('.katex-download-btn-icon');
  const triggerTip = triggerBtn.querySelector<HTMLElement>('.katex-download-btn-tip');
  const isCoarse = window.matchMedia?.('(pointer: coarse)').matches;
  let resetTimer = 0;

  const flash = (btn: HTMLButtonElement, icon: HTMLElement | null, tip: HTMLElement | null, ok: boolean, okLabel: string, failLabel: string): void => {
    window.clearTimeout(resetTimer);
    btn.classList.add('is-done');
    if (icon) icon.innerHTML = ok ? checkIconSvg() : btn === copyBtn ? copyIconSvg() : downloadIconSvg();
    if (tip) tip.textContent = ok ? okLabel : failLabel;
    resetTimer = window.setTimeout(() => {
      btn.classList.remove('is-done');
      if (icon) icon.innerHTML = btn === copyBtn ? copyIconSvg() : downloadIconSvg();
      if (tip) tip.textContent = ok ? okLabel : failLabel;
    }, TOOLTIP_MS);
  };

  const setMenuOpen = (open: boolean): void => {
    wrap.classList.toggle('is-open', open);
    triggerBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      positionMenu();
    } else {
      menu.style.position = '';
      menu.style.top = '';
      menu.style.left = '';
      menu.style.right = '';
    }
  };

  /**
   * 打开时把菜单提升为 position:fixed 并按触发钮的视口坐标定位：
   * 行间公式块自身是 overflow-x:auto / overflow-y:hidden 的滚动容器（卡片也有
   * overflow:hidden），默认的绝对定位下拉会被裁掉下半截，PNG 项根本点不到。
   * fixed 的包含块是视口，可整体逃逸所有祖先的 overflow 裁剪；配合
   * .katex-actions.is-open { transform:none }（transform 会让 fixed 退化为
   * 相对该元素定位），菜单得以完整显示。空间不足时自动翻转到按钮上方。
   */
  const positionMenu = (): void => {
    const rect = triggerBtn.getBoundingClientRect();
    const gap = 4;
    const menuHeight = menu.offsetHeight || 80;
    const viewportBottom = window.innerHeight - 8;
    let top = rect.bottom + gap;
    if (top + menuHeight > viewportBottom && rect.top - gap - menuHeight > 8) {
      top = rect.top - gap - menuHeight; // 下方放不下则翻到上方
    }
    menu.style.position = 'fixed';
    menu.style.top = Math.max(8, top) + 'px';
    menu.style.left = rect.left + 'px';
    menu.style.right = 'auto';
  };

  copyBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const ok = await copyText((source.dataset.latex ?? '').trim());
    flash(copyBtn, copyIcon, copyTip, ok, COPIED_LABEL, COPY_FAILED_LABEL);
  });

  // 导出触发器：展开/收起 SVG / PNG 二级菜单
  triggerBtn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    // 以 DOM 实际状态为准（外部点击 / Esc 可能已关闭菜单，避免本地状态失同步）
    const wasOpen = wrap.classList.contains('is-open');
    closeAllMenus();
    setMenuOpen(!wasOpen);
  });

  svgItem.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuOpen(false);
    const ok = await exportSvg(source);
    flash(triggerBtn, triggerIcon, triggerTip, ok, SVG_DONE_LABEL, DOWNLOAD_FAILED_LABEL);
    keepFeedbackVisible();
  });

  pngItem.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuOpen(false);
    const ok = await exportPng(source);
    flash(triggerBtn, triggerIcon, triggerTip, ok, PNG_DONE_LABEL, DOWNLOAD_FAILED_LABEL);
    keepFeedbackVisible();
  });

  // 触屏设备：操作完成后短暂保持操作钮可见，让“已下载”反馈可被看到
  const keepFeedbackVisible = (): void => {
    if (!isCoarse) return;
    wrap.classList.add('is-visible');
    window.setTimeout(() => {
      wrap.classList.remove('is-visible');
      if (!wrap.classList.contains('is-open')) setMenuOpen(false);
    }, TOOLTIP_MS + 250);
  };

  // 触屏（无悬停）：点按公式临时浮现操作钮，随后自动隐藏
  if (isCoarse) {
    interact.addEventListener('click', (event) => {
      if (event.target instanceof Node && wrap.contains(event.target)) return;
      wrap.classList.add('is-visible');
      window.clearTimeout(resetTimer);
      window.setTimeout(() => {
        wrap.classList.remove('is-visible');
        if (!wrap.classList.contains('is-open')) setMenuOpen(false);
      }, TOUCH_REVEAL_MS);
    });
  }
}

function setupFormula(root: HTMLElement): void {
  if (root.dataset.katexCopyReady) return;
  root.dataset.katexCopyReady = '1';

  const actions = makeActions();

  if (root.classList.contains('katex-display')) {
    // 行间公式：操作钮作为公式块子元素，定位于右上角
    root.appendChild(actions.wrap);
    wireActions(root, root, actions);
  } else {
    // 行内公式：包一层透明宿主，操作钮悬浮于公式上方，不触碰行内排版
    const host = document.createElement('span');
    host.className = 'katex-copy-host';
    root.before(host);
    host.appendChild(root);
    host.appendChild(actions.wrap);
    wireActions(root, host, actions);
  }
}

/**
 * 初始化文章正文公式操作。幂等：已处理过的公式会被跳过；
 * 页面无正文（首页 / 打印页 / 侧边栏）时自动空转。
 */
let menuDocBound = false;
export function initFormulaActions(): void {
  const content = document.querySelector<HTMLElement>('main .sl-markdown-content');
  if (!content) return;
  const roots = Array.from(content.querySelectorAll<HTMLElement>('[data-latex]'));
  for (const root of roots) setupFormula(root);

  // 全局关闭逻辑只绑定一次（SPA 导航复用）：点外部 / Esc / 滚动 / 缩放 关闭所有菜单
  // （菜单展开时为 fixed 定位，页面滚动后按钮与菜单会错位，滚动即关闭最稳妥）
  if (!menuDocBound) {
    menuDocBound = true;
    document.addEventListener('click', closeAllMenus);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeAllMenus();
    });
    window.addEventListener('scroll', closeAllMenus, { passive: true, capture: true });
    window.addEventListener('resize', closeAllMenus);
  }
}
