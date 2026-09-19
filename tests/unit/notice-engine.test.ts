import { describe, it, expect } from 'vitest';
import {
  resolveNotices,
  createNotice,
  interpolateText,
  NOTICE_TEMPLATES,
  NOTICE_PRESETS,
} from '@/config/notices.config.ts';

describe('Notice Framework Engine (Unit Tests)', () => {
  it('should correctly interpolate parameters and handle fallbacks in interpolateText', () => {
    const text1 = interpolateText('由 {author} 基于 {model} 生成', {
      author: '张三',
      model: 'Claude 3.7',
    });
    expect(text1).toBe('由 张三 基于 Claude 3.7 生成');

    const text2 = interpolateText('版本: {version|v1.0}, 状态: {status}', { status: '定稿' });
    expect(text2).toBe('版本: v1.0, 状态: 定稿');

    const text3 = interpolateText('未提供参数: {unknown}', {});
    expect(text3).toBe('未提供参数: {unknown}');
  });

  it('should override notice template fields with custom parameters', () => {
    const result = resolveNotices([
      {
        template: 'aiGenerated',
        model: 'Gemini 1.5 Pro',
        visualModel: 'Nougat-v0.5',
      },
    ]);
    expect(result.length).toBe(1);
    const notice = result[0];
    expect(notice.message).toContain('Gemini 1.5 Pro');
    expect(notice.tags).toContain('Gemini 1.5 Pro');
    expect(notice.items.some((i: any) => i.text.includes('Nougat-v0.5'))).toBe(true);
    expect(notice.id).toBe('ai-generated');
    expect(notice.variant).toBe('wiki');
  });

  it('should cascade notices with later overrides having higher precedence', () => {
    const collectionNotice = createNotice('aiGenerated', { model: 'GPT-4' });
    const bookNotice = createNotice('aiGenerated', { model: 'Gemini 2.0 Flash' });

    const resolved = resolveNotices([collectionNotice], [bookNotice]);
    expect(resolved.length).toBe(1);
    expect(resolved[0].message).toContain('Gemini 2.0 Flash');
  });

  it('should support disabling notices dynamically', () => {
    const notice = createNotice('aiGenerated', { disabled: true });
    const resolved = resolveNotices([notice]);
    expect(resolved.length).toBe(0);
  });
});
