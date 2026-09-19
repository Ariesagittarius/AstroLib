import { describe, it, expect } from 'vitest';
import {
  PRESET_REGISTRY,
  PRESET_SCHOLARLY,
  DEFAULT_TYPOGRAPHY_PRESET,
  DEFAULT_TYPOGRAPHY_PRESET_ID,
  getTypographyPreset,
  isTypographyPresetId,
  listTypographyPresets,
  StaticFontOnlyForPublishing,
} from '@/publishing/typography/index.ts';

describe('Typography Preset Registry Invariant Contract', () => {
  it('注册表应收敛为恰好 4 套官方学术预设，且包含指定 4 套 ID', () => {
    const registeredKeys = Object.keys(PRESET_REGISTRY);
    expect(registeredKeys).toHaveLength(4);

    const expectedIds = ['scholarly', 'classic', 'mathematical', 'lecture'];
    for (const id of expectedIds) {
      expect(registeredKeys).toContain(id);
    }
  });

  it('严禁出现已弃用的 international 预设', () => {
    expect(PRESET_REGISTRY).not.toHaveProperty('international');
    expect(isTypographyPresetId('international')).toBe(false);
  });

  it('默认预设必须为 scholarly', () => {
    expect(DEFAULT_TYPOGRAPHY_PRESET_ID).toBe('scholarly');
    expect(DEFAULT_TYPOGRAPHY_PRESET).toBe(PRESET_SCHOLARLY);
  });

  it('每套预设必须具备完整的 Schema 契约字段', () => {
    const presets = listTypographyPresets();
    for (const preset of presets) {
      expect(preset.id).toBeDefined();
      expect(preset.category).toBeDefined();
      expect(preset.name).toBeDefined();
      expect(preset.description).toBeDefined();
      expect(preset.targetAudience).toBeDefined();
      expect(preset.chineseBody).toBeDefined();
      expect(preset.chineseHeading).toBeDefined();
      expect(preset.latinText).toBeDefined();
      expect(preset.math).toBeDefined();
      expect(preset.monospace).toBeDefined();
      expect(preset.kaiFont).toBeDefined();
      expect(preset.metrics).toBeDefined();
      expect(preset.guaranteedFallback).toBeDefined();
    }
  });

  it('严禁在出版预设中使用 Variable Font (StaticFontOnlyForPublishing 契约)', () => {
    const presets = listTypographyPresets();
    expect(StaticFontOnlyForPublishing).toBe(true);
    for (const preset of presets) {
      expect(preset.chineseBody.designFamily).not.toMatch(/variable/i);
      expect(preset.latinText.designFamily).not.toMatch(/variable/i);
      expect(preset.math.family).not.toMatch(/variable/i);
    }
  });

  it('边界查询与异常回退行为验证', () => {
    expect(getTypographyPreset('scholarly').id).toBe('scholarly');
    expect(getTypographyPreset('non-existent-preset').id).toBe('scholarly');
    expect(isTypographyPresetId('scholarly')).toBe(true);
    expect(isTypographyPresetId('invalid-id')).toBe(false);
  });
});
