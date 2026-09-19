/**
 * scripts/vision_reconstruct/merge_lag_exercises.cjs
 *
 * 合并《线性代数与几何（第2版）》全部 9 个章节的课后习题并执行严苛校验：
 * 1. 校验章节完整性（ch01 ~ ch09 必须全部就绪）
 * 2. 校验题量与真值矩阵完全吻合（总计 253 题）
 * 3. 校验全部数学公式 KaTeX 零报错
 * 4. 生成统一单一可信源 src/data/exercises/linear_algebra_geometry_textbook_exercises.json
 */

const fs = require('fs');
const path = require('path');
const katex = require('katex');

const ROOT = path.resolve(__dirname, '../..');
const RAW_DIR = path.join(ROOT, 'src/data/exercises/raw_lag');
const OUT_FILE = path.join(ROOT, 'src/data/exercises/linear_algebra_geometry_textbook_exercises.json');

const EXPECTED_COUNTS = {
  1: 19,
  2: 38,
  3: 45,
  4: 32,
  5: 20,
  6: 25,
  7: 42,
  8: 12,
  9: 20
};

const CHAPTER_TITLES = {
  1: '第1章 行列式',
  2: '第2章 矩阵',
  3: '第3章 向量代数、平面与直线',
  4: '第4章 向量组的线性相关性',
  5: '第5章 线性方程组',
  6: '第6章 特征值与特征向量',
  7: '第7章 二次型',
  8: '第8章 空间曲面与曲线',
  9: '第9章 线性空间与线性变换'
};

const KATEX_OPTIONS = {
  output: 'html',
  throwOnError: true,
  strict: false,
  macros: {
    '\\overparen': '\\stackrel{\\frown}{#1}',
    '\\wideparen': '\\stackrel{\\frown}{#1}',
    '\\iiiint': '\\int\\!\\!\\int\\!\\!\\int\\!\\!\\int',
    '\\iddots': '{\\mathinner{\\mkern1mu\\raisebox{1pt}{.}\\mkern2mu\\raisebox{4pt}{.}\\mkern2mu\\raisebox{7pt}{.}\\mkern1mu}}',
    '\\adots': '{\\mathinner{\\mkern1mu\\raisebox{1pt}{.}\\mkern2mu\\raisebox{4pt}{.}\\mkern2mu\\raisebox{7pt}{.}\\mkern1mu}}'
  }
};

const MATH_RE = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g;

function validateKatexInText(text, context) {
  if (!text || typeof text !== 'string') return;
  const matches = text.match(MATH_RE);
  if (!matches) return;
  for (const m of matches) {
    let math = '';
    let display = false;
    if (m.startsWith('$$') && m.endsWith('$$')) {
      math = m.slice(2, -2).trim();
      display = true;
    } else if (m.startsWith('$') && m.endsWith('$')) {
      math = m.slice(1, -1).trim();
      display = false;
    }
    if (!math) continue;
    try {
      katex.renderToString(math, { ...KATEX_OPTIONS, displayMode: display });
    } catch (err) {
      throw new Error(`KaTeX render error in ${context}: "${math}" -> ${err.message}`);
    }
  }
}

function validateQuestion(q, chNum) {
  const qid = q.id || `UNKNOWN_CH${chNum}`;
  if (!q.content || !q.content.stem) {
    throw new Error(`Question ${qid} is missing content.stem!`);
  }
  validateKatexInText(q.content.stem, `${qid} stem`);

  if (q.content.options && Array.isArray(q.content.options)) {
    for (const opt of q.content.options) {
      validateKatexInText(opt.text, `${qid} option ${opt.key}`);
    }
  }

  if (q.content.sub_questions && Array.isArray(q.content.sub_questions)) {
    for (const sub of q.content.sub_questions) {
      validateKatexInText(sub.stem, `${qid} sub ${sub.sub_id} stem`);
      validateKatexInText(sub.answer, `${qid} sub ${sub.sub_id} answer`);
    }
  }

  if (q.solution) {
    validateKatexInText(q.solution.answer, `${qid} solution.answer`);
    validateKatexInText(q.solution.hints, `${qid} solution.hints`);
    validateKatexInText(q.solution.steps, `${qid} solution.steps`);
  }
}

function main() {
  console.log('=== [LAG Merge] 开始校验与合并线性代数与几何课后习题 ===');

  const missingChapters = [];
  for (let ch = 1; ch <= 9; ch++) {
    const filename = `ch${String(ch).padStart(2, '0')}.json`;
    const fullPath = path.join(RAW_DIR, filename);
    if (!fs.existsSync(fullPath)) {
      missingChapters.push(ch);
    }
  }

  if (missingChapters.length > 0) {
    console.error(`[LAG Merge] 错误：缺少章节文件: ${missingChapters.map(c => `ch${String(c).padStart(2, '0')}.json`).join(', ')}`);
    console.log('[LAG Merge] 请等待对应章节转录任务完成。');
    process.exit(1);
  }

  const allChaptersData = {};
  let totalCount = 0;

  for (let ch = 1; ch <= 9; ch++) {
    const filename = `ch${String(ch).padStart(2, '0')}.json`;
    const fullPath = path.join(RAW_DIR, filename);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const qList = JSON.parse(content);

    const expected = EXPECTED_COUNTS[ch];
    if (qList.length !== expected) {
      throw new Error(`[LAG Merge] 第${ch}章题量不匹配！期望 ${expected} 道，实际 ${qList.length} 道`);
    }

    console.log(`[LAG Merge] 验证第 ${ch} 章 (${CHAPTER_TITLES[ch]}): 共 ${qList.length} 道题...`);
    for (const q of qList) {
      validateQuestion(q, ch);
    }

    allChaptersData[String(ch)] = qList;
    totalCount += qList.length;
  }

  if (totalCount !== 253) {
    throw new Error(`[LAG Merge] 总题量不匹配！期望 253 道，实际 ${totalCount} 道`);
  }

  const payload = {
    book: 'linear_algebra_geometry',
    title: '线性代数与几何（第2版）',
    authors: '刘吉佑、徐勇 编著',
    publisher: '北京邮电大学出版社',
    total_questions: totalCount,
    total_chapters: 9,
    expected_matrix: EXPECTED_COUNTS,
    chapters: allChaptersData
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`\n======================================================`);
  console.log(`[LAG Merge] 成功合并全书 9 章、${totalCount} 道课后习题！`);
  console.log(`[LAG Merge] 全部数学公式 KaTeX 编译测试 100% 通过（0 错误）。`);
  console.log(`[LAG Merge] 输出文件: ${path.relative(ROOT, OUT_FILE)} (${(fs.statSync(OUT_FILE).size / 1024).toFixed(1)} KB)`);
  console.log(`======================================================\n`);
}

main();
