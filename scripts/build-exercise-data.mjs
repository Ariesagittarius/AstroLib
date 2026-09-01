// scripts/build-exercise-data.mjs
// 构建期：为全站题库预渲染 KaTeX 数学公式并进行数据瘦身
// 输出到:
//   - public/data/exercises/engineering_analysis/ch{1..7}.json (按章节划分)
//   - public/data/exercises/engineering_analysis/papers.json (全部试卷索引大纲)
//   - public/data/exercises/engineering_analysis/papers/p{paper_id}.json (单张试卷全量题目)
//   - public/data/exercises/engineering_analysis/meta.json (汇总统计)
// （astro build 会把 public/ 原样拷贝至 dist/，供客户端在生产环境下零运行时公式解析开销高速加载）。
//
// 开关：src/config/features.config.mjs 里 features.exercises.enabled —— 关闭则跳过生成。
// 用法：
//   node scripts/build-exercise-data.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import katex from 'katex';
import { features } from '../src/config/features.config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_DATA = path.join(ROOT, 'src', 'data', 'exercises', 'engineering_analysis_exercises.json');
const OUT_DIR = path.join(ROOT, 'public', 'data', 'exercises', 'engineering_analysis');
const PAPERS_OUT_DIR = path.join(OUT_DIR, 'papers');

/** HTML 实体安全转义 */
function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 分隔符拆分：$$...$$（display）优先，其次 $...$（inline/multiline） */
const MATH_SPLIT_RE = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g;

/** 清理并修复 LaTeX 字符串中的控制字符与转义序列 */
function sanitizeMathLatex(val) {
  if (typeof val !== 'string') return '';
  let str = val;
  // 1. FormFeed (0x0C) -> \f
  str = str.replace(/\x0c/g, '\\f');
  // 2. Backspace (0x08) -> \b
  str = str.replace(/\x08/g, '\\b');
  // 3. Vertical Tab (0x0B) -> \v
  str = str.replace(/\x0b/g, '\\v');
  // 4. Carriage Return (not followed by \n) -> \r
  str = str.replace(/\r(?!\n)/g, '\\r');
  // 5. Tab before letters -> \t
  str = str.replace(/\t([a-zA-Z])/g, '\\t$1');
  // 6. Standalone tabs in math -> space
  str = str.replace(/(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g, (m) => m.replace(/\t/g, ' '));
  // 7. Linefeed before math commands
  str = str.replace(/(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g, (m) =>
    m.replace(/\n(u|eq|ne|not|nabla|notin|nrightarrow|natural|nearrow|nwarrow|neg|normalsize)\b/g, '\\n$1')
  );
  // 8. 针对已知宏定义与特殊符号容错
  str = str.replace(/\\iiiint_{\\Omega}/g, '\\iiint_{\\Omega}');
  str = str.replace(/\\overparen\{([^}]+)\}/g, '\\stackrel{\\frown}{$1}');
  str = str.replace(/\\wideparen\{([^}]+)\}/g, '\\stackrel{\\frown}{$1}');
  return str;
}

const KATEX_BUILD_OPTIONS = {
  output: 'html',
  displayMode: false,
  throwOnError: false,
  strict: false,
  macros: {
    '\\overparen': '\\stackrel{\\frown}{#1}',
    '\\wideparen': '\\stackrel{\\frown}{#1}',
    '\\iiiint': '\\int\\!\\!\\int\\!\\!\\int\\!\\!\\int',
  },
};

/**
 * 将混排 Markdown/纯文本与 LaTeX 数学公式的字符串编译为静态 HTML。
 * - 公式段采用 KaTeX output: 'html' 编译，紧凑且零 MathML 冗余；
 * - 普通文本段做 HTML 转义与换行处理。
 */
function renderMathText(text) {
  if (!text) return '';
  const str = sanitizeMathLatex(String(text)).trim();
  if (!str) return '';

  if (!str.includes('$')) {
    return escapeHtml(str).replace(/\n/g, '<br/>');
  }

  const parts = str.split(MATH_SPLIT_RE);
  const out = [];
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
      try {
        const math = part.slice(2, -2).trim();
        out.push(katex.renderToString(math, { ...KATEX_BUILD_OPTIONS, displayMode: true }));
      } catch (e) {
        out.push(escapeHtml(part));
      }
    } else if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
      try {
        const math = part.slice(1, -1).trim();
        out.push(katex.renderToString(math, { ...KATEX_BUILD_OPTIONS, displayMode: false }));
      } catch (e) {
        out.push(escapeHtml(part));
      }
    } else {
      out.push(escapeHtml(part).replace(/\n/g, '<br/>'));
    }
  }
  return out.join('');
}

function cleanPaperTitle(rawTitle) {
  if (!rawTitle) return '';
  return String(rawTitle)
    .replace(/^\d+\s*\[[^\]]+\]\s*/, '')
    .replace(/试题$/, '试卷')
    .trim();
}

function extractPaperQuestionNum(qid, orderInPaper) {
  const match = String(qid || '').match(/-Q(\d+)$/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return orderInPaper || 1;
}

function main() {
  if (features.exercises && features.exercises.enabled === false) {
    console.log('[exercise-data] 已跳过：习题与自测模块关闭（features.config.mjs 中 exercises.enabled=false）。');
    return;
  }

  if (!fs.existsSync(SRC_DATA)) {
    console.error(`[exercise-data] 找不到题库源文件: ${SRC_DATA}`);
    process.exit(1);
  }

  const startTime = Date.now();
  console.log('[exercise-data] 开始编译《工科数学分析》题库公式与试卷索引...');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(PAPERS_OUT_DIR, { recursive: true });

  const rawData = JSON.parse(fs.readFileSync(SRC_DATA, 'utf-8'));
  const chapters = rawData.chapters || {};

  const metaData = {
    book: 'engineering_analysis',
    title: '工科数学分析基础（第三版）',
    total_questions: 0,
    total_papers: 0,
    chapters: {},
    papers: {}
  };

  let totalQuestionsCount = 0;
  const papersMap = new Map(); // paper_id -> paperObj

  // 第一遍：遍历全书所有题目，生成按章节 Slim 题目与按试卷汇总
  for (const [chKey, qList] of Object.entries(chapters)) {
    const chId = parseInt(chKey, 10);
    const slimQuestions = [];
    const sectionCounts = {};
    const sectionSlugs = {};
    const sectionTitles = {};
    const typeCounts = { choice: 0, blank: 0, calc: 0, proof: 0 };
    const sourceCounts = {};
    let chapterTitle = `第${chId}章`;

    for (const q of qList) {
      totalQuestionsCount++;
      const qType = q.meta?.type || 'calc';
      typeCounts[qType] = (typeCounts[qType] || 0) + 1;

      const category = q.source?.category || '期末真题';
      sourceCounts[category] = (sourceCounts[category] || 0) + 1;

      const eaMap = q.mapping?.engineering_analysis || {};
      if (eaMap.chapter_title) {
        chapterTitle = eaMap.chapter_title;
      }
      const sec = eaMap.section || '综合';
      const secSlug = eaMap.section_slug || sec;
      const secTitle = eaMap.section_title || '';
      const kps = eaMap.knowledge_points || [];

      sectionCounts[sec] = (sectionCounts[sec] || 0) + 1;
      sectionSlugs[sec] = secSlug;
      if (secTitle) sectionTitles[sec] = secTitle;

      // 试卷元信息
      const paperId = q.source?.paper_id ?? 1;
      const rawTitle = q.source?.raw_title || '';
      const cleanTitle = cleanPaperTitle(rawTitle) || `${q.source?.academic_year || ''} ${category}`;
      const orderInPaper = q.meta?.order_in_paper || 1;
      const paperQNum = extractPaperQuestionNum(q.id, orderInPaper);
      const sectionType = q.meta?.section_type || '';
      const score = q.meta?.score ?? 5;

      // 预编译公式 HTML 与清洗原始文本
      const stemRawClean = sanitizeMathLatex(q.content?.stem || '');
      const stemHtml = renderMathText(stemRawClean);
      const options = (q.content?.options || []).map((opt) => ({
        key: opt.key,
        text_html: renderMathText(opt.text),
        text_raw: sanitizeMathLatex(opt.text || '')
      }));
      const answerRaw = sanitizeMathLatex(q.solution?.answer || '');
      const answerHtml = renderMathText(answerRaw);
      const hintsHtml = q.solution?.hints ? renderMathText(q.solution.hints) : '';
      const stepsHtml = q.solution?.steps ? renderMathText(q.solution.steps) : '';

      // 规范化来源标签
      const sourceStr = `${cleanTitle} · 原卷第 ${paperQNum} 题`.trim();

      // 构建用于极速全文检索的纯文本索引小写串
      const searchRaw = [
        q.id,
        stemRawClean,
        ...((q.content?.options || []).map(o => `${o.key} ${o.text}`)),
        answerRaw,
        kps.join(' '),
        sourceStr,
        cleanTitle,
        category,
        sec,
        secSlug,
        secTitle,
        sectionType
      ].join(' ').toLowerCase();

      const slimItem = {
        id: q.id,
        type: qType,
        score: score,
        sec,
        sec_slug: secSlug,
        sec_title: secTitle,
        chapter: chId,
        chapter_title: chapterTitle,
        paper_id: paperId,
        paper_title: cleanTitle,
        paper_raw_title: rawTitle,
        paper_q_num: paperQNum,
        order_in_paper: orderInPaper,
        section_type: sectionType,
        academic_year: q.source?.academic_year || '',
        paper_category: category,
        paper_type: q.source?.paper_type || '综合',
        source: sourceStr,
        kps,
        stem_html: stemHtml,
        stem_raw: q.content?.stem || '',
        answer: answerRaw,
        answer_html: answerHtml,
        search: searchRaw
      };

      if (options.length > 0) slimItem.options = options;
      if (hintsHtml) slimItem.hints_html = hintsHtml;
      if (stepsHtml) slimItem.steps_html = stepsHtml;

      slimQuestions.push(slimItem);

      // 归集到试卷 Map
      if (!papersMap.has(paperId)) {
        papersMap.set(paperId, {
          paper_id: paperId,
          raw_title: rawTitle,
          clean_title: cleanTitle,
          category: category,
          course_name: q.source?.course_name || '数学分析',
          academic_year: q.source?.academic_year || '',
          term: q.source?.term || 1,
          exam_type: q.source?.exam_type || 'exam',
          paper_type: q.source?.paper_type || '综合',
          page_start: q.source?.page_start,
          page_end: q.source?.page_end,
          total_questions: 0,
          total_score: 0,
          sections_order: [],
          questions: []
        });
      }

      const paperObj = papersMap.get(paperId);
      paperObj.total_questions++;
      paperObj.total_score += score;
      if (sectionType && !paperObj.sections_order.includes(sectionType)) {
        paperObj.sections_order.push(sectionType);
      }
      paperObj.questions.push(slimItem);
    }

    // 组织小节列表
    const sections = Object.keys(sectionCounts)
      .sort((a, b) => {
        const na = parseFloat(a) || 999;
        const nb = parseFloat(b) || 999;
        return na - nb;
      })
      .map((secKey) => ({
        section: secKey,
        section_title: sectionTitles[secKey] || `第 ${secKey} 节`,
        section_slug: sectionSlugs[secKey] || secKey,
        count: sectionCounts[secKey]
      }));

    const chapterPayload = {
      chapter: chId,
      chapter_title: chapterTitle,
      total: slimQuestions.length,
      sections,
      type_counts: typeCounts,
      source_counts: sourceCounts,
      questions: slimQuestions
    };

    const outFile = path.join(OUT_DIR, `ch${chId}.json`);
    fs.writeFileSync(outFile, JSON.stringify(chapterPayload), 'utf-8');

    metaData.chapters[String(chId)] = {
      chapter: chId,
      chapter_title: chapterTitle,
      total: slimQuestions.length,
      sections,
      type_counts: typeCounts,
      source_counts: sourceCounts
    };

    const outSizeKb = (fs.statSync(outFile).size / 1024).toFixed(1);
    console.log(`  [build] 第 ${chId} 章: ${chapterTitle} (${slimQuestions.length} 题) -> ch${chId}.json [${outSizeKb} KB]`);
  }

  // 第二遍：处理所有试卷并输出单卷文件及总试卷索引
  const papersSummaryList = [];

  for (const [paperId, paperObj] of papersMap.entries()) {
    // 按试卷内题号 (paper_q_num) 严格升序排序
    paperObj.questions.sort((a, b) => {
      if (a.paper_q_num !== b.paper_q_num) {
        return a.paper_q_num - b.paper_q_num;
      }
      return (a.order_in_paper || 0) - (b.order_in_paper || 0);
    });

    // 统计试卷题型
    const paperTypeCounts = { choice: 0, blank: 0, calc: 0, proof: 0 };
    paperObj.questions.forEach((q) => {
      paperTypeCounts[q.type] = (paperTypeCounts[q.type] || 0) + 1;
    });

    const singlePaperPayload = {
      paper_id: paperObj.paper_id,
      clean_title: paperObj.clean_title,
      raw_title: paperObj.raw_title,
      category: paperObj.category,
      course_name: paperObj.course_name,
      academic_year: paperObj.academic_year,
      term: paperObj.term,
      exam_type: paperObj.exam_type,
      paper_type: paperObj.paper_type,
      total_questions: paperObj.total_questions,
      total_score: paperObj.total_score,
      type_counts: paperTypeCounts,
      sections_order: paperObj.sections_order,
      questions: paperObj.questions
    };

    const singlePaperFile = path.join(PAPERS_OUT_DIR, `p${paperId}.json`);
    fs.writeFileSync(singlePaperFile, JSON.stringify(singlePaperPayload), 'utf-8');

    const summaryItem = {
      paper_id: paperObj.paper_id,
      clean_title: paperObj.clean_title,
      category: paperObj.category,
      course_name: paperObj.course_name,
      academic_year: paperObj.academic_year,
      term: paperObj.term,
      exam_type: paperObj.exam_type,
      total_questions: paperObj.total_questions,
      total_score: paperObj.total_score,
      type_counts: paperTypeCounts,
      sections_count: paperObj.sections_order.length
    };

    papersSummaryList.push(summaryItem);
  }

  // 试卷排序：按学年倒序、学期、paper_id 排序
  papersSummaryList.sort((a, b) => {
    const yearA = parseInt((a.academic_year || '').slice(0, 4), 10) || 0;
    const yearB = parseInt((b.academic_year || '').slice(0, 4), 10) || 0;
    if (yearA !== yearB) return yearB - yearA;
    if (a.paper_id !== b.paper_id) return a.paper_id - b.paper_id;
    return 0;
  });

  const papersIndexFile = path.join(OUT_DIR, 'papers.json');
  fs.writeFileSync(papersIndexFile, JSON.stringify({
    total: papersSummaryList.length,
    papers: papersSummaryList
  }, null, 2), 'utf-8');

  metaData.total_questions = totalQuestionsCount;
  metaData.total_papers = papersSummaryList.length;
  const metaFile = path.join(OUT_DIR, 'meta.json');
  fs.writeFileSync(metaFile, JSON.stringify(metaData, null, 2), 'utf-8');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n[exercise-data] 题库与试卷大纲构建完成：7 个章节、85 套真题卷、共 ${totalQuestionsCount} 道题目已编译静态 HTML -> ${path.relative(ROOT, OUT_DIR)}/ (耗时: ${elapsed}s)`);
}

main();

