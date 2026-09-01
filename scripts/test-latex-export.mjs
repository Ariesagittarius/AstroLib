import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  generateLatexDocument,
  formatLatexContent
} from '../src/utils/latex/latex-generator.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EX_FILE = path.join(ROOT, 'src', 'data', 'exercises', 'engineering_analysis_exercises.json');
const DB_FILE = path.join(ROOT, 'src', 'data', 'exercises', 'bupt_math_full_database.json');

const rawEx = JSON.parse(fs.readFileSync(EX_FILE, 'utf8'));
const rawDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

console.log('================================================================');
console.log('🧪 开始运行 LaTeX 练习册与试卷导出引擎全量校验 (Jinwen-XU/homework)');
console.log('================================================================\n');

// 1. 测试典型公式转换
console.log('--- [阶段 1] 测试典型复杂公式格式化 ---');
const testFormulas = [
  '已知非负数列 $\\{a_n\\}, \\{b_n\\}, \\{c_n\\}$．且 $\\lim_{n \\to \\infty} a_n = 0$, $\\lim_{n \\to \\infty} b_n = 1$, $\\lim_{n \\to \\infty} c_n = +\\infty$，则 ( )．',
  '$\\lim_{n \\to \\infty} (\\sqrt{n+\\sqrt{n}} - \\sqrt{n-\\sqrt{n}}) = \\underline{\\quad\\quad}$．',
  '$\\lim_{x \\to \\infty} \\frac{3x^2+5}{5x+3} \\sin \\frac{2}{x} = \\underline{\\quad\\quad}$．',
  '$\\int_0^1 \\frac{\\ln(1+x)}{1+x^2} \\mathrm{d}x$',
  '$\\vec{a} \\cdot \\vec{b} = |\\mathbf{a}| |\\mathbf{b}| \\cos \\theta$',
  '$\\left\\{ x \\in \\mathbb{R} \\mid x^2 - 3x + 2 \\leqslant 0 \\right\\}$',
  '$f(x) = \\begin{cases} \\frac{\\sin x}{x}, & x \\ne 0 \\\\ 1, & x = 0 \\end{cases}$'
];

testFormulas.forEach((tf, idx) => {
  const res = formatLatexContent(tf);
  console.log(`Case ${idx + 1}: ${res}`);
});
console.log('✅ 典型公式格式化完成！\n');

// 2. 检查 LaTeX 语法平衡辅助函数
function validateLatexSyntax(latexCode, docId) {
  const errors = [];

  // 占位符残留
  if (/§§|___MATH/.test(latexCode)) {
    errors.push('包含未还原的占位符');
  }

  // HTML 标签残留
  const htmlMatch = latexCode.match(/<\/?[a-z][a-z0-9]*[^<>]*>/i);
  if (htmlMatch) {
    errors.push(`包含残留 HTML 标签: ${htmlMatch[0]}`);
  }

  // HTML 实体残留
  const entityMatch = latexCode.match(/&(?:nbsp|amp|lt|gt|quot|#39);/);
  if (entityMatch) {
    errors.push(`包含残留 HTML 实体: ${entityMatch[0]}`);
  }

  // 环境闭合检查
  const envs = ['problem', 'solution', 'tasks', 'document', 'tabular', 'center'];
  envs.forEach(env => {
    const beginMatches = (latexCode.match(new RegExp(`\\\\begin\\{${env}\\}`, 'g')) || []).length;
    const endMatches = (latexCode.match(new RegExp(`\\\\end\\{${env}\\}`, 'g')) || []).length;
    if (beginMatches !== endMatches) {
      errors.push(`环境 \\begin{${env}} (${beginMatches}次) 与 \\end{${env}} (${endMatches}次) 数量不平衡`);
    }
  });

  return errors;
}

// 3. 工科数学分析 7 个章节全量生成测试
console.log('--- [阶段 2] 工科数学分析 1511 题按章节测试 ---');
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
    // 测试 handout 模板 (附录答案)
    const docHandout = generateLatexDocument(sample, {
      template: 'handout',
      title: `工科数学分析 · 第 ${ch} 章 练习册`,
      subtitle: '章节真题精选与自测演练',
      courseName: '工科数学分析',
      answerPlacement: 'appendix'
    });
    const errHandout = validateLatexSyntax(docHandout, `Ch${ch}-Handout`);
    if (errHandout.length > 0) {
      throw new Error(errHandout.join('; '));
    }

    // 测试 exam 模板 (纯题自测)
    const docExam = generateLatexDocument(sample, {
      template: 'exam',
      title: `工科数学分析 · 第 ${ch} 章 课程自测试卷`,
      subtitle: '全真模拟自测',
      courseName: '工科数学分析',
      writingSpace: 'compact',
      answerPlacement: 'none'
    });
    const errExam = validateLatexSyntax(docExam, `Ch${ch}-Exam`);
    if (errExam.length > 0) {
      throw new Error(errExam.join('; '));
    }

    console.log(`✅ 第 ${ch} 章 (${qList.length} 题) LaTeX 生成与语法校验通过！`);
    chPassed += qList.length;
  } catch (err) {
    chFailed += qList.length;
    console.error(`❌ 第 ${ch} 章 校验失败:`, err.message);
  }
}

// 3.5 卷头与空间节省模式专项测试 (standard / compact / none)
console.log('--- [阶段 2.5] 卷头与元数据模式专项测试 ---');
const sampleHeaderQ = [{
  id: 'test-q-1',
  type: 'choice',
  stem_raw: '设 $f(x)$ 连续，则极限 $\\lim_{x \\to 0} f(x)$ 存在．',
  stem_html: '设 $f(x)$ 连续，则极限 $\\lim_{x \\to 0} f(x)$ 存在．',
  options: [
    { key: 'A', text_raw: '正确', text_html: '正确' },
    { key: 'B', text_raw: '错误', text_html: '错误' }
  ],
  answer: 'A',
  score: 5
}];

// 测试 1: 无卷头极简省纸模式
const docNone = generateLatexDocument(sampleHeaderQ, {
  headerMode: 'none',
  pageNumbering: 'none'
});
if (/\\maketitle|\\title\{|\\author\{|\\date\{/.test(docNone)) {
  throw new Error('headerMode: none 模式下不应包含 \\maketitle 或 \\title');
}
if (!/\\pagestyle\{empty\}/.test(docNone)) {
  throw new Error('pageNumbering: none 模式下应包含 \\pagestyle{empty}');
}
console.log('✅ 无卷头省纸模式测试通过 (0 卷头占用)');

// 测试 2: 紧凑单行小卷头模式
const docCompact = generateLatexDocument(sampleHeaderQ, {
  headerMode: 'compact',
  title: '高等数学阶段测试'
});
if (!/\{\\large\\bfseries 高等数学阶段测试\}/.test(docCompact)) {
  throw new Error('headerMode: compact 模式下应包含紧凑居中标题');
}
console.log('✅ 紧凑单行卷头模式测试通过');

// 测试 3: 标准学术卷头 + CC BY-NC-SA 4.0 许可协议
const docStandard = generateLatexDocument(sampleHeaderQ, {
  headerMode: 'standard',
  title: '工科数学分析 · 期末测试',
  showSubtitle: true,
  subtitle: '2025 学年标准自测卷',
  showLicense: true,
  licenseText: 'CC BY-NC-SA 4.0',
  showDate: true
});
if (!/许可协议：CC BY-NC-SA 4.0/.test(docStandard)) {
  throw new Error('headerMode: standard 模式下应包含克制的 CC BY-NC-SA 4.0 许可');
}
if (/AstroLib/.test(docStandard)) {
  throw new Error('标准学术卷头禁止出现 AstroLib 商业标识');
}
console.log('✅ 标准学术卷头 + CC 许可协议测试通过');
console.log('');
console.log('\n--- [阶段 3] bupt_math_full_database 2915 题全量批次抽样生成 ---');
let dbPass = 0;
let dbFail = 0;
const dbQuestions = rawDb.questions || rawDb;

for (let i = 0; i < dbQuestions.length; i += 100) {
  const batch = dbQuestions.slice(i, i + 100).map((q, idx) => ({
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
    const doc = generateLatexDocument(batch, {
      template: 'handout',
      title: `数理真题精选集 · 批次 ${Math.floor(i / 100) + 1}`,
      subtitle: '全量题库抽样检验',
      courseName: '高等数学',
      answerPlacement: 'appendix'
    });
    const errs = validateLatexSyntax(doc, `Batch-${Math.floor(i / 100) + 1}`);
    if (errs.length > 0) {
      throw new Error(errs.join('; '));
    }
    dbPass += batch.length;
  } catch (err) {
    dbFail += batch.length;
    console.error(`❌ Batch ${Math.floor(i / 100) + 1} 校验失败:`, err.message);
  }
}

// 5. 保存代表性输出文件至 public 目录
const sampleQuestions = rawEx.chapters['1'].slice(0, 15).map(q => ({
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

const examLatex = generateLatexDocument(sampleQuestions, {
  template: 'exam',
  title: '工科数学分析 · 期末模拟自测试卷',
  subtitle: '2025-2026学年第一学期期末考试',
  courseName: '工科数学分析',
  writingSpace: 'compact',
  answerPlacement: 'appendix'
});

const handoutLatex = generateLatexDocument(sampleQuestions, {
  template: 'handout',
  title: '工科数学分析 · 第 1 章 极限与连续',
  subtitle: '名校期中与期末真题精选习题册',
  courseName: '工科数学分析',
  writingSpace: 'comfortable',
  answerPlacement: 'appendix'
});

fs.writeFileSync(path.join(ROOT, 'public', 'test_exam_output.tex'), examLatex, 'utf8');
fs.writeFileSync(path.join(ROOT, 'public', 'test_handout_output.tex'), handoutLatex, 'utf8');
console.log('\n✅ 代表性测试文件已写入:');
console.log('   - public/test_exam_output.tex');
console.log('   - public/test_handout_output.tex');

console.log('\n======================================================');
console.log(`工科数分章节汇总: ${chPassed} 题通过, ${chFailed} 题失败`);
console.log(`题库全量批量汇总: ${dbPass} 题通过, ${dbFail} 题失败`);
console.log('======================================================\n');
