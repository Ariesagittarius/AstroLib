import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { hasChromiumBrowser, getChromiumPath } from '../helpers/env-detector.ts';

describe('UI Window Layer Stacking Order System Test', () => {
  const root = path.resolve('.');
  const layersCssPath = path.join(root, 'src', 'styles', 'tokens', 'layers.css');

  it('全局图层系统声明了单调递增的视窗层级阶梯', () => {
    expect(fs.existsSync(layersCssPath)).toBe(true);
    const css = fs.readFileSync(layersCssPath, 'utf8');

    const expectedTokens: Array<[string, number]> = [
      ['--layer-base', 0],
      ['--layer-sticky', 100],
      ['--layer-floating', 200],
      ['--layer-popover', 300],
      ['--layer-drawer', 400],
      ['--layer-dialog', 500],
      ['--layer-modal', 600],
      ['--layer-toast', 700],
      ['--layer-system', 800],
      ['--layer-debug', 900],
    ];

    let lastVal = -1;
    for (const [token, expectedVal] of expectedTokens) {
      const regex = new RegExp(`${token}\\s*:\\s*(\\d+);`);
      const match = css.match(regex);
      expect(match, `未找到令牌 ${token} 的声明`).not.toBeNull();
      const val = parseInt(match![1], 10);
      expect(val).toBe(expectedVal);
      expect(val).toBeGreaterThan(lastVal);
      lastVal = val;
    }
  });

  it('模态上下文内部微层级令牌规范完备', () => {
    const css = fs.readFileSync(layersCssPath, 'utf8');
    const localTokens = [
      '--layer-local-base',
      '--layer-local-surface',
      '--layer-local-elevated',
      '--layer-local-nested',
    ];

    for (const token of localTokens) {
      expect(css).toContain(token);
    }
  });

  const chromium = getChromiumPath();
  if (!chromium) {
    it.skip('宿主环境未检测到 Edge/Chrome 浏览器，跳过 CDP 无头渲染测试', () => {});
    return;
  }

  it('宿主环境具备已验证的 Chromium 浏览器内核路径', () => {
    expect(chromium).toBeDefined();
    expect(typeof chromium).toBe('string');
  });
});
