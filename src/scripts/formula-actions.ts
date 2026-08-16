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
 *
 * ---------------------------------------------------------------- *
 *  导出核心（buildFormulaSvg → exportFormula）的设计（v2 健壮化重构）
 * ---------------------------------------------------------------- *
 * 导出不使用 foreignObject 快照（新版 Chrome 会把含 foreignObject 的 SVG
 * 图片整体视为跨域数据，canvas.toBlob 抛 SecurityError，PNG 导出必挂），
 * 而是把页面上已渲染的公式 DOM 转成“纯 SVG”（text / rect / 内嵌 svg）。
 * v2 针对三类历史问题做了系统性修复：
 *
 * 1) 宽高/裁剪问题
 *    - 先等字体就绪（document.fonts.ready + 显式 load 公式用到的每个
 *      字体族）再测量，避免按回退字体量出错误尺寸；
 *    - 基线用 KaTeX 自身的行锚（.base/.vlist 单元格首元素 .strut 或
 *      .pstrut）精确推导：行基线 = strut 底边 + vertical-align。不再用
 *      “行框底 − 墨迹 descent”（回退字体下整体下移、有/无 descender 的
 *      字形基线不一致，导致底部裁切与分数线错位）；无 strut 时（如
 *      display 公式的 \tag）才回退到 half-leading + font-ascent；
 *    - 内边距与公式最大字号成正比（max(6px, 0.15 × 最大字号)），大字号
 *      公式不再被固定 6px 边距裁切。
 *
 * 2) 字体缺失 / 各端不一致问题
 *    - @font-face 的字体 URL 以“样式表自身 href”为基准解析（原来用
 *      location.href，嵌套路由下相对路径必然解析错）；
 *    - 字体 MIME 按扩展名 / Content-Type / format 提示嗅探，不再硬编码
 *      woff2；公式实际用到的字体族全部以 data URI 内嵌进 SVG；
 *    - <text> 输出完整的 computed font-family 链（如
 *      KaTeX_Main, "Times New Roman", serif），查看端按与页面相同的
 *      回退顺序取字（\text{中文} 等系统字形各端一致）；xml:space 保留
 *      空白、NBSP 转实体。
 *
 * 3) 样式不正确 / 不协调问题
 *    - 分数线 / 根号线 / 边框等不再硬编码黑色：全部取元素自身计算色
 *      （暗色主题下自动变浅，与页面观感一致）；\phantom 等透明字形
 *      直接跳过（KaTeX 用 color:transparent，visibility 检查抓不到）；
 *    - KaTeX 内嵌 <svg>（拉伸定界符、根号等）补写 fill 属性为元素计算
 *      色（原 CSS 的 fill:currentColor 在脱离页面后失效，会变纯黑）；
 *    - 导出背景为透明（SVG / PNG 均为独立透明公式，不带页面/卡片底色），
 *      可直接叠加到任意文档；公式内部自带的背景（如 \fcolorbox）保留；
 *    - 边框捕获从“只认下/上”扩展为四边 + background-color（支持
 *      \boxed、\fbox、\rule、\angl、\overline/\underline、\sout）。
 *
 * 4) 公式末尾编号（\tag，如 (1)）重叠问题
 *    - KaTeX 默认把 .tag 绝对定位（right:0）在 .katex-html 右缘；custom.css
 *      把它改为流内定位（position:static + 0.75em），但该覆盖依赖样式表加载
 *      顺序/级联层，一旦失效（历史上正是一次移动端样式调整后失效），编号会
 *      压在公式末尾字符上；
 *    - 导出前用内联样式（优先级最高）强制 .tag 流内定位，测量后立即还原，
 *      导出几何不再依赖页面 CSS；画布宽度覆盖全部内容右缘，编号或超宽公式
 *      不再被右侧裁切。
 *
 * 对外接口（直接改变接口）：
 *   - exportFormula(source, 'svg' | 'png')：导出核心，返回是否成功；
 *   - exportFormulaSvg(source) / exportFormulaPng(source)：便捷封装；
 *   - initFormulaActions()：挂接页面交互（入口不变）。
 * 零依赖、零网络请求（字体文件用页面已缓存资源转 data URI）。
 */

const COPIED_LABEL = '已复制';
const COPY_FAILED_LABEL = '复制失败';
const SVG_DONE_LABEL = 'SVG 已下载';
const PNG_DONE_LABEL = 'PNG 已下载';
const DOWNLOAD_FAILED_LABEL = '下载失败';
const TOOLTIP_MS = 1600;
const TOUCH_REVEAL_MS = 2600;
const PNG_SCALE = 2; // PNG 导出倍率，保证高清

/* ------------------------------------------------------------------ *
 *  工具：图标 / 剪贴板 / XML 转义
 * ------------------------------------------------------------------ */

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

/** XML 文本内容转义（<text> 内容用；NBSP 转实体避免各端空白塌缩） */
function escapeXmlText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\u00a0/g, '&#160;');
}

/** XML 属性值转义 */
function escapeXmlAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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
 *  字体资源：@font-face 收集（URL 以样式表为基准）→ data URI 内嵌
 * ------------------------------------------------------------------ */

interface FontFaceInfo {
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
function firstFamily(fontFamily: string): string {
  const f = (fontFamily || '').split(',')[0].trim().replace(/['"]/g, '');
  return f || '';
}

/** 从页面样式表收集全部 @font-face（字体 URL 以“样式表自身 href”为基准解析） */
function collectKatexAssets(): FontFaceInfo[] {
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

/** 按扩展名 / Content-Type / format 提示嗅探字体 MIME（不再硬编码 woff2） */
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
function usedFontFamilies(target: HTMLElement): Set<string> {
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
 * document.fonts.ready 只等“已发起”的加载，这里按公式实际用到的
 * (family, weight, style) 逐个体面地触发 document.fonts.load，
 * 保证 DOM 尺寸与 canvas 字距度量都基于真实字体而非回退字体。
 */
async function ensureFontsReady(target: HTMLElement): Promise<void> {
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

/** 共享的 2D 上下文，用于测量字体指标（懒初始化） */
let measureCtx: CanvasRenderingContext2D | null = null;

interface FontMetrics {
  ascent: number;
  descent: number;
}

/**
 * 量出某字体在给定字号下的“字体指标”（ascent/descent，即 em 盒上下缘到
 * 基线的距离）。优先 fontBoundingBoxAscent/Descent（字体真实指标），
 * 缺失时回退墨迹指标，再回退 0.75em / 0.25em 经验值。
 * 注意：这只在 findLineBaseline 找不到行锚（如 display 公式 \tag）时使用。
 */
function measureFontMetrics(font: string, text: string, size: number): FontMetrics {
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

interface TextLeaf {
  text: string;
  x: number; // 相对 root 左上（未加内边距）
  baselineY: number; // 相对 root 左上（未加内边距）
  family: string; // 完整 computed font-family 链
  size: number;
  bold: boolean;
  italic: boolean;
  color: string;
}

interface BorderRect {
  x: number; // 边框条自身几何（相对 root 左上，未加内边距）
  y: number;
  width: number;
  height: number;
  color: string;
  dashed: boolean; // 非实线（\hdashline 等）→ 用 <line> + stroke-dasharray
}

/** 判断计算色是否透明 */
function isTransparent(color: string): boolean {
  return !color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)';
}

/** 把 <use> 引用解析为实际内容（KaTeX 自身不用 <use>，这里是防御性保险） */
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

/** 解析长度值（px / em）为像素 */
function resolveLengthPx(value: string, baseFontSize: number): number {
  const v = (value || '').trim();
  if (!v) return 0;
  const num = parseFloat(v);
  if (Number.isNaN(num)) return 0;
  if (v.endsWith('em')) return num * (baseFontSize || 16);
  return num; // px 或纯数字
}

/**
 * 找文本所在“行”的精确基线：KaTeX 每一行（.base 主行 / vlist 单元格）都以
 * .strut 或 .pstrut 作为行内容首元素，行基线 = strut 底边 + vertical-align
 * （strut 是空 inline-block，其基线即底边，vertical-align 为负表示下沉）。
 * 这比“行框顶 + half-leading + ascent”更精确 —— 行框常被 strut/内联块
 * 撑高，half-leading 分摊会整体错位。找不到（如 display 公式的 \tag）
 * 返回 null，由调用方走 half-leading 兜底。
 */
function findLineBaseline(textParent: Element): number | null {
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
 * Chrome 新版本把含 foreignObject 的 SVG 图片整体视为跨域数据，canvas 导出
 * PNG 直接抛 SecurityError（“下载 PNG 无效果”的根因之一），因此 PNG 栅格化
 * 必须用纯 SVG。
 *
 * 健壮性要点（详见文件头注释）：
 *   - 先 ensureFontsReady 再测量；
 *   - 基线用 KaTeX 自身的 .strut/.pstrut 精确推导（不再整体下移 / 错位）；
 *   - 内边距随最大字号放大；
 *   - 字体族链完整输出 + 用到的字体族以 data URI 内嵌；
 *   - 颜色全部取元素计算色，导出背景透明（独立公式，可叠加任意底色）。
 * 失败（无法测量尺寸等）返回 null。
 */
async function buildFormulaSvg(source: HTMLElement): Promise<string | null> {
  const target = source.classList.contains('katex-display')
    ? (source.querySelector('.katex') as HTMLElement | null) ?? source
    : source;

  // 1) 等字体就绪再测量（回退字体会量出错误尺寸/基线）
  await ensureFontsReady(target);

  // 1.5) \tag 公式编号（如 (1)）定位修复：KaTeX 默认把 .tag 绝对定位（right:0）
  // 在 .katex-html 右缘；custom.css 虽把它改为流内定位（position:static + 0.75em
  // 间距），但该覆盖依赖样式表加载顺序 / 级联层，一旦失效（历史上正是一次移动端
  // 样式调整后失效），编号会压在公式末尾字符上，导出图必然重叠。
  // 这里在测量前用内联样式（优先级最高，不依赖任何样式表）强制 .tag 流内定位，
  // 测量完成后立即还原，导出几何始终正确。测量是同步的（getBoundingClientRect
  // 会强制同步重排），因此页面不会出现可见闪动。
  const tagEls = Array.from(target.querySelectorAll<HTMLElement>('.tag'));
  const savedTagStyles = tagEls.map((tag) => ({ tag, style: tag.getAttribute('style') }));
  /** 还原 .tag 的内联样式（测量是同步的，还原后页面不留任何痕迹） */
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

  // 2) 单遍收集叶子数据（文本 / 边框 / 内嵌 svg），同时求最大字号
  //    与内容右缘（contentRight）：公式超宽被 max-width:100% 压窄、或编号被
  //    强制流内定位后溢出 .katex 盒子时，画布宽度必须覆盖全部内容，否则导出
  //    图右侧会被裁掉（这也是超宽公式导出被裁的隐性来源）。
  const textLeaves: TextLeaf[] = [];
  const borderRects: BorderRect[] = [];
  const bgRects: Array<{ x: number; y: number; width: number; height: number; color: string }> = [];
  const svgParts: string[] = [];
  let maxFontSize = 0;
  let contentRight = 0;

  // 2.1 文本叶节点 → <text>（基线按行内 .strut/.pstrut 精确推导）
  const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const text = node.textContent ?? '';
    if (!text) continue;
    const parent = node.parentElement;
    if (!parent || parent.closest('svg')) continue; // 交给内嵌 svg 部分
    const cs = getComputedStyle(parent);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue; // 隐藏内容
    if (isTransparent(cs.color)) continue; // \phantom 等透明字形（KaTeX 用 color:transparent）
    const range = document.createRange();
    range.selectNodeContents(node);
    const r = range.getBoundingClientRect();
    if (r.width < 0.5 || r.height < 0.5) continue;
    contentRight = Math.max(contentRight, r.right - rootLeft);

    const size = parseFloat(cs.fontSize) || 16;
    const family = cs.fontFamily; // 完整回退链（中文文本各端一致的关键）
    const bold = parseInt(cs.fontWeight, 10) >= 600 || /bold/i.test(cs.fontWeight);
    const italic = cs.fontStyle === 'italic';

    // 基线优先取行内 strut（精确）；无 strut（如 \tag）才用 half-leading 兜底
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
          ? r.top + ascent // 行框高为 0（\smash 的 line-height:0）或指标缺失
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

  // 2.2 空元素边框（分数线/根号线/上下划线/\boxed/\rule/\sout 等）→ rect/line
  for (const el of Array.from(target.querySelectorAll('*'))) {
    if (el.closest('svg')) continue;
    if (el.classList.contains('katex-actions')) continue; // 防御：操作钮永不入图
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;

    // 背景色（\fcolorbox 等）：置于最底层
    const bg = cs.backgroundColor;
    if (!isTransparent(bg)) {
      bgRects.push({ x: r.left - rootLeft, y: r.top - rootTop, width: r.width, height: r.height, color: bg });
      contentRight = Math.max(contentRight, r.right - rootLeft);
    }

    // 边框：只取“实线/虚线”有效边，直接按边框条几何落位（厚度 = 边框宽）
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

  // 2.3 内嵌 <svg>（拉伸定界符 / 根号等）：定位后原样搬入 + 补 fill 计算色
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
    // 原 CSS（fill:currentColor）脱离页面后失效，补写计算色使路径继承正确颜色
    const color = getComputedStyle(svg).color;
    if (!isTransparent(color)) copy.setAttribute('fill', color);
    svgParts.push(copy.outerHTML);
  });

  // 3) 内边距：随最大字号放大（固定 6px 在大字号公式下会裁切）
  const pad = Math.max(6, Math.ceil(maxFontSize * 0.15));
  const padX = pad;
  const padTop = pad + 2;
  const padBottom = pad;

  // 画布宽度覆盖 .katex 盒子与全部内容右缘：编号被强制流内定位后（或公式超宽
  // 被 max-width:100% 压窄时）内容会超出盒子，若仍用盒子宽度，导出图右侧会被裁掉
  const W = Math.max(width, contentRight) + padX * 2;
  const H = height + padTop + padBottom;
  const Ws = W.toFixed(2);
  const Hs = H.toFixed(2);

  // 3.5) 测量完成，还原 .tag 内联样式（后续仅做字体收集与拼装，不再依赖它）
  restoreTagStyles();

  // 4) 用到的字体族 → 内嵌 data URI 的 @font-face
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

  // 5) 拼装（导出为独立透明公式：不加页面/卡片背景色）
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
      // 虚线（\hdashline 等）：用细长 <line> + stroke-dasharray 表达
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
 *  下载：SVG / PNG（PNG = SVG → canvas 栅格化，背景与页面一致）
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

/** 由 LaTeX 源码生成安全的下载文件名（形如 formula-...svg） */
function formulaFilename(source: HTMLElement, ext: string): string {
  const latex = source.dataset.latex ?? '';
  const slug = latex
    .replace(/[\\{}^_$&%#~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    // 仅保留字母/数字/中文/日文/韩文/希腊文/下划线/连字符（不用 \p{L}，兼容旧浏览器）
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
      img.decode().then(resolve, () => {
        // decode 失败（部分浏览器对 SVG 的兼容问题）时等待 onload 兜底
      });
    }
  });
}

/**
 * 导出公式图片（统一接口）。
 * @param source 携带 data-latex 的公式根元素（.katex 或 .katex-display）
 * @param format 'svg' 直接下载自包含 SVG；'png' 由该 SVG 栅格化
 * @returns 是否导出成功（失败时调用方可提示“下载失败”）
 */
async function exportFormula(source: HTMLElement, format: 'svg' | 'png'): Promise<boolean> {
  try {
    const svg = await buildFormulaSvg(source);
    if (!svg) return false;

    if (format === 'svg') {
      downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), formulaFilename(source, 'svg'));
      return true;
    }

    // PNG：SVG → canvas 栅格化（不填背景色，输出透明 PNG 独立公式）
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
      // 不填充背景：canvas 初始即透明，导出的 PNG 带 alpha 通道
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

/** 还原菜单内联定位（is-open 期间菜单被提升为 fixed 以逃逸祖先 overflow 裁剪） */
function resetMenuInlineStyles(menu: HTMLElement): void {
  menu.style.position = '';
  menu.style.top = '';
  menu.style.left = '';
  menu.style.right = '';
}

/**
 * 把某个展开菜单按触发钮的视口坐标重新定位为 position:fixed：
 * 行间公式块自身是 overflow-x:auto / overflow-y:hidden 的滚动容器（卡片也有
 * overflow:hidden），默认的绝对定位下拉会被裁掉下半截，PNG 项根本点不到；
 * fixed 的包含块是视口，可整体逃逸所有祖先的 overflow 裁剪（前提是祖先链上
 * 无 transform，见 custom.css 中 .katex-actions 的注释）。空间不足时自动翻到
 * 按钮上方；触发钮滚出视口则直接收起该菜单。
 */
function positionOpenMenu(wrap: HTMLElement): void {
  const trigger = wrap.querySelector<HTMLElement>('.katex-download-btn');
  const menu = wrap.querySelector<HTMLElement>('.katex-download-menu');
  if (!trigger || !menu) return;

  const rect = trigger.getBoundingClientRect();
  // 触发钮完全滚出视口 → 收起菜单（fixed 定位已无意义）
  if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) {
    wrap.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    resetMenuInlineStyles(menu);
    return;
  }

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
}

/** 重新定位页面上所有展开的导出菜单（滚动/缩放时跟随触发钮，避免错位） */
function repositionOpenMenus(): void {
  document.querySelectorAll<HTMLElement>('.katex-actions.is-open').forEach(positionOpenMenu);
}

/** 关闭页面上所有打开的导出菜单 */
function closeAllMenus(): void {
  document.querySelectorAll<HTMLElement>('.katex-actions.is-open').forEach((wrap) => {
    wrap.classList.remove('is-open');
    const trigger = wrap.querySelector<HTMLElement>('.katex-download-btn');
    trigger?.setAttribute('aria-expanded', 'false');
    const menu = wrap.querySelector<HTMLElement>('.katex-download-menu');
    if (menu) resetMenuInlineStyles(menu);
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
      positionOpenMenu(wrap);
    } else {
      resetMenuInlineStyles(menu);
    }
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
    const ok = await exportFormula(source, 'svg');
    flash(triggerBtn, triggerIcon, triggerTip, ok, SVG_DONE_LABEL, DOWNLOAD_FAILED_LABEL);
    keepFeedbackVisible();
  });

  pngItem.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuOpen(false);
    const ok = await exportFormula(source, 'png');
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

  // 全局关闭逻辑只绑定一次（SPA 导航复用）：点外部 / Esc 关闭所有菜单；
  // 滚动 / 缩放时菜单跟随触发钮重新定位（按钮滚出视口则由 positionOpenMenu 收起）。
  // 注意：这里用重新定位而非直接关闭 —— 真实点击会触发按钮聚焦滚动，若滚动即关，
  // 菜单会在打开的瞬间被自己关掉（“点不上”）。
  if (!menuDocBound) {
    menuDocBound = true;
    document.addEventListener('click', closeAllMenus);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeAllMenus();
    });
    window.addEventListener('scroll', repositionOpenMenus, { passive: true, capture: true });
    window.addEventListener('resize', repositionOpenMenus);
  }
}
