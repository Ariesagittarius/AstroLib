import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeCompiler } from '@myriaddreamin/typst-ts-node-compiler';
import { generateTypstDocument, convertLatexToTypst, convertLatexMathToTypst } from '../src/utils/typst/typst-generator.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'src', 'data', 'exercises', 'engineering_analysis_exercises.json');
const compiler = NodeCompiler.create();

const rawData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
console.log('Total chapters:', Object.keys(rawData.chapters).length);

console.log('--- 测试典型公式转换 ---');
const testCases = [
  '已知非负数列 $\\{a_n\\}, \\{b_n\\}, \\{c_n\\}$．且 $\\lim_{n \\to \\infty} a_n = 0$, $\\lim_{n \\to \\infty} b_n = 1$, $\\lim_{n \\to \\infty} c_n = +\\infty$，则 ( )．',
  '$\\lim_{n \\to \\infty} (\\sqrt{n+\\sqrt{n}} - \\sqrt{n-\\sqrt{n}}) = \\underline{\\quad\\quad}$．',
  '$\\lim_{x \\to \\infty} \\frac{3x^2+5}{5x+3} \\sin \\frac{2}{x} = \\underline{\\quad\\quad}$．',
  '$\\int_0^1 \\frac{\\ln(1+x)}{1+x^2} \\mathrm{d}x$',
  '$\\vec{a} \\cdot \\vec{b} = |\\mathbf{a}| |\\mathbf{b}| \\cos \\theta$',
  '$\\left\\{ x \\in \\mathbb{R} \\mid x^2 - 3x + 2 \\leqslant 0 \\right\\}$',
  '$f(x) = \\begin{cases} \\frac{\\sin x}{x}, & x \\ne 0 \\\\ 1, & x = 0 \\end{cases}$'
];

testCases.forEach((tc, idx) => {
  console.log(`Case ${idx + 1} 原文:`, tc);
  console.log(`Case ${idx + 1} 转换:`, convertLatexToTypst(tc));
  console.log('');
});

console.log('--- 全量扫描题库 ---');
let totalQuestions = 0;
let errors = [];

for (const [ch, qList] of Object.entries(rawData.chapters)) {
  for (const q of qList) {
    totalQuestions++;
    try {
      const stemTyp = convertLatexToTypst(q.content?.stem || '');
      const ansTyp = convertLatexToTypst(q.solution?.answer || '');
      if (stemTyp.includes('TYPST_') || stemTyp.includes('\\#box') || stemTyp.includes('___TYPST') || stemTyp.includes('§§')) {
        errors.push({ id: q.id, err: '包含未解析的占位符', text: stemTyp });
      }
    } catch (e) {
      errors.push({ id: q.id, err: e.message });
    }
  }
}

console.log(`总共检查题目: ${totalQuestions} 题`);
console.log(`异常/占位符残留: ${errors.length} 处`);
if (errors.length > 0) {
  console.error('发现异常题目:', errors.slice(0, 5));
} else {
  console.log('✅ 全量题目转换通过，零占位符残留！');
}

const sampleQuestions = rawData.chapters['1'].slice(0, 15).map(q => ({
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

const examTypst = generateTypstDocument(sampleQuestions, { template: 'exam', title: '期末模拟自测试卷', courseName: '工科数学分析' });
const handoutTypst = generateTypstDocument(sampleQuestions, { template: 'handout', title: '第 1 章 极限与连续', courseName: '工科数学分析' });

fs.writeFileSync(path.join(ROOT, 'public', 'test_exam_output.typ'), examTypst, 'utf8');
fs.writeFileSync(path.join(ROOT, 'public', 'test_handout_output.typ'), handoutTypst, 'utf8');
console.log('✅ 已生成测试文件至 public/test_exam_output.typ 和 public/test_handout_output.typ');

console.log('--- 运行原生 Typst 编译器进行排版与编译验证 ---');
try {
  compiler.pdf({ mainFileContent: examTypst });
  console.log('✅ test_exam_output.typ 编译 PDF 成功！');
} catch (err) {
  console.error('❌ test_exam_output.typ 编译失败:', err);
}

try {
  compiler.pdf({ mainFileContent: handoutTypst });
  console.log('✅ test_handout_output.typ 编译 PDF 成功！');
} catch (err) {
  console.error('❌ test_handout_output.typ 编译失败:', err);
}
