/**
 * 字体偏好（读者可选）—— 中西文两栏独立选择
 * ==========================================================================
 * 原「单一档位」data-font="preset"（system-sans / system-serif / source-han-*）改为
 * 两个独立偏好，让读者分别挑英文（拉丁段）与中文（CJK 段）的字体：
 *   · 拉丁段 <html data-font-latin="…">：'sans' | 'serif' | 'katex'
 *   · 中文段 <html data-font-cjk="…"> ：'sans' | 'serif' | 'han-sans' | 'han-serif'
 * 应用后的字体栈 = [拉丁段], [中文段] 两条顺序 fallback：英文/数字落拉丁段，汉字回退中文段
 * （见 src/styles/fonts.css）。
 *
 * 存储：localStorage 'starlight-font' 存 JSON { latin, cjk }。
 * 旧字符串档位（如 'source-han-serif'）在此自动迁移成新结构，已选读者的偏好不丢。
 *
 * 本模块同时被 FontSelectOverride.astro（<script>）与 feature-toggles.ts 复用，
 * 必须是【纯 ESM、引用 localStorage/document 只在函数体内（运行时调用）】的模块，
 * 以便 Astro 前序（SSR/build）也能安全 import 其导出（无顶层副作用）。
 */

/** 读者字体偏好存储键（沿用原键名，值为 JSON { latin, cjk }） */
export const FONT_KEY = 'starlight-font';

/** 拉丁段可选值：无衬线 / 衬线 / KaTeX 公式字体 */
export type LatinFont = 'sans' | 'serif' | 'katex';
/** 中文段可选值：系统无衬线 / 系统宋体 / 思源黑体 / 思源宋体 */
export type CjkFont = 'sans' | 'serif' | 'han-sans' | 'han-serif';
/** 完整字体偏好 */
export interface FontPref {
  latin: LatinFont;
  cjk: CjkFont;
}

/** 英文（拉丁）栏选项：顺序即面板显示顺序 */
export const LATIN_PRESETS: { value: LatinFont; label: string }[] = [
  { value: 'sans', label: '无衬线' },
  { value: 'serif', label: '衬线' },
  { value: 'katex', label: 'KaTeX 公式字体' },
];

/** 中文（CJK）栏选项：顺序即面板显示顺序 */
export const CJK_PRESETS: { value: CjkFont; label: string }[] = [
  { value: 'sans', label: '系统无衬线' },
  { value: 'serif', label: '系统宋体' },
  { value: 'han-sans', label: '思源黑体' },
  { value: 'han-serif', label: '思源宋体' },
];

/** 默认偏好：无衬线拉丁 + 无衬线中文（零下载） */
export const DEFAULT_PREF: FontPref = { latin: 'sans', cjk: 'sans' };

/** 旧单一档位字符串 → 新 { latin, cjk }（迁移用） */
const LEGACY: Record<string, FontPref> = {
  'system-sans': { latin: 'sans', cjk: 'sans' },
  'system-serif': { latin: 'serif', cjk: 'serif' },
  'source-han-sans': { latin: 'sans', cjk: 'han-sans' },
  'source-han-serif': { latin: 'serif', cjk: 'han-serif' },
};

const isLatin = (v: unknown): v is LatinFont => v === 'sans' || v === 'serif' || v === 'katex';
const isCjk = (v: unknown): v is CjkFont =>
  v === 'sans' || v === 'serif' || v === 'han-sans' || v === 'han-serif';

/** 把任意值解析为合法 FontPref（非法值回退默认；旧字符串档位走 LEGACY 迁移）。 */
export function parseFontPref(v: unknown): FontPref {
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return {
      latin: isLatin(o.latin) ? o.latin : DEFAULT_PREF.latin,
      cjk: isCjk(o.cjk) ? o.cjk : DEFAULT_PREF.cjk,
    };
  }
  if (typeof v === 'string' && LEGACY[v]) return { ...LEGACY[v] };
  return { ...DEFAULT_PREF };
}

/** 读取读者字体偏好（旧字符串档位自动迁移成 { latin, cjk }）。 */
export function loadFontPref(): FontPref {
  try {
    const raw = localStorage.getItem(FONT_KEY);
    if (!raw) return { ...DEFAULT_PREF };
    // 兼容旧字符串档位（如 'system-sans'）：JSON.parse 会抛错，此时把原值交给
    // parseFontPref 走 LEGACY 迁移。新格式 JSON 直接解析。
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }
    return parseFontPref(parsed);
  } catch {
    return { ...DEFAULT_PREF }; // 读不到/解析失败按默认
  }
}

/** 持久化读者字体偏好。 */
export function saveFontPref(pref: FontPref): void {
  try {
    localStorage.setItem(FONT_KEY, JSON.stringify(pref));
  } catch {
    /* 忽略（隐私模式等） */
  }
}

/** 应用到 <html data-font-latin / data-font-cjk>（CSS 级联的基准）。 */
export function applyFontPref(pref: FontPref): void {
  document.documentElement.dataset.fontLatin = pref.latin;
  document.documentElement.dataset.fontCjk = pref.cjk;
}

/** 清除字体覆盖（fonts 功能关闭时回系统默认）。 */
export function clearFontPref(): void {
  document.documentElement.removeAttribute('data-font-latin');
  document.documentElement.removeAttribute('data-font-cjk');
}
