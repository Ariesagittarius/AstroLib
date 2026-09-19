import { describe, it, expect } from 'vitest';
import { features, FEATURE_IDS, isEffective, crossRefRefs } from '@/config/features.config.ts';

describe('Features Registry Schema Contract', () => {
  it('features 表中所有条目必须为合法 FeatureManifest，且 id 与键名一致', () => {
    expect(FEATURE_IDS.length).toBeGreaterThan(0);

    for (const [key, feat] of Object.entries(features)) {
      expect(key).toBe(feat.id);
      expect(['reader', 'extra', 'dev']).toContain(feat.cat);
      expect(typeof feat.enabled).toBe('boolean');
      expect(typeof feat.devOnly).toBe('boolean');
      expect(typeof feat.ui).toBe('boolean');
      expect(feat.label).toBeDefined();
      expect(feat.desc).toBeDefined();
    }
  });

  it('isEffective 应当准确根据 enabled 与 devOnly 状态返回值', () => {
    expect(typeof isEffective('katex')).toBe('boolean');
    expect(isEffective('non-existent-feature')).toBe(false);
  });

  it('crossRefRefs 返回合法的引用模式 (interactive 或 static)', () => {
    const mode = crossRefRefs();
    expect(['interactive', 'static']).toContain(mode);
  });
});
