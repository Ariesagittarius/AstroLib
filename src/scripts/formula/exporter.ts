const PNG_SCALE = 2;

export function escapeXmlText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\u00a0/g, '&#160;');
}

export function escapeXmlAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface FontFaceInfo {
  family: string;
  weight: string;
  style: string;
  url: string;
  format: string;
}

let katexFontFacesCache: FontFaceInfo[] | null = null;

const fontDataUriCache = new Map<string, string>();

export function firstFamily(fontFamily: string): string {
  const f = (fontFamily || '').split(',')[0].trim().replace(/['"]/g, '');
  return f || '';
}

export function collectKatexAssets(): FontFaceInfo[] {
  if (katexFontFacesCache) return katexFontFacesCache;

  const faces: FontFaceInfo[] = [];
  const seen = new Set<string>();

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | null = null;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    if (!rules) continue;

    const base = sheet.href ? new URL(sheet.href, location.href).href : location.href;

    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      const family = (rule.style.getPropertyValue('font-family') || '').replace(/['"]/g, '').trim();
      const src = rule.style.getPropertyValue('src') || '';
      if (!family || !src) continue;

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

function formatTokenFor(mime: string): string {
  if (mime.includes('woff2')) return 'woff2';
  if (mime.includes('woff')) return 'woff';
  if (mime.includes('truetype') || mime.includes('ttf')) return 'truetype';
  if (mime.includes('opentype') || mime.includes('otf')) return 'opentype';
  return 'woff2';
}

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
    return null;
  }
}

export function usedFontFamilies(target: HTMLElement): Set<string> {
  const families = new Set<string>();
  const nodes: Element[] = [target, ...Array.from(target.querySelectorAll('*'))];
  for (const node of nodes) {
    const first = firstFamily(getComputedStyle(node).fontFamily);
    if (first) families.add(first);
  }
  return families;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([p, new Promise<undefined>((resolve) => window.setTimeout(() => resolve(undefined), ms))]);
}

export async function ensureFontsReady(target: HTMLElement): Promise<void> {
  if (typeof document.fonts?.ready !== 'object' || typeof document.fonts.load !== 'function') return;
  try {
    await withTimeout(document.fonts.ready, 3000);
  } catch {

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

  }
  return { ascent: em * 0.75, descent: em * 0.25 };
}

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

export async function buildFormulaSvg(source: HTMLElement): Promise<string | null> {
  const target = source.classList.contains('katex-display')
    ? (source.querySelector('.katex') as HTMLElement | null) ?? source
    : source;

  await ensureFontsReady(target);

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

  const pad = Math.max(6, Math.ceil(maxFontSize * 0.15));
  const padX = pad;
  const padTop = pad + 2;
  const padBottom = pad;

  const W = Math.max(width, contentRight) + padX * 2;
  const H = height + padTop + padBottom;
  const Ws = W.toFixed(2);
  const Hs = H.toFixed(2);

  restoreTagStyles();

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

export async function exportFormula(source: HTMLElement, format: 'svg' | 'png'): Promise<boolean> {
  try {
    const svg = await buildFormulaSvg(source);
    if (!svg) return false;

    if (format === 'svg') {
      downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), formulaFilename(source, 'svg'));
      return true;
    }

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

export async function exportFormulaSvg(source: HTMLElement): Promise<boolean> {
  return exportFormula(source, 'svg');
}

export async function exportFormulaPng(source: HTMLElement): Promise<boolean> {
  return exportFormula(source, 'png');
}
