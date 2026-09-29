import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Academic Algorithm Block & Typography Invariant Contract', () => {
  const rootDir = process.cwd();
  const componentPath = path.join(rootDir, 'src/components/Algorithm.astro');
  const customCssPath = path.join(rootDir, 'src/styles/custom.css');
  const algosDir = path.join(rootDir, 'src/content/docs/collections/cs/algorithms');

  it('Algorithm.astro 组件必须物理存在并符合学术 LaTeX ruled 规范', () => {
    expect(fs.existsSync(componentPath)).toBe(true);
    const code = fs.readFileSync(componentPath, 'utf-8');

    // 必须包含顶底粗线、无圆角、无背景、强制 text-indent: 0
    expect(code).toContain('border-top: 2px solid');
    expect(code).toContain('border-bottom: 2px solid');
    expect(code).toContain('border-radius: 0 !important');
    expect(code).toContain('background-color: transparent !important');
    expect(code).toContain('text-indent: 0 !important');
    expect(code).toContain('white-space: pre-wrap');
    expect(code).toContain('algorithm-caption');
    expect(code).toContain('algorithm-body');
  });

  it('custom.css 核心防御 3 必须收录算法块并杜绝全局段落首行缩进泄漏', () => {
    const css = fs.readFileSync(customCssPath, 'utf-8');

    expect(css).toContain('.academic-algorithm');
    expect(css).toContain('.mineru-algorithm');
    expect(css).toContain('.algorithm-body');
    expect(css).toContain('.algorithm-caption');

    // 核心防御 3 reset
    expect(css).toMatch(/\.academic-algorithm[\s\S]*?text-indent:\s*0\s*!important/);
  });

  it('cs/algorithms 目录下所有算法必须全部收敛至 <Algorithm> 组件，零残留 <div class="mineru-algorithm">', () => {
    const files = fs.readdirSync(algosDir).filter((f) => f.endsWith('.mdx'));
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const content = fs.readFileSync(path.join(algosDir, file), 'utf-8');
      expect(content).not.toContain('<div class="mineru-algorithm">');
    }
  });

  it('01.3_primality-testing.mdx (Figure 1.7) 必须正确采用 <Algorithm> 并保留前缀标题', () => {
    const content = fs.readFileSync(path.join(algosDir, '01.3_primality-testing.mdx'), 'utf-8');
    expect(content).toContain('<Algorithm title="Figure 1.7 An algorithm for testing primality.">');
    expect(content).toContain('function primality');
    expect(content).toContain('a^{N-1} \\equiv 1 \\pmod{N}');
  });

  it('06.6_shortest-paths.mdx (Floyd-Warshall 与 TSP) 必须正确采用 <Algorithm> 并具备正确的伪代码层级缩进', () => {
    const content = fs.readFileSync(path.join(algosDir, '06.6_shortest-paths.mdx'), 'utf-8');

    // Floyd-Warshall 算法块
    expect(content).toContain('for $i = 1$ to $n$:');
    expect(content).toContain('    for $j = 1$ to $n$:');
    expect(content).toContain('        $\\text{dist}(i, j, 0) = \\infty$');
    expect(content).toContain('            $\\text{dist}(i, j, k) = \\min\\{\\text{dist}(i, k, k - 1) + \\text{dist}(k, j, k - 1), \\text{dist}(i, j, k - 1)\\}');

    // TSP 算法块
    expect(content).toContain('$C(\\{1\\}, 1) = 0$');
    expect(content).toContain('for $s = 2$ to $n$:');
    expect(content).toContain('    for all subsets $S \\subseteq \\{1, 2, \\ldots, n\\}$ of size s and containing 1:');
    expect(content).toContain('return $\\min_j C(\\{1, \\ldots, n\\}, j) + d_{j1}$');
  });
});
