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
 * 零依赖、零网络请求（SVG 直接由页面上已渲染的公式 DOM 快照生成；
 * PNG 由该 SVG 经 canvas 栅格化，导出过程临时内嵌字体保证字形一致）。
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
 *  SVG 生成：把页面上已渲染的公式 DOM 快照为独立 SVG 字符串
 *   - 内嵌页面样式表中所有 .katex 相关规则（布局/字体族分配）；
 *   - 为公式实际用到的 KaTeX 字体族注入 @font-face：
 *       embedFonts=false：引用站点字体文件绝对地址（文件小，适合下载）；
 *       embedFonts=true ：内嵌 base64 字体（自包含，适合 PNG 栅格化）。
 * ------------------------------------------------------------------ */

/** 缓存：页面样式表在本次会话内不会变化 */
let katexCssCache: { css: string; faces: Array<{ family: string; weight: string; style: string; url: string }> } | null = null;
/** 缓存：字体文件 base64（PNG 栅格化用，按 URL 缓存避免重复请求） */
const fontDataUriCache = new Map<string, string>();

function collectKatexAssets(): { css: string; faces: Array<{ family: string; weight: string; style: string; url: string }> } {
  if (katexCssCache) return katexCssCache;

  let css = '';
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
      if (rule instanceof CSSStyleRule) {
        // 只保留 KaTeX 相关规则（katex.min.css 的所有选择器都带 .katex）
        if (rule.selectorText.includes('.katex')) css += rule.cssText + '\n';
      } else if (rule instanceof CSSFontFaceRule) {
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
  }

  katexCssCache = { css, faces };
  return katexCssCache;
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

/** 生成公式 SVG 的完整 XML 字符串；失败（无法测量尺寸等）返回 null */
async function buildFormulaSvg(source: HTMLElement, embedFonts: boolean): Promise<string | null> {
  const target = source.classList.contains('katex-display')
    ? (source.querySelector('.katex') as HTMLElement | null) ?? source
    : source;

  const { css, faces } = collectKatexAssets();
  const used = usedFontFamilies(target);
  const usedFaces = faces.filter((f) => used.has(f.family));

  const fontCss: string[] = [];
  for (const f of usedFaces) {
    let srcUrl = f.url;
    if (embedFonts) {
      const dataUri = await fetchFontDataUri(f.url);
      if (dataUri) srcUrl = dataUri; // 拉取失败则退回 URL 引用
    }
    fontCss.push(
      `@font-face{font-family:${JSON.stringify(f.family)};font-style:${f.style};font-weight:${f.weight};` +
        `src:url("${srcUrl}") format("woff2")}`
    );
  }

  const fontSize = getComputedStyle(target).fontSize || '16px';
  const rect = target.getBoundingClientRect();
  const width = Math.max(rect.width, target.scrollWidth) + SVG_PAD * 2;
  const height = Math.max(rect.height, target.scrollHeight) + SVG_PAD * 2;
  if (!(width > 0) || !(height > 0)) return null;

  const clone = target.cloneNode(true) as HTMLElement;
  // 去掉与公式本体无关的运行时痕迹
  clone.classList.remove('katex-scroll-capsule');
  clone.removeAttribute('data-latex');
  clone.removeAttribute('data-katex-copy-ready');
  // 防御：确保内联 SVG 带命名空间（foreignObject 内按 XML 解析，缺了会渲染失败）
  clone.querySelectorAll('svg').forEach((svg) => {
    if (!svg.getAttribute('xmlns')) svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  });

  const w = width.toFixed(1);
  const h = height.toFixed(1);
  // SVG 按 XML 解析：对内嵌 <style> 内容做最小转义，确保不会破坏文档结构
  const styleCss = (fontCss.join('\n') + '\n' + css).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
    `<style>${styleCss}</style>`,
    `<foreignObject x="0" y="0" width="${w}" height="${h}">`,
    `<div xmlns="http://www.w3.org/1999/xhtml" style="padding:${SVG_PAD}px;box-sizing:border-box;` +
      `font-size:${fontSize};line-height:1.2;color:#000;">${clone.outerHTML}</div>`,
    '</foreignObject>',
    '</svg>',
  ].join('\n');
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
  const svg = await buildFormulaSvg(source, false);
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

/** 导出 PNG 文件：自包含 SVG → canvas 栅格化（返回是否成功） */
async function exportPng(source: HTMLElement): Promise<boolean> {
  const svg = await buildFormulaSvg(source, true);
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
  const { wrap, copyBtn, triggerBtn, svgItem, pngItem } = actions;
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

  // 全局关闭逻辑只绑定一次（SPA 导航复用）：点外部 / Esc 关闭所有菜单
  if (!menuDocBound) {
    menuDocBound = true;
    document.addEventListener('click', closeAllMenus);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeAllMenus();
    });
  }
}
