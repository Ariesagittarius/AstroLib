import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import katex from 'katex';
import { features } from '../src/config/features.config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_EXAM_DATA = path.join(ROOT, 'src', 'data', 'exercises', 'engineering_analysis_exercises.json');
const SRC_TEXTBOOK_DATA = path.join(ROOT, 'src', 'data', 'exercises', 'engineering_analysis_textbook_exercises.json');
const OUT_DIR = path.join(ROOT, 'public', 'data', 'exercises', 'engineering_analysis');
const PAPERS_OUT_DIR = path.join(OUT_DIR, 'papers');

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const MATH_SPLIT_RE = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g;

function sanitizeMathLatex(val) {
  if (typeof val !== 'string') return '';
  let str = val;

  str = str.replace(/\x0c/g, '\\f');

  str = str.replace(/\x08/g, '\\b');

  str = str.replace(/\x0b/g, '\\v');

  str = str.replace(/\r(?!\n)/g, '\\r');

  str = str.replace(/\t([a-zA-Z])/g, '\\t$1');

  str = str.replace(/(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g, (m) => m.replace(/\t/g, ' '));

  str = str.replace(/(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g, (m) =>
    m.replace(/\n(u|eq|ne|not|nabla|notin|nrightarrow|natural|nearrow|nwarrow|neg|normalsize)\b/g, '\\n$1')
  );

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

function renderMathText(text) {
  if (!text) return '';
  const str = sanitizeMathLatex(String(text)).trim();
  if (!str) return '';

  const images = [];
  const textWithImagePlaceholders = str.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, url) => {
    const idx = images.length;
    images.push({ alt, url });
    return `___EX_IMAGE_TOKEN_${idx}___`;
  });

  let htmlOut = '';
  if (!textWithImagePlaceholders.includes('$')) {
    htmlOut = escapeHtml(textWithImagePlaceholders).replace(/\n/g, '<br/>');
  } else {
    const parts = textWithImagePlaceholders.split(MATH_SPLIT_RE);
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
    htmlOut = out.join('');
  }

  if (images.length > 0) {
    htmlOut = htmlOut.replace(/___EX_IMAGE_TOKEN_(\d+)___/g, (_, idxStr) => {
      const img = images[parseInt(idxStr, 10)];
      if (!img) return '';
      const altAttr = escapeHtml(img.alt || '题图');
      const figCaption = img.alt ? `<span class="ex-img-caption">${escapeHtml(img.alt)}</span>` : '';
      return `<div class="ex-figure"><img src="${escapeHtml(img.url)}" alt="${altAttr}" class="ex-img" loading="lazy" />${figCaption}</div>`;
    });
  }

  return htmlOut;
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

  if (!fs.existsSync(SRC_EXAM_DATA)) {
    console.error(`[exercise-data] 找不到真题库源文件: ${SRC_EXAM_DATA}`);
    process.exit(1);
  }

  const startTime = Date.now();
  console.log('[exercise-data] 开始统一编译《工科数学分析》题库（大邮真题 + 教材课后习题）...');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(PAPERS_OUT_DIR, { recursive: true });

  const rawExamData = JSON.parse(fs.readFileSync(SRC_EXAM_DATA, 'utf-8'));
  const examChapters = rawExamData.chapters || {};

  let rawTbData = { chapters: {} };
  if (fs.existsSync(SRC_TEXTBOOK_DATA)) {
    rawTbData = JSON.parse(fs.readFileSync(SRC_TEXTBOOK_DATA, 'utf-8'));
  }
  const tbChapters = rawTbData.chapters || {};

  const metaData = {
    book: 'engineering_analysis',
    title: '工科数学分析基础（第三版）',
    total_questions: 0,
    total_papers: 0,
    total_exam_questions: 0,
    total_textbook_questions: 0,
    chapters: {},
    papers: {}
  };

  let totalQuestionsCount = 0;
  let examQuestionsCount = 0;
  let tbQuestionsCount = 0;
  const papersMap = new Map();

  for (let chId = 1; chId <= 7; chId++) {
    const chKey = String(chId);
    const tbList = tbChapters[chKey] || [];
    const examList = examChapters[chKey] || [];

    const qList = [...tbList, ...examList];

    const slimQuestions = [];
    const sectionCounts = {};
    const sectionSlugs = {};
    const sectionTitles = {};
    const typeCounts = { choice: 0, blank: 0, calc: 0, proof: 0 };
    const sourceCounts = {};
    let chapterTitle = `第${chId}章`;

    for (const q of qList) {
      totalQuestionsCount++;
      const isTb = q.source_type === 'textbook';
      if (isTb) {
        tbQuestionsCount++;
      } else {
        examQuestionsCount++;
      }

      const qType = q.meta?.type || 'calc';
      typeCounts[qType] = (typeCounts[qType] || 0) + 1;

      const category = q.source?.category || (isTb ? '教材课后习题' : '期末真题');
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

      const paperId = q.source?.paper_id ?? (isTb ? 1000 + chId : 1);
      const rawTitle = q.source?.raw_title || '';
      const cleanTitle = cleanPaperTitle(rawTitle) || `${q.source?.academic_year || ''} ${category}`;
      const orderInPaper = q.meta?.order_in_paper || 1;
      const paperQNum = q.meta?.paper_q_num || extractPaperQuestionNum(q.id, orderInPaper);
      const sectionType = q.meta?.section_type || '';
      const score = q.meta?.score ?? 5;
      const group = q.meta?.group || (isTb ? 'A' : '');

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

      const sourceStr = isTb
        ? (q.source?.source_desc || `${cleanTitle} · ${sectionType}第 ${paperQNum} 题`)
        : `${cleanTitle} · 原卷第 ${paperQNum} 题`.trim();

      const searchRaw = [
        q.id,
        q.source_type || 'exam',
        group ? `${group}组` : '',
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
        source_type: q.source_type || 'exam',
        group: group,
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
        academic_year: q.source?.academic_year || (isTb ? '教材配套' : ''),
        paper_category: category,
        paper_type: q.source?.paper_type || (isTb ? '教材原题' : '综合'),
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

      if (!isTb && q.content?.sub_questions && q.content.sub_questions.length > 0) {
        slimItem.sub_questions = q.content.sub_questions.map(sub => ({
          sub_id: sub.sub_id,
          stem_raw: sub.stem,
          stem_html: renderMathText(sub.stem)
        }));
      }

      slimQuestions.push(slimItem);

      if (!papersMap.has(paperId)) {
        papersMap.set(paperId, {
          paper_id: paperId,
          raw_title: rawTitle,
          clean_title: cleanTitle,
          category: category,
          course_name: q.source?.course_name || '工科数学分析基础',
          academic_year: q.source?.academic_year || (isTb ? '教材配套' : ''),
          term: q.source?.term || (chId <= 4 ? 1 : 2),
          exam_type: q.source?.exam_type || (isTb ? 'textbook' : 'exam'),
          paper_type: q.source?.paper_type || (isTb ? '教材原题' : '综合'),
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
    console.log(`  [build] 第 ${chId} 章: ${chapterTitle} (${slimQuestions.length} 题 [教材:${tbList.length}, 真题:${examList.length}]) -> ch${chId}.json [${outSizeKb} KB]`);
  }

  const papersSummaryList = [];

  for (const [paperId, paperObj] of papersMap.entries()) {

    paperObj.questions.sort((a, b) => {
      if (a.paper_q_num !== b.paper_q_num) {
        return a.paper_q_num - b.paper_q_num;
      }
      return (a.order_in_paper || 0) - (b.order_in_paper || 0);
    });

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

  papersSummaryList.sort((a, b) => {
    const isTbA = a.category === '教材课后习题';
    const isTbB = b.category === '教材课后习题';
    if (isTbA && !isTbB) return -1;
    if (!isTbA && isTbB) return 1;
    if (isTbA && isTbB) return a.paper_id - b.paper_id;
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
  metaData.total_exam_questions = examQuestionsCount;
  metaData.total_textbook_questions = tbQuestionsCount;
  metaData.total_exam_papers = 85;
  metaData.total_textbook_papers = 7;
  const metaFile = path.join(OUT_DIR, 'meta.json');
  fs.writeFileSync(metaFile, JSON.stringify(metaData, null, 2), 'utf-8');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n[exercise-data] 题库构建完成：7 个章节、${papersSummaryList.length} 套试卷（7套教材分章习题卷 + 85套历年真题卷）、共 ${totalQuestionsCount} 道题目（教材:${tbQuestionsCount}, 真题:${examQuestionsCount}）已编译静态 HTML -> ${path.relative(ROOT, OUT_DIR)}/ (耗时: ${elapsed}s)`);
}

main();
