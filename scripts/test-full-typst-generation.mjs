import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeCompiler } from '@myriaddreamin/typst-ts-node-compiler';
import {
  generateTypstDocument,
  convertLatexToTypst,
  convertLatexMathToTypst
} from '../src/utils/typst/typst-generator.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EX_FILE = path.join(ROOT, 'src', 'data', 'exercises', 'engineering_analysis_exercises.json');
const DB_FILE = path.join(ROOT, 'src', 'data', 'exercises', 'bupt_math_full_database.json');

const rawEx = JSON.parse(fs.readFileSync(EX_FILE, 'utf8'));
const rawDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const compiler = NodeCompiler.create();

console.log('=== 全量测试 1: 工科数分 1511 题按章节测试 ===');
let chPassed = 0;
let chFailed = 0;

for (const [ch, qList] of Object.entries(rawEx.chapters)) {
  const sample = qList.map(q => ({
    id: q.id,
    type: q.meta?.type || 'calc',
    stem_raw: q.content?.stem || '',
    stem_html: q.content?.stem || '',
    options: (q.content?.options || []).map(o => ({ key: o.key, text_raw: o.text || '', text_html: o.text || '' })),
    answer: q.solution?.answer || '',
    hints_html: q.solution?.hints || '',
    steps_html: q.solution?.steps || '',
    score: q.meta?.score || 5,
    paper_title: q.source?.raw_title || '',
    kps: q.mapping?.engineering_analysis?.knowledge_points || []
  }));

  try {
    // 测试 handout 模板
    const docHandout = generateTypstDocument(sample, {
      template: 'handout',
      title: `第 ${ch} 章 练习`,
      courseName: '工科数学分析'
    });
    compiler.pdf({ mainFileContent: docHandout });

    // 测试 exam 模板
    const docExam = generateTypstDocument(sample, {
      template: 'exam',
      title: `第 ${ch} 章 自测模拟`,
      courseName: '工科数学分析',
      writingSpace: 'compact'
    });
    compiler.pdf({ mainFileContent: docExam });

    console.log(`✅ 第 ${ch} 章 (${qList.length} 题) 编译成功！`);
    chPassed += qList.length;
  } catch (err) {
    chFailed += qList.length;
    console.error(`❌ 第 ${ch} 章 编译失败:`, err.code || err.message);
  }
}

console.log(`\n=== 全量测试 2: bupt_math_full_database 2915 题全量编译 ===`);
let dbPass = 0;
let dbFail = 0;
const dbQuestions = rawDb.questions || rawDb;

for (let i = 0; i < dbQuestions.length; i += 50) {
  const batch = dbQuestions.slice(i, i + 50).map((q, idx) => ({
    id: q.id || `Q-${i + idx}`,
    type: q.meta?.type || 'calc',
    stem_raw: q.content?.stem || '',
    stem_html: q.content?.stem || '',
    options: (q.content?.options || []).map(o => ({ key: o.key, text_raw: o.text || '', text_html: o.text || '' })),
    answer: q.solution?.answer || '',
    hints_html: q.solution?.hints || '',
    steps_html: q.solution?.steps || '',
    score: q.meta?.score || 5,
    paper_title: q.source?.raw_title || '',
    kps: q.mapping?.engineering_analysis?.knowledge_points || []
  }));

  try {
    const doc = generateTypstDocument(batch, {
      template: 'handout',
      title: `Batch ${i / 50 + 1}`,
      courseName: '数学分析'
    });
    compiler.pdf({ mainFileContent: doc });
    dbPass += batch.length;
  } catch (err) {
    dbFail += batch.length;
    console.error(`❌ Batch ${i / 50 + 1} 编译失败:`, err.code || err.message);
  }
}

console.log(`\n======================================================`);
console.log(`工科数分章节汇总: ${chPassed} 题通过, ${chFailed} 题失败`);
console.log(`题库全量批量汇总: ${dbPass} 题通过, ${dbFail} 题失败`);
console.log(`======================================================`);
