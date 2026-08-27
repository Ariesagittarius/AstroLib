export const FONT_KEY = 'starlight-font';

export type LatinFont = 'sans' | 'serif' | 'katex';

export type CjkFont = 'sans' | 'serif' | 'han-sans' | 'han-serif';

export interface FontPref {
  latin: LatinFont;
  cjk: CjkFont;
}

export const LATIN_PRESETS: { value: LatinFont; label: string }[] = [
  { value: 'sans', label: '无衬线' },
  { value: 'serif', label: '衬线' },
  { value: 'katex', label: 'KaTeX 公式字体' },
];

export const CJK_PRESETS: { value: CjkFont; label: string }[] = [
  { value: 'sans', label: '系统无衬线' },
  { value: 'serif', label: '系统宋体' },
  { value: 'han-sans', label: '思源黑体' },
  { value: 'han-serif', label: '思源宋体' },
];

export const DEFAULT_PREF: FontPref = { latin: 'sans', cjk: 'sans' };

const LEGACY: Record<string, FontPref> = {
  'system-sans': { latin: 'sans', cjk: 'sans' },
  'system-serif': { latin: 'serif', cjk: 'serif' },
  'source-han-sans': { latin: 'sans', cjk: 'han-sans' },
  'source-han-serif': { latin: 'serif', cjk: 'han-serif' },
};

const isLatin = (v: unknown): v is LatinFont => v === 'sans' || v === 'serif' || v === 'katex';
const isCjk = (v: unknown): v is CjkFont =>
  v === 'sans' || v === 'serif' || v === 'han-sans' || v === 'han-serif';

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

export function loadFontPref(): FontPref {
  try {
    const raw = localStorage.getItem(FONT_KEY);
    if (!raw) return { ...DEFAULT_PREF };

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }
    return parseFontPref(parsed);
  } catch {
    return { ...DEFAULT_PREF };
  }
}

export function saveFontPref(pref: FontPref): void {
  try {
    localStorage.setItem(FONT_KEY, JSON.stringify(pref));
  } catch {

  }
}

export function applyFontPref(pref: FontPref): void {
  document.documentElement.dataset.fontLatin = pref.latin;
  document.documentElement.dataset.fontCjk = pref.cjk;
}

export function clearFontPref(): void {
  document.documentElement.removeAttribute('data-font-latin');
  document.documentElement.removeAttribute('data-font-cjk');
}
