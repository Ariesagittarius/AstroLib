import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { NodeCompiler } from '@myriaddreamin/typst-ts-node-compiler';
import {
  generateTypstDocument,
  convertLatexToTypst,
  convertLatexMathToTypst,
} from '@/publishing/typst/typst-generator.ts';

describe('Typst Export Acceptance Suite', () => {
  const root = path.resolve('.');
  const dataFile = path.join(root, 'src', 'data', 'exercises', 'engineering_analysis_exercises.json');

  describe('典型数学公式 LaTeX -> Typst 语法转换', () => {
    it('正确转换典型极限、微积分与分段函数公式', () => {
      const testCases = [
        {
          input: '已知非负数列 $\\{a_n\\}, \\{b_n\\}, \\{c_n\\}$．且 $\\lim_{n \\to \\infty} a_n = 0$',
          mustNotContain: ['§§', 'undefined'],
        },
        {
          input: '$\\lim_{n \\to \\infty} (\\sqrt{n+\\sqrt{n}} - \\sqrt{n-\\sqrt{n}}) = \\underline{\\quad\\quad}$．',
          mustNotContain: ['\\underline', '§§'],
        },
        {
          input: '$\\int_0^1 \\frac{\\ln(1+x)}{1+x^2} \\mathrm{d}x$',
          mustNotContain: ['\\int', '\\frac', '\\mathrm'],
        },
        {
          input: '$f(x) = \\begin{cases} \\frac{\\sin x}{x}, & x \\ne 0 \\\\ 1, & x = 0 \\end{cases}$',
          mustNotContain: ['\\begin{cases}', '\\end{cases}'],
        },
      ];

      for (const tc of testCases) {
        const converted = convertLatexToTypst(tc.input);
        expect(converted).toBeDefined();
        for (const bad of tc.mustNotContain) {
          expect(converted).not.toContain(bad);
        }
      }
    });

    it('数学模式直接转换函数正确处理分式与符号', () => {
      const math = convertLatexMathToTypst('\\frac{a+b}{c-d} \\le \\alpha');
      expect(math).toContain('frac(a+b, c-d)');
      expect(math).not.toContain('\\frac');
    });
  });

  describe('全量题库转换零占位符残留审计', () => {
    it('全书所有习题经转换后均无未解析占位符', () => {
      expect(fs.existsSync(dataFile)).toBe(true);
      const rawData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

      const errors: Array<{ id: string; err: string }> = [];

      for (const [ch, qList] of Object.entries<any[]>(rawData.chapters)) {
        for (const q of qList) {
          try {
            const stemTyp = convertLatexToTypst(q.content?.stem || '');
            const ansTyp = convertLatexToTypst(q.solution?.answer || '');

            if (
              stemTyp.includes('TYPST_') ||
              stemTyp.includes('\\#box') ||
              stemTyp.includes('___TYPST') ||
              stemTyp.includes('§§')
            ) {
              errors.push({ id: q.id, err: `stem 包含未解析占位符` });
            }
            if (
              ansTyp.includes('TYPST_') ||
              ansTyp.includes('___TYPST') ||
              ansTyp.includes('§§')
            ) {
              errors.push({ id: q.id, err: `answer 包含未解析占位符` });
            }
          } catch (e: any) {
            errors.push({ id: q.id, err: e.message });
          }
        }
      }

      expect(errors).toEqual([]);
    });
  });

  describe('完整 Typst 试卷/练习册生成与原生 NodeCompiler 编译', () => {
    const rawData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const sampleQuestions = rawData.chapters['1'].slice(0, 10).map((q: any) => ({
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

    it('生成 exam 模考卷并通过 Typst 编译器排版生成有效 PDF 字节流', () => {
      const examTypst = generateTypstDocument(sampleQuestions, {
        template: 'exam',
        title: '期末模拟自测试卷',
        courseName: '工科数学分析',
      });
      expect(examTypst).toContain('#set document(');

      const compiler = NodeCompiler.create();
      const pdfBytes = compiler.pdf({ mainFileContent: examTypst });
      expect(pdfBytes).toBeDefined();
      expect(pdfBytes.length).toBeGreaterThan(1000);

      const header = Buffer.from(pdfBytes.slice(0, 5)).toString('ascii');
      expect(header).toContain('%PDF-');
    });

    it('生成 handout 练习册并通过 Typst 编译器排版生成有效 PDF 字节流', () => {
      const handoutTypst = generateTypstDocument(sampleQuestions, {
        template: 'handout',
        title: '第 1 章 极限与连续',
        courseName: '工科数学分析',
      });
      expect(handoutTypst).toContain('#set document(');

      const compiler = NodeCompiler.create();
      const pdfBytes = compiler.pdf({ mainFileContent: handoutTypst });
      expect(pdfBytes).toBeDefined();
      expect(pdfBytes.length).toBeGreaterThan(1000);
      const header = Buffer.from(pdfBytes.slice(0, 5)).toString('ascii');
      expect(header).toContain('%PDF-');
    });
  });
});
