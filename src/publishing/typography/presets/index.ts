import type { TypographyPreset, TypographyPresetId } from '../types.ts';
import { PRESET_SCHOLARLY } from './scholarly.ts';
import { PRESET_CLASSIC } from './classic.ts';
import { PRESET_MATHEMATICAL } from './mathematical.ts';
import { PRESET_LECTURE } from './lecture.ts';

export { PRESET_SCHOLARLY } from './scholarly.ts';
export { PRESET_CLASSIC } from './classic.ts';
export { PRESET_MATHEMATICAL } from './mathematical.ts';
export { PRESET_LECTURE } from './lecture.ts';

export const DEFAULT_TYPOGRAPHY_PRESET_ID: TypographyPresetId = 'scholarly';
export const DEFAULT_TYPOGRAPHY_PRESET: TypographyPreset = PRESET_SCHOLARLY;

export const PRESET_REGISTRY: Readonly<Record<TypographyPresetId, TypographyPreset>> = Object.freeze({
  scholarly: PRESET_SCHOLARLY,
  classic: PRESET_CLASSIC,
  mathematical: PRESET_MATHEMATICAL,
  lecture: PRESET_LECTURE,
});

export function isTypographyPresetId(val: unknown): val is TypographyPresetId {
  return typeof val === 'string' && Object.prototype.hasOwnProperty.call(PRESET_REGISTRY, val);
}

export function getTypographyPreset(id: unknown, fallbackToDefault: boolean = true): TypographyPreset {
  if (isTypographyPresetId(id)) {
    return PRESET_REGISTRY[id];
  }
  if (fallbackToDefault) {
    return DEFAULT_TYPOGRAPHY_PRESET;
  }
  const validIds = Object.keys(PRESET_REGISTRY).join(', ');
  throw new Error(`[Typography Preset Registry] 未知预设 ID: "${String(id)}"。官方合法预设包含: [${validIds}]`);
}

export function listTypographyPresets(): TypographyPreset[] {
  return [
    PRESET_SCHOLARLY,
    PRESET_CLASSIC,
    PRESET_MATHEMATICAL,
    PRESET_LECTURE,
  ];
}
