import { describe, it, expect, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { getXelatexCmd } from '../helpers/env-detector.ts';
import { renderChapterLatexDocument } from '@/publishing/latex/latex-generator.ts';

describe('Typography Specimen XeLaTeX Compilation System Test', () => {
  const xelatexCmd = getXelatexCmd();
  const tmpDir = path.join(os.tmpdir(), `astrolib-specimen-${Date.now()}`);

  afterAll(() => {
    try {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    } catch {

    }
  });

  if (!xelatexCmd) {
    it.skip('本地环境未检测到 xelatex 编译器，优雅跳过物理 PDF 渲染测试', () => {});
    return;
  }

  it('使用本地 XeLaTeX 编译器双通编译学术排版样式', () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    const texSource = renderChapterLatexDocument(
      {
        title: '学术排版样本测试',
        cleanTitle: '学术排版样本测试',
        slug: 'specimen-test',
        images: [],
        blocks: [
          {
            kind: 'paragraph',
            raw: '本章节用于验证 XeLaTeX 物理排版引擎下的中西文混合排版与公式渲染。设函数 $f(x)$ 满足 $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$。',
          } as any,
        ],
      },
      {
        mathFont: 'pagella',
        paperSize: 'a4',
        fontSize: 11,
      }
    );

    const texPath = path.join(tmpDir, 'specimen.tex');
    fs.writeFileSync(texPath, texSource, 'utf8');

    execSync(`"${xelatexCmd}" -file-line-error -interaction=nonstopmode specimen.tex`, {
      cwd: tmpDir,
      stdio: 'pipe',
    });

    execSync(`"${xelatexCmd}" -file-line-error -interaction=nonstopmode specimen.tex`, {
      cwd: tmpDir,
      stdio: 'pipe',
    });

    const pdfPath = path.join(tmpDir, 'specimen.pdf');
    expect(fs.existsSync(pdfPath)).toBe(true);

    const stat = fs.statSync(pdfPath);
    expect(stat.size).toBeGreaterThan(1000);
  });
});
