import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { NodeCompiler } from '@myriaddreamin/typst-ts-node-compiler';
import { generateTypstDocument } from '@/publishing/typst/typst-generator.ts';

describe('Typst Full Generation System Test', () => {
  const root = path.resolve('.');
  const dataFile = path.join(root, 'src', 'data', 'exercises', 'engineering_analysis_exercises.json');

  it('多章节抽样习题经 Typst 原生引擎可在内存中成功渲染为多页 PDF', () => {
    expect(fs.existsSync(dataFile)).toBe(true);
    const rawData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

    // 选取跨多个章节的一组题目
    const questions: any[] = [];
    for (const [ch, qList] of Object.entries<any[]>(rawData.chapters)) {
      if (qList.length > 0) {
        questions.push(...qList.slice(0, 3));
      }
      if (questions.length >= 15) break;
    }

    expect(questions.length).toBeGreaterThanOrEqual(10);

    const formattedQuestions = questions.map((q) => ({
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

    const typstDoc = generateTypstDocument(formattedQuestions as any, {
      template: 'exam',
      title: '工科数学分析多章节全真抽样自测',
      subtitle: '跨章节综合测评卷',
      courseName: '工科数学分析',
    });

    const compiler = NodeCompiler.create();
    const pdfBytes = compiler.pdf({ mainFileContent: typstDoc });

    expect(pdfBytes).toBeDefined();
    expect(pdfBytes.length).toBeGreaterThan(5000);

    const pdfHeader = Buffer.from(pdfBytes.slice(0, 5)).toString('ascii');
    expect(pdfHeader).toContain('%PDF-');
  });
});
