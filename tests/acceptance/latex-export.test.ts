import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  generateLatexDocument,
  formatLatexContent,
} from '@/publishing/latex/latex-generator.ts';
import {
  exportChapterToLatex,
  createChapterZipPackage,
} from '@/publishing/latex/chapter-exporter.ts';
import { validateLatexSyntax } from '../helpers/latex-validators.ts';

describe('LaTeX Export Acceptance Suite', () => {
  const root = path.resolve('.');
  const exFilePath = path.join(root, 'src', 'data', 'exercises', 'engineering_analysis_exercises.json');

  describe('复杂公式排版与格式化规范', () => {
    it('正确转换复杂数理公式与特殊环境', () => {
      const testCases = [
        '已知非负数列 $\\{a_n\\}, \\{b_n\\}, \\{c_n\\}$．且 $\\lim_{n \\to \\infty} a_n = 0$, $\\lim_{n \\to \\infty} b_n = 1$, $\\lim_{n \\to \\infty} c_n = +\\infty$，则 ( )．',
        '$\\lim_{n \\to \\infty} (\\sqrt{n+\\sqrt{n}} - \\sqrt{n-\\sqrt{n}}) = \\underline{\\quad\\quad}$．',
        '$\\lim_{x \\to \\infty} \\frac{3x^2+5}{5x+3} \\sin \\frac{2}{x} = \\underline{\\quad\\quad}$．',
        '$\\int_0^1 \\frac{\\ln(1+x)}{1+x^2} \\mathrm{d}x$',
        '$\\vec{a} \\cdot \\vec{b} = |\\mathbf{a}| |\\mathbf{b}| \\cos \\theta$',
        '$\\left\\{ x \\in \\mathbb{R} \\mid x^2 - 3x + 2 \\leqslant 0 \\right\\}$',
        '$f(x) = \\begin{cases} \\frac{\\sin x}{x}, & x \\ne 0 \\\\ 1, & x = 0 \\end{cases}$',
      ];

      for (const tc of testCases) {
        const res = formatLatexContent(tc);
        expect(res).toBeDefined();
        expect(res).not.toContain('undefined');
        expect(res).not.toContain('§§');
      }
    });
  });

  describe('工科数学分析习题集全章节 LaTeX 生成与语法校验', () => {
    it('全章节习题生成 handout 与 exam 均具备严格的语法平衡与零占位符残留', () => {
      expect(fs.existsSync(exFilePath)).toBe(true);
      const rawEx = JSON.parse(fs.readFileSync(exFilePath, 'utf8'));

      for (const [ch, qList] of Object.entries<any[]>(rawEx.chapters)) {
        const sample = qList.map((q) => ({
          id: q.id,
          type: q.meta?.type || 'calc',
          stem_raw: q.content?.stem || '',
          stem_html: q.content?.stem || '',
          options: (q.content?.options || []).map((o: any) => ({
            key: o.key,
            text_raw: o.text || '',
            text_html: o.text || '',
          })),
          answer: q.solution?.answer || '',
          hints_html: q.solution?.hints || '',
          steps_html: q.solution?.steps || '',
          score: q.meta?.score || 5,
          paper_title: q.source?.raw_title || '',
          kps: q.mapping?.engineering_analysis?.knowledge_points || [],
        }));

        const docHandout = generateLatexDocument(sample as any, {
          template: 'handout',
          title: `工科数学分析 · 第 ${ch} 章 练习册`,
          subtitle: '章节真题精选与自测演练',
          courseName: '工科数学分析',
          answerPlacement: 'appendix',
        });
        const errorsHandout = validateLatexSyntax(docHandout);
        expect(errorsHandout, `第 ${ch} 章 Handout 语法违规`).toEqual([]);

        const docExam = generateLatexDocument(sample as any, {
          template: 'exam',
          title: `工科数学分析 · 第 ${ch} 章 课程自测试卷`,
          subtitle: '全真模拟自测',
          courseName: '工科数学分析',
          writingSpace: 'compact',
          answerPlacement: 'none',
        });
        const errorsExam = validateLatexSyntax(docExam);
        expect(errorsExam, `第 ${ch} 章 Exam 语法违规`).toEqual([]);
      }
    });
  });

  describe('卷头与版面空间模式专项测试 (none / compact / standard)', () => {
    const sampleHeaderQ = [{
      id: 'test-q-1',
      type: 'choice',
      stem_raw: '设 $f(x)$ 连续，则极限 $\\lim_{x \\to 0} f(x)$ 存在．',
      stem_html: '设 $f(x)$ 连续，则极限 $\\lim_{x \\to 0} f(x)$ 存在．',
      options: [
        { key: 'A', text_raw: '正确', text_html: '正确' },
        { key: 'B', text_raw: '错误', text_html: '错误' },
      ],
      answer: 'A',
      score: 5,
    }];

    it('headerMode: none 模式下不包含 \\maketitle 或 \\title，且采用 empty 页面样式', () => {
      const docNone = generateLatexDocument(sampleHeaderQ as any, {
        headerMode: 'none',
        pageNumbering: 'none',
      });
      expect(docNone).not.toMatch(/\\maketitle|\\title\{|\\author\{|\\date\{/);
      expect(docNone).toContain('\\pagestyle{empty}');
    });

    it('headerMode: compact 模式下输出紧凑居中单行卷头', () => {
      const docCompact = generateLatexDocument(sampleHeaderQ as any, {
        headerMode: 'compact',
        title: '高等数学阶段测试',
      });
      expect(docCompact).toContain('{\\large\\sffamily\\bfseries 高等数学阶段测试}');
    });

    it('headerMode: standard 模式下包含学术许可声明且严禁出现商业标识', () => {
      const docStandard = generateLatexDocument(sampleHeaderQ as any, {
        headerMode: 'standard',
        title: '工科数学分析 · 期末测试',
        showSubtitle: true,
        subtitle: '2025 学年标准自测卷',
        showLicense: true,
        licenseText: 'CC BY-NC-SA 4.0',
        showDate: true,
      });
      expect(docStandard).toContain('许可协议：CC BY-NC-SA 4.0');
      expect(docStandard).not.toContain('AstroLib');
    });
  });

  describe('真实教材章节 MDX 导出 book.tex 架构特征与 ZIP 打包', () => {
    const sampleMdxPath = path.join(
      root,
      'src',
      'content',
      'docs',
      'collections',
      'math',
      'engineering_analysis',
      '2.2_求导的基本法则.mdx'
    );
    const mdxSource = fs.readFileSync(sampleMdxPath, 'utf8');

    const exportResult = exportChapterToLatex({
      mdxSource,
      slug: '2.2_求导的基本法则',
      bookSlug: 'engineering_analysis',
      colSlug: 'math',
      bookTitle: '工科数学分析基础（第三版）',
      courseName: '工科数学分析',
      latexConfig: {
        documentclass: 'book',
        mathFont: 'pagella',
      },
    });

    it('导出的 book.tex 具备规范结构与平衡环境', () => {
      expect(exportResult.title).toBeDefined();
      expect(exportResult.assets.length).toBeGreaterThan(0);
      expect(exportResult.tex).toMatch(/\\documentclass\[.*11pt.*twoside.*\]\{book\}/);
      expect(exportResult.tex).toContain('\\setmainfont{TeX Gyre Pagella}');
      const hasPagellaMath =
        exportResult.tex.includes('\\setmathfont{TeX Gyre Pagella Math}') ||
        exportResult.tex.includes('\\setmathfont{texgyrepagella-math.otf}');
      expect(hasPagellaMath).toBe(true);
      expect(exportResult.tex).toContain('\\definecolor{chapterblue}{HTML}{1E3A5F}');
      expect(exportResult.tex).not.toContain('kaobook');
      expect(exportResult.tex).not.toContain('kaobox');

      const syntaxViolations = validateLatexSyntax(exportResult.tex);
      expect(syntaxViolations).toEqual([]);
    });

    it('成功创建包含离线依赖资源的 ZIP 归档包', () => {
      const zipBuffer = createChapterZipPackage(exportResult);
      expect(zipBuffer).toBeInstanceOf(Buffer);
      expect(zipBuffer.length).toBeGreaterThan(1024);
    });
  });
});
