/**
 * 公式图片导出引擎（formula-export / exporter）
 *
 * 职责：将携带 data-latex 的 KaTeX 公式 DOM（.katex 或 .katex-display）
 * 转换为高精度、自包含的矢量 SVG 与透明 PNG 图片文件并触发下载。
 *
 * 纯逻辑模块，不包含任何 UI 操作条或按钮 DOM，可供全站任意模块复用
 * （如公式工具栏、AI 对话卡片、在线精修编辑器、脚本等）。
 *
 * 核心技术设计（v2 健壮化架构）：
 * 1. 宽高与基线精确对齐：
 *    - 等待公式用到的每个字体族加载完毕（document.fonts.load）；
 *    - 基线由 KaTeX 自身的行锚（.strut/.pstrut）精确推导，无 strut 时由 half-leading 兜底；
 *    - 内边距与公式最大字号成正比（max(6px, 0.15 × 最大字号)）。
 * 2. 跨平台字体一致性：
 *    - @font-face 路径以样式表自身 href 为基准解析；
 *    - 字体文件以 data URI 格式内嵌进 SVG；
 *    - <text> 输出完整 computed font-family 链，保证各端字体回退与中文字形一致。
 * 3. 样式与主题协调：
 *    - 颜色全部取元素计算色（暗色主题下自动变浅）；
 *    - 自动跳过 \phantom 透明字形；
 *    - 内嵌 <svg>（根号、拉伸括号）补写 fill 计算色；
 *    - 默认导出背景透明，支持任意文档无缝叠加。
 * 4. \tag 公式编号流内保护：
 *    - 测量前用内联样式强制 .tag 流内定位，测量后立即还原，杜绝编号重叠。
 */

const PNG_SCALE = 2; // PNG 导出倍率，保证高清

/** XML 文本内容转义（<text> 内容用；NBSP 转实体避免各端空白塌缩） */
export function escapeXmlText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\u00a0/g, '&#160;');
}

/** XML 属性值转义 */
export function escapeXmlAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/* ------------------------------------------------------------------ *
 *  字体资源：@font-face 收集（URL 以样式表为基准）→ data URI 内嵌
 * ------------------------------------------------------------------ */

export interface FontFaceInfo {
  family: string;
  weight: string;
  style: string;
  url: string; // 已解析为绝对地址（或 data: URI）
  format: string; // woff2 / woff / truetype / opentype / ''（未知）
}

/** 缓存：页面样式表在本次会话内不会变化 */
let katexFontFacesCache: FontFaceInfo[] | null = null;
/** 缓存：字体文件 data URI（按 URL 缓存避免重复请求） */
const fontDataUriCache = new Map<string, string>();

/** 取 computed font-family 的首选族（去掉引号） */
export function firstFamily(fontFamily: string): string {
  const f = (fontFamily || '').split(',')[0].trim().replace(/['"]/g, '');
  return f || '';
}

/** 从页面样式表收集全部 @font-face（字体 URL 以“样式表自身 href”为基准解析） */
export function collectKatexAssets(): FontFaceInfo[] {
  if (katexFontFacesCache) return katexFontFacesCache;

  const faces: FontFaceInfo[] = [];
  const seen = new Set<string>();

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | null = null;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // 跨域样式表无法读取，跳过
    }
    if (!rules) continue;

    // 关键修复：字体相对路径必须相对样式表文件解析，而不是当前页面 URL
    const base = sheet.href ? new URL(sheet.href, location.href).href : location.href;

    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      const family = (rule.style.getPropertyValue('font-family') || '').replace(/['"]/g, '').trim();
      const src = rule.style.getPropertyValue('src') || '';
      if (!family || !src) continue;

      // 解析全部 url(...) format(...) 条目，优先 woff2（体积最小、兼容最广）
      const entries: Array<{ url: string; format: string }> = [];
      const re = /url\(\s*(['"]?)([^'")]+)\1\s*\)(?:\s*format\(\s*(['"]?)([^'")]+)\3\s*\))?/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src)) !== null) {
        entries.push({ url: m[2].trim(), format: (m[4] || '').toLowerCase() });
      }
      if (!entries.length) continue;

      const best =
        entries.find((e) => e.format.includes('woff2')) ||
        entries.find((e) => /\.woff2($|\?)/i.test(e.url)) ||
        entries[0];
      const absUrl = best.url.startsWith('data:') ? best.url : new URL(best.url, base).href;
      const weight = (rule.style.getPropertyValue('font-weight') || 'normal').toLowerCase();
      const style = (rule.style.getPropertyValue('font-style') || 'normal').toLowerCase();
      const key = `${family}|${weight}|${style}`;
      if (seen.has(key)) continue;
      seen.add(key);
      faces.push({ family, weight, style, url: absUrl, format: best.format });
    }
  }

  katexFontFacesCache = faces;
  return faces;
}

/** 按扩展名 / Content-Type / format 提示嗅探字体 MIME */
function sniffFontMime(url: string, contentType: string, hint: string): string {
  const ext = (url.split('?')[0].match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();
  if (ext === 'woff2') return 'font/woff2';
  if (ext === 'woff') return 'font/woff';
  if (ext === 'ttf') return 'font/ttf';
  if (ext === 'otf') return 'font/otf';
  const ct = (contentType || '').split(';')[0].trim().toLowerCase();
  if (ct && ct.startsWith('font/')) return ct;
  const h = hint.toLowerCase();
  if (h.includes('woff2')) return 'font/woff2';
  if (h.includes('woff')) return 'font/woff';
  if (h.includes('truetype') || h.includes('ttf')) return 'font/ttf';
  if (h.includes('opentype') || h.includes('otf')) return 'font/otf';
  return 'application/octet-stream';
}

/** 由 MIME 推导 @font-face 的 format() 提示 */
function formatTokenFor(mime: string): string {
  if (mime.includes('woff2')) return 'woff2';
  if (mime.includes('woff')) return 'woff';
  if (mime.includes('truetype') || mime.includes('ttf')) return 'truetype';
  if (mime.includes('opentype') || mime.includes('otf')) return 'opentype';
  return 'woff2';
}

/** 拉取字体文件并转 base64 data URI（供自包含 SVG 使用；data: 原样透传） */
async function fetchFontDataUri(url: string, hintFormat: string): Promise<string | null> {
  const cached = fontDataUriCache.get(url);
  if (cached !== undefined) return cached;
  if (url.startsWith('data:')) {
    fontDataUriCache.set(url, url);
    return url;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    let bin = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    const mime = sniffFontMime(url, res.headers.get('content-type') || '', hintFormat);
    const dataUri = `data:${mime};base64,` + btoa(bin);
    fontDataUriCache.set(url, dataUri);
    return dataUri;
  } catch {
    return null; // 拉取失败则跳过内嵌，查看端按回退字体渲染
  }
}

/** 收集公式子树实际用到的字体族（每个元素 computed font-family 的首选族） */
export function usedFontFamilies(target: HTMLElement): Set<string> {
  const families = new Set<string>();
  const nodes: Element[] = [target, ...Array.from(target.querySelectorAll('*'))];
  for (const node of nodes) {
    const first = firstFamily(getComputedStyle(node).fontFamily);
    if (first) families.add(first);
  }
  return families;
}

/** Promise 超时包装（字体就绪等场景避免卡死导出流程） */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([p, new Promise<undefined>((resolve) => window.setTimeout(() => resolve(undefined), ms))]);
}

/**
 * 等待公式用到的字体全部加载完成后再测量/导出：
 * 保证 DOM 尺寸与 canvas 字距度量都基于真实字体而非回退字体。
 */
export async function ensureFontsReady(target: HTMLElement): Promise<void> {
  if (typeof document.fonts?.ready !== 'object' || typeof document.fonts.load !== 'function') return;
  try {
    await withTimeout(document.fonts.ready, 3000);
  } catch {
    // 忽略，继续尝试显式加载
  }

  const specs = new Map<string, { family: string; weight: string; style: string; sample: string }>();
  const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const text = (node.textContent ?? '').trim();
    if (!text) continue;
    const parent = node.parentElement;
    if (!parent || parent.closest('svg')) continue;
    const cs = getComputedStyle(parent);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const family = firstFamily(cs.fontFamily);
    if (!family) continue;
    const weight = parseInt(cs.fontWeight, 10) >= 600 || /bold/i.test(cs.fontWeight) ? '700' : '400';
    const style = cs.fontStyle === 'italic' ? 'italic' : 'normal';
    const key = `${family}|${weight}|${style}`;
    if (!specs.has(key)) specs.set(key, { family, weight, style, sample: text.slice(0, 16) });
  }

  const loads = Array.from(specs.values()).map((s) => {
    const font = `${s.style} ${s.weight} 16px "${s.family}"`;
    return withTimeout(document.fonts.load(font, s.sample), 4000);
  });
  await Promise.allSettled(loads);
}

/* ------------------------------------------------------------------ *
 *  测量：canvas 字体指标（仅作为无 .strut/.pstrut 时的基线兜底）
 * ------------------------------------------------------------------ */

let measureCtx: CanvasRenderingContext2D | null = null;

export interface FontMetrics {
  ascent: number;
  descent: number;
}

export function measureFontMetrics(font: string, text: string, size: number): FontMetrics {
  const em = size || 16;
  try {
    if (!measureCtx) {
      const c = document.createElement('canvas');
      measureCtx = c.getContext('2d');
    }
    if (!measureCtx) return { ascent: em * 0.75, descent: em * 0.25 };
    measureCtx.font = font;
    const m = measureCtx.measureText(text);
    const mAny = m as unknown as Record<string, number | undefined>;
    const fbA = mAny.fontBoundingBoxAscent;
    const fbD = mAny.fontBoundingBoxDescent;
    if (typeof fbA === 'number' && typeof fbD === 'number' && fbA + fbD > 0) {
      return { ascent: fbA, descent: fbD };
    }
    const ibA = mAny.actualBoundingBoxAscent;
    const ibD = mAny.actualBoundingBoxDescent;
    if (typeof ibA === 'number' && typeof ibD === 'number' && ibA + ibD > 0) {
      return { ascent: ibA, descent: ibD };
    }
  } catch {
    // 忽略，走经验值
  }
  return { ascent: em * 0.75, descent: em * 0.25 };
}

/* ------------------------------------------------------------------ *
 *  SVG 生成：把页面上已渲染的公式 DOM 转成“纯 SVG”（无 foreignObject）
 * ------------------------------------------------------------------ */

export interface TextLeaf {
  text: string;
  x: number;
  baselineY: number;
  family: string;
  size: number;
  bold: boolean;
  italic: boolean;
  color: string;
}

export interface BorderRect {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  dashed: boolean;
}

function isTransparent(color: string): boolean {
  return !color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)';
}

function resolveSvgUse(root: SVGSVGElement): void {
  root.querySelectorAll('use').forEach((use) => {
    const href = use.getAttribute('href') || use.getAttribute('xlink:href');
    if (!href || !href.startsWith('#')) return;
    const ref = document.getElementById(href.slice(1));
    if (!ref) return;
    const copy = ref.cloneNode(true) as Element;
    copy.removeAttribute('id');
    use.replaceWith(copy);
  });
}

function resolveLengthPx(value: string, baseFontSize: number): number {
  const v = (value || '').trim();
  if (!v) return 0;
  const num = parseFloat(v);
  if (Number.isNaN(num)) return 0;
  if (v.endsWith('em')) return num * (baseFontSize || 16);
  return num;
}

export function findLineBaseline(textParent: Element): number | null {
  let node: Element | null = textParent;
  while (node) {
    const first = node.firstElementChild;
    if (first && (first.classList.contains('strut') || first.classList.contains('pstrut'))) {
      const r = first.getBoundingClientRect();
      if (r.height > 0) {
        const cs = getComputedStyle(first);
        const baseSize = parseFloat(cs.fontSize) || 16;
        const va = resolveLengthPx(cs.verticalAlign, baseSize);
        return r.bottom + va;
      }
    }
    node = node.parentElement;
  }
  return null;
}

/**
 * 生成公式的“纯 SVG”（text / rect / 内嵌 svg，不含 foreignObject）。
 * @param source 携带 data-latex 的公式根元素（.katex 或 .katex-display）
 * @returns 构造完成的 SVG 字符串（失败返回 null）
 */
export async function buildFormulaSvg(source: HTMLElement): Promise<string | null> {
  const target = source.classList.contains('katex-display')
    ? (source.querySelector('.katex') as HTMLElement | null) ?? source
    : source;

  // 1) 等字体就绪再测量
  await ensureFontsReady(target);

  // 1.5) \tag 公式编号（如 (1)）定位保护：强制流内定位后测量，测量完立即还原
  const tagEls = Array.from(target.querySelectorAll<HTMLElement>('.tag'));
  const savedTagStyles = tagEls.map((tag) => ({ tag, style: tag.getAttribute('style') }));
  const restoreTagStyles = (): void => {
    for (const { tag, style } of savedTagStyles) {
      if (style === null) tag.removeAttribute('style');
      else tag.setAttribute('style', style);
    }
  };
  for (const tag of tagEls) {
    tag.style.position = 'static';
    tag.style.marginLeft = '0.75em';
    tag.style.whiteSpace = 'nowrap';
    tag.style.right = 'auto';
    tag.style.left = 'auto';
  }

  const rootRect = target.getBoundingClientRect();
  let width = rootRect.width;
  let height = rootRect.height;
  if (!(width > 0) || !(height > 0)) {
    width = target.scrollWidth;
    height = target.scrollHeight;
  }
  if (!(width > 0) || !(height > 0)) {
    restoreTagStyles();
    return null;
  }

  const rootLeft = rootRect.left;
  const rootTop = rootRect.top;

  const textLeaves: TextLeaf[] = [];
  const borderRects: BorderRect[] = [];
  const bgRects: Array<{ x: number; y: number; width: number; height: number; color: string }> = [];
  const svgParts: string[] = [];
  let maxFontSize = 0;
  let contentRight = 0;

  // 2.1 文本叶节点 → <text>
  const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const text = node.textContent ?? '';
    if (!text) continue;
    const parent = node.parentElement;
    if (!parent || parent.closest('svg')) continue;
    const cs = getComputedStyle(parent);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    if (isTransparent(cs.color)) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const r = range.getBoundingClientRect();
    if (r.width < 0.5 || r.height < 0.5) continue;
    contentRight = Math.max(contentRight, r.right - rootLeft);

    const size = parseFloat(cs.fontSize) || 16;
    const family = cs.fontFamily;
    const bold = parseInt(cs.fontWeight, 10) >= 600 || /bold/i.test(cs.fontWeight);
    const italic = cs.fontStyle === 'italic';

    const strutBaseline = findLineBaseline(parent);
    let baselineY: number;
    if (strutBaseline !== null) {
      baselineY = strutBaseline;
    } else {
      const fontSpec = `${italic ? 'italic ' : ''}${bold ? '700' : '400'} ${size}px ${family}`;
      const { ascent, descent } = measureFontMetrics(fontSpec, text, size);
      const contentH = ascent + descent;
      baselineY =
        !(r.height > 0) || contentH <= 0
          ? r.top + ascent
          : r.top + Math.max(0, (r.height - contentH) / 2) + ascent;
    }

    maxFontSize = Math.max(maxFontSize, size);
    textLeaves.push({
      text,
      x: r.left - rootLeft,
      baselineY: baselineY - rootTop,
      family,
      size,
      bold,
      italic,
      color: cs.color,
    });
  }

  // 2.2 空元素边框与背景
  for (const el of Array.from(target.querySelectorAll('*'))) {
    if (el.closest('svg')) continue;
    if (el.classList.contains('katex-actions')) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;

    const bg = cs.backgroundColor;
    if (!isTransparent(bg)) {
      bgRects.push({ x: r.left - rootLeft, y: r.top - rootTop, width: r.width, height: r.height, color: bg });
      contentRight = Math.max(contentRight, r.right - rootLeft);
    }

    const borderWidths: Array<{ w: number; style: string; color: string }> = [
      { w: parseFloat(cs.borderTopWidth) || 0, style: cs.borderTopStyle, color: cs.borderTopColor },
      { w: parseFloat(cs.borderRightWidth) || 0, style: cs.borderRightStyle, color: cs.borderRightColor },
      { w: parseFloat(cs.borderBottomWidth) || 0, style: cs.borderBottomStyle, color: cs.borderBottomColor },
      { w: parseFloat(cs.borderLeftWidth) || 0, style: cs.borderLeftStyle, color: cs.borderLeftColor },
    ];
    const isVisible = (w: number, style: string, color: string): boolean =>
      w > 0 && style !== 'none' && style !== 'hidden' && !isTransparent(color);
    if (isVisible(borderWidths[0].w, borderWidths[0].style, borderWidths[0].color)) {
      const w = borderWidths[0].w;
      borderRects.push({ x: r.left - rootLeft, y: r.top - rootTop, width: r.width, height: w, color: borderWidths[0].color, dashed: borderWidths[0].style !== 'solid' });
      contentRight = Math.max(contentRight, r.right - rootLeft);
    }
    if (isVisible(borderWidths[1].w, borderWidths[1].style, borderWidths[1].color)) {
      const w = borderWidths[1].w;
      borderRects.push({ x: r.left + r.width - w - rootLeft, y: r.top - rootTop, width: w, height: r.height, color: borderWidths[1].color, dashed: borderWidths[1].style !== 'solid' });
      contentRight = Math.max(contentRight, r.right - rootLeft);
    }
    if (isVisible(borderWidths[2].w, borderWidths[2].style, borderWidths[2].color)) {
      const w = borderWidths[2].w;
      borderRects.push({ x: r.left - rootLeft, y: r.top + r.height - w - rootTop, width: r.width, height: w, color: borderWidths[2].color, dashed: borderWidths[2].style !== 'solid' });
      contentRight = Math.max(contentRight, r.right - rootLeft);
    }
    if (isVisible(borderWidths[3].w, borderWidths[3].style, borderWidths[3].color)) {
      const w = borderWidths[3].w;
      borderRects.push({ x: r.left - rootLeft, y: r.top - rootTop, width: w, height: r.height, color: borderWidths[3].color, dashed: borderWidths[3].style !== 'solid' });
      contentRight = Math.max(contentRight, r.right - rootLeft);
    }
  }

  // 2.3 内嵌 <svg>
  target.querySelectorAll('svg').forEach((svg) => {
    const r = svg.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    contentRight = Math.max(contentRight, r.right - rootLeft);
    const copy = svg.cloneNode(true) as SVGSVGElement;
    resolveSvgUse(copy);
    copy.removeAttribute('width');
    copy.removeAttribute('height');
    copy.removeAttribute('class');
    copy.removeAttribute('style');
    copy.setAttribute('x', (r.left - rootLeft).toFixed(2));
    copy.setAttribute('y', (r.top - rootTop).toFixed(2));
    copy.setAttribute('width', r.width.toFixed(2));
    copy.setAttribute('height', r.height.toFixed(2));
    if (!copy.getAttribute('xmlns')) copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const color = getComputedStyle(svg).color;
    if (!isTransparent(color)) copy.setAttribute('fill', color);
    svgParts.push(copy.outerHTML);
  });

  // 3) 内边距与画布尺寸
  const pad = Math.max(6, Math.ceil(maxFontSize * 0.15));
  const padX = pad;
  const padTop = pad + 2;
  const padBottom = pad;

  const W = Math.max(width, contentRight) + padX * 2;
  const H = height + padTop + padBottom;
  const Ws = W.toFixed(2);
  const Hs = H.toFixed(2);

  // 3.5) 还原 .tag
  restoreTagStyles();

  // 4) 字体内嵌
  const used = usedFontFamilies(target);
  const faces = collectKatexAssets().filter((f) => used.has(f.family));
  const fontCss: string[] = [];
  for (const f of faces) {
    const uri = await fetchFontDataUri(f.url, f.format);
    if (!uri) continue;
    const mime = uri.startsWith('data:') ? (uri.split(';')[0].replace('data:', '') || '') : '';
    const token = formatTokenFor(mime);
    fontCss.push(
      `@font-face{font-family:${JSON.stringify(f.family)};font-style:${f.style};font-weight:${f.weight};` +
        `src:url("${uri}") format("${token}")}`
    );
  }

  // 5) 拼装 SVG
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${Ws}" height="${Hs}" viewBox="0 0 ${Ws} ${Hs}" role="img">`,
  ];
  if (fontCss.length) parts.push(`<style>${fontCss.join('\n')}</style>`);

  for (const b of bgRects) {
    parts.push(
      `<rect x="${(b.x + padX).toFixed(2)}" y="${(b.y + padTop).toFixed(2)}" width="${b.width.toFixed(2)}" height="${b.height.toFixed(2)}" fill="${escapeXmlAttr(b.color)}"/>`
    );
  }
  for (const t of textLeaves) {
    const attrs = [
      `x="${(t.x + padX).toFixed(2)}"`,
      `y="${(t.baselineY + padTop).toFixed(2)}"`,
      `font-family="${escapeXmlAttr(t.family)}"`,
      `font-size="${t.size.toFixed(2)}"`,
      t.bold ? 'font-weight="bold"' : '',
      t.italic ? 'font-style="italic"' : '',
      isTransparent(t.color) ? '' : `fill="${escapeXmlAttr(t.color)}"`,
    ]
      .filter(Boolean)
      .join(' ');
    parts.push(`<text ${attrs} xml:space="preserve">${escapeXmlText(t.text)}</text>`);
  }
  for (const b of borderRects) {
    const x = (b.x + padX).toFixed(2);
    const y = (b.y + padTop).toFixed(2);
    const w = b.width.toFixed(2);
    const h = b.height.toFixed(2);
    const color = escapeXmlAttr(b.color);
    if (b.dashed) {
      const horizontal = b.width >= b.height;
      const x1 = x;
      const y1 = y;
      const x2 = horizontal ? (b.x + b.width + padX).toFixed(2) : x;
      const y2 = horizontal ? y : (b.y + b.height + padTop).toFixed(2);
      parts.push(
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${h}" stroke-linecap="butt" stroke-dasharray="4 3"/>`
      );
    } else {
      parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`);
    }
  }
  parts.push(...svgParts);
  parts.push('</svg>');
  return parts.join('\n');
}

/* ------------------------------------------------------------------ *
 *  下载与导出接口
 * ------------------------------------------------------------------ */

/** 触发浏览器下载一个文件 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 由 LaTeX 源码生成安全的下载文件名（形如 formula-...svg） */
export function formulaFilename(source: HTMLElement, ext: string): string {
  const latex = source.dataset.latex ?? '';
  const slug = latex
    .replace(/[\\{}^_$&%#~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[^0-9a-zA-Z_\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af\u0370-\u03ff-]/g, '')
    .slice(0, 36)
    .replace(/-+$/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return slug ? `formula-${slug}.${ext}` : `formula.${ext}`;
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
      img.decode().then(resolve, () => {});
    }
  });
}

/**
 * 导出公式图片（统一接口）。
 * @param source 携带 data-latex 的公式根元素（.katex 或 .katex-display）
 * @param format 'svg' 直接下载自包含 SVG；'png' 由该 SVG 栅格化为透明 PNG
 * @returns 是否导出成功
 */
export async function exportFormula(source: HTMLElement, format: 'svg' | 'png'): Promise<boolean> {
  try {
    const svg = await buildFormulaSvg(source);
    if (!svg) return false;

    if (format === 'svg') {
      downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), formulaFilename(source, 'svg'));
      return true;
    }

    // PNG：SVG → canvas 栅格化（透明背景）
    const blobUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try {
      const img = new Image();
      img.src = blobUrl;
      await loadImage(img);
      const w = Math.max(1, Math.ceil((img.naturalWidth || 0) * PNG_SCALE));
      const h = Math.max(1, Math.ceil((img.naturalHeight || 0) * PNG_SCALE));
      if (!w || !h) return false;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) return false;
      downloadBlob(blob, formulaFilename(source, 'png'));
      return true;
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  } catch {
    return false;
  }
}

/** 便捷封装：导出 SVG 文件 */
export async function exportFormulaSvg(source: HTMLElement): Promise<boolean> {
  return exportFormula(source, 'svg');
}

/** 便捷封装：导出 PNG 文件 */
export async function exportFormulaPng(source: HTMLElement): Promise<boolean> {
  return exportFormula(source, 'png');
}
