import fs from 'node:fs';
import path from 'node:path';
import { cleanSlug, naturalSort } from '../sidebar.mjs';
import { collections } from '../../config/collections.config.mjs';

export const CARD_TYPES = {
  example: { label: '例题', code: 'EG', theme: 'chip-example' },
  variant: { label: '变式', code: 'VAR', theme: 'chip-variant' },
  theorem: { label: '定理', code: 'THM', theme: 'chip-conclusion' },
  definition: { label: '定义', code: 'DEF', theme: 'chip-knowledge' },
  property: { label: '性质', code: 'PROP', theme: 'chip-knowledge' },
  corollary: { label: '推论', code: 'COR', theme: 'chip-conclusion' },
  lemma: { label: '引理', code: 'LEM', theme: 'chip-conclusion' },
  proposition: { label: '命题', code: 'PROP', theme: 'chip-conclusion' },
  axiom: { label: '公理', code: 'AXIOM', theme: 'chip-conclusion' },
  criterion: { label: '准则', code: 'CRIT', theme: 'chip-conclusion' },
  knowledge: { label: '知识点', code: 'KNOW', theme: 'chip-knowledge' },
  exercise: { label: '习题', code: 'EX', theme: 'chip-problem' },
  method: { label: '方法', code: 'METH', theme: 'chip-method' },
  conclusion: { label: '结论', code: 'CONCL', theme: 'chip-conclusion' },
  summary: { label: '总结', code: 'SUM', theme: 'chip-summary' },
  note: { label: '注解', code: 'REM', theme: 'chip-summary' },
  solution: { label: '解析', code: 'SOL', theme: 'chip-problem' },
  analysis: { label: '思路分析', code: 'ANA', theme: 'chip-problem' },
  guide: { label: '教学导引', code: 'GUIDE', theme: 'chip-method' },
  qrcodevideo: { label: '拓展微课', code: 'MEDIA', theme: 'chip-default' },
  section: { label: '专题小节', code: 'SEC', theme: 'chip-default' },
  block: { label: '通用块', code: 'BLK', theme: 'chip-default' },
};

const EMOJI_REGEX = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\uFE0F]/gu;

function walkMdxFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  files.sort(naturalSort);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'images' && file !== '.git') {
        walkMdxFiles(fullPath, fileList);
      }
    } else if (file.endsWith('.mdx') || file.endsWith('.md')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

export function normalizeTitle(title) {
  if (!title) return '';
  return title
    .replace(EMOJI_REGEX, '')
    .replace(/\$/g, '')
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/[\s\-_—·:：,，.。()（）[\]【】]/g, '')
    .replace(/例题/g, '例')
    .replace(/练习题/g, '习题')
    .toLowerCase()
    .trim();
}

function extractSnippet(bodyContent) {
  if (!bodyContent) return '';
  return bodyContent
    .replace(/<[^>]+>/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' [公式] ')
    .replace(/\$[^$]+\$/g, ' [公式] ')
    .replace(/!\[.*?\]\(.*?\)/g, ' [插图] ')
    .replace(/[#*`_~>\-+|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);
}

function inferCardKind(tagName, title) {
  const t = tagName.toLowerCase();
  const titleClean = (title || '').trim();

  if (t === 'knowledge' || t === 'block' || t === 'summary') {
    if (/^定理\b|^定理\s*[\d.一二三四五六七八九十]/.test(titleClean) || titleClean.endsWith('定理')) {
      return 'theorem';
    }
    if (/^定义\b|^定义\s*[\d.一二三四五六七八九十]/.test(titleClean)) {
      return 'definition';
    }
    if (/^性质\b|^性质\s*[\d.一二三四五六七八九十]/.test(titleClean)) {
      return 'property';
    }
    if (/^推论\b|^推论\s*[\d.一二三四五六七八九十]/.test(titleClean)) {
      return 'corollary';
    }
    if (/^引理\b|^引理\s*[\d.一二三四五六七八九十]/.test(titleClean)) {
      return 'lemma';
    }
    if (/^命题\b|^命题\s*[\d.一二三四五六七八九十]/.test(titleClean)) {
      return 'proposition';
    }
    if (/^公理\b|^公理\s*[\d.一二三四五六七八九十]/.test(titleClean)) {
      return 'axiom';
    }
    if (/^准则\b|^准则\s*[\d.一二三四五六七八九十]/.test(titleClean)) {
      return 'criterion';
    }
    if (/^习题|^练习题|^练习|^参考题|^思考题/.test(titleClean)) {
      return 'exercise';
    }
    if (/^结论总结|^经验总结|^结论|^小结/.test(titleClean)) {
      return 'conclusion';
    }
    if (/^方法总结|^方法|^解题方法|^解题技巧/.test(titleClean)) {
      return 'method';
    }
    if (/^注\b|^注意\b|^评注\b|^按语\b|^提示\b|^说明\b/.test(titleClean)) {
      return 'note';
    }
    if (/^证明\b|^解\b|^解法/.test(titleClean)) {
      return 'solution';
    }
    if (/^分析\b|^思路分析\b|^几何分析\b/.test(titleClean)) {
      return 'analysis';
    }
  }

  if (t === 'note') return 'note';
  if (t === 'solution') return 'solution';
  if (t === 'analysis') return 'analysis';
  if (t === 'guide') return 'guide';
  if (t === 'qrcodevideo') return 'qrcodevideo';
  if (t === 'section') return 'section';
  if (t === 'example') return 'example';
  if (t === 'variant') return 'variant';
  if (t === 'exercise') return 'exercise';
  if (t === 'method') return 'method';
  if (t === 'summary') return 'summary';

  return CARD_TYPES[t] ? t : 'block';
}

export function scanBookModules(colSlug, bookSlug) {
  const result = {
    ok: true,
    colSlug,
    bookSlug,
    bookTitle: '',
    totalModules: 0,
    totalChapters: 0,
    stats: {
      byKind: {},
      sameChapterDupsCount: 0,
      allDupsCount: 0,
      suspiciousCount: 0,
    },
    modules: [],
    sameChapterDuplicates: [],
    allDuplicates: [],
    suspiciousItems: [],
  };

  let bookConfig = null;
  for (const col of collections) {
    if (col.slug === colSlug) {
      const b = col.books.find((x) => x.slug === bookSlug);
      if (b) {
        bookConfig = b;
        result.bookTitle = b.title;
        break;
      }
    }
  }

  const bookDir = path.resolve(`src/content/docs/collections/${colSlug}/${bookSlug}`);
  if (!fs.existsSync(bookDir)) {
    result.ok = false;
    result.message = `书籍目录未找到: ${bookDir}`;
    return result;
  }

  const allMdxFiles = walkMdxFiles(bookDir);
  result.totalChapters = allMdxFiles.length;

  const singleTagRegex = /<([A-Z][a-zA-Z0-9]*)\b([^>]*?)>/g;

  const KNOWN_TAGS = new Set([
    'Example',
    'Variant',
    'Knowledge',
    'Theorem',
    'Definition',
    'Note',
    'Exercise',
    'Block',
    'Method',
    'Summary',
    'Solution',
    'Analysis',
    'Guide',
    'QRCodeVideo',
    'Section',
  ]);

  const allModules = [];
  const normalizedTitleMap = new Map();
  const sameChapterMap = new Map();

  for (const filePath of allMdxFiles) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath);
    const relativePath = path.relative('src/content/docs', filePath).replace(/\\/g, '/');
    const rawSlug = relativePath.replace(/\.mdx?$/, '');
    const cleanChapterSlug = cleanSlug(rawSlug);
    const chapterUrl = `/${cleanChapterSlug}/`;

    const titleMatch = fileContent.match(/title:\s*['"](.*?)['"]/);
    const chapterTitle = titleMatch ? titleMatch[1] : filename.replace(/^\d+[_-]/, '').replace(/\.mdx?$/, '');

    const lineBreakOffsets = [0];
    for (let i = 0; i < fileContent.length; i++) {
      if (fileContent.charCodeAt(i) === 10) {
        lineBreakOffsets.push(i + 1);
      }
    }

    const getLineNumber = (charIndex) => {
      let low = 0;
      let high = lineBreakOffsets.length - 1;
      while (low <= high) {
        const mid = (low + high) >> 1;
        if (lineBreakOffsets[mid] <= charIndex) {
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      return high + 1;
    };

    let match;
    while ((match = singleTagRegex.exec(fileContent)) !== null) {
      const tagName = match[1];
      if (!KNOWN_TAGS.has(tagName)) continue;

      const fullAttrStr = match[2];
      const startChar = match.index;
      const startLine = getLineNumber(startChar);

      const titleAttrMatch = fullAttrStr.match(/title=(?:["'](.*?)["']|{(.*?)}|(\S+))/);
      let rawTitle = '';
      if (titleAttrMatch) {
        rawTitle = (titleAttrMatch[1] || titleAttrMatch[2] || titleAttrMatch[3] || '').trim();
      }

      if (!rawTitle && tagName === 'QRCodeVideo') {
        const idMatch = fullAttrStr.match(/id=(?:["'](.*?)["']|{(.*?)}|(\S+))/);
        if (idMatch) {
          rawTitle = `微课 ${idMatch[1] || idMatch[2] || idMatch[3] || ''}`.trim();
        }
      }

      const kind = inferCardKind(tagName, rawTitle);
      const typeInfo = CARD_TYPES[kind] || CARD_TYPES.block;

      let cleanTitle = rawTitle.replace(EMOJI_REGEX, '').trim();
      if (!cleanTitle) {
        if (tagName === 'Note') cleanTitle = '标注说明';
        else if (tagName === 'Solution') cleanTitle = '解析';
        else if (tagName === 'Analysis') cleanTitle = '思路分析';
        else if (tagName === 'Guide') cleanTitle = '教学导引';
        else if (tagName === 'QRCodeVideo') cleanTitle = '微课视频';
        else cleanTitle = `[未命名 ${typeInfo.label}]`;
      }

      const normTitle = normalizeTitle(cleanTitle) || `[无标题_${kind}]`;
      const cleanId = cleanTitle ? encodeURIComponent(cleanTitle.replace(/\s+/g, '-')) : '';

      const tagEndChar = startChar + match[0].length;
      const bodyPreview = fileContent.slice(tagEndChar, tagEndChar + 350);
      const snippet = extractSnippet(bodyPreview);

      const bookModuleCustom =
        bookConfig?.modules?.[cleanTitle] ||
        bookConfig?.modules?.[typeInfo.label] ||
        bookConfig?.modules?.[tagName];
      const theme = bookModuleCustom?.theme || typeInfo.theme;
      const typeLabel = bookModuleCustom?.short ? `${typeInfo.label}` : typeInfo.label;
      const shortCode = typeInfo.code || 'BLK';

      const item = {
        id: `${cleanChapterSlug}#L${startLine}-${kind}`,
        kind,
        tagName,
        typeLabel,
        code: shortCode,
        theme,
        rawTitle,
        cleanTitle,
        normalizedTitle: normTitle,
        chapterTitle,
        chapterSlug: cleanChapterSlug,
        chapterUrl,
        file: relativePath,
        filename,
        line: startLine,
        anchorId: cleanId,
        url: `${chapterUrl}${cleanId ? '#' + cleanId : ''}`,
        snippet,
        suspiciousReasons: [],
      };

      const isSelfClosing = fullAttrStr.trim().endsWith('/');

      if (!rawTitle && (tagName === 'Example' || tagName === 'Variant' || tagName === 'Exercise')) {
        item.suspiciousReasons.push(`缺少 title 标题属性`);
      }

      if (cleanTitle.length > 50) {
        item.suspiciousReasons.push(`标题过长（${cleanTitle.length} 字符，疑似误将段落吞入标题属性）`);
      }

      if (!isSelfClosing && snippet.length === 0 && tagName !== 'QRCodeVideo') {
        item.suspiciousReasons.push(`卡片正文为空，疑似空壳或截断碎片`);
      }

      if ((tagName === 'Example' || tagName === 'Variant') && /^说明\s*[:：]|^注意\s*[:：]/.test(cleanTitle)) {
        item.suspiciousReasons.push(`例题/变式标题以“说明/注意”开头，疑似段落误切`);
      }

      allModules.push(item);

      if (!normalizedTitleMap.has(normTitle)) {
        normalizedTitleMap.set(normTitle, []);
      }
      normalizedTitleMap.get(normTitle).push(item);

      const chapterKey = `${relativePath}:::${normTitle}`;
      if (!sameChapterMap.has(chapterKey)) {
        sameChapterMap.set(chapterKey, []);
      }
      sameChapterMap.get(chapterKey).push(item);
    }

    const lines = fileContent.split('\n');
    let insideCodeBlock = false;
    let insideJsxBlock = false;

    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      const trimmed = lineText.trim();

      if (trimmed.startsWith('```')) {
        insideCodeBlock = !insideCodeBlock;
        return;
      }
      if (insideCodeBlock) return;

      if (/<([A-Z][a-zA-Z0-9]*)\b[^>]*>/.test(trimmed) && !trimmed.endsWith('/>')) {
        insideJsxBlock = true;
      }
      if (/<\/([A-Z][a-zA-Z0-9]*)>/.test(trimmed)) {
        insideJsxBlock = false;
        return;
      }

      if (!insideJsxBlock && !trimmed.startsWith('#')) {
        const rawNoteMatch = trimmed.match(
          /^(?:[*#>\-\d.]+\s*)?(?:【\s*(?:注|注解|说明|标注说明|注意|评注)\s*】|(?:注|注解|说明|标注说明|注意|评注)\s*[:：])\s*(.*)$/
        );
        if (rawNoteMatch) {
          const rawPrefix = trimmed.replace(/^[*#>\-\s]+/, '').slice(0, 32);
          const rawItem = {
            id: `${cleanChapterSlug}#L${lineNum}-raw-note`,
            kind: 'note',
            tagName: 'Text',
            typeLabel: '注解',
            code: 'REM',
            theme: 'chip-summary',
            rawTitle: rawPrefix,
            cleanTitle: rawPrefix,
            normalizedTitle: normalizeTitle(rawPrefix) || `[原始注解_L${lineNum}]`,
            chapterTitle,
            chapterSlug: cleanChapterSlug,
            chapterUrl,
            file: relativePath,
            filename,
            line: lineNum,
            anchorId: `L${lineNum}`,
            url: `${chapterUrl}#L${lineNum}`,
            snippet: trimmed.slice(0, 140),
            suspiciousReasons: ['原始文本注解（未封装为 <Note> 卡片，疑似 OCR 漏切分）'],
          };
          allModules.push(rawItem);
        }
      }
    });
  }

  result.totalModules = allModules.length;
  result.modules = allModules;

  const byKind = {};
  for (const m of allModules) {
    byKind[m.kind] = (byKind[m.kind] || 0) + 1;
  }
  result.stats.byKind = byKind;

  const COMMON_SUB_BLOCK_PATTERN = /^(注|注意|标注说明|评注|按语|解析|证明|解|解法|证|证法|思路分析|教学导引|微课视频)\s*[\d.一二三四五六七八九十()（）]*$/;

  const sameChapterDups = [];
  for (const [key, items] of sameChapterMap.entries()) {
    if (items.length > 1) {
      const first = items[0];
      const isCommonSub = COMMON_SUB_BLOCK_PATTERN.test(first.cleanTitle) || COMMON_SUB_BLOCK_PATTERN.test(first.normalizedTitle);

      if (!isCommonSub) {
        for (const item of items) {
          if (!item.suspiciousReasons.some((r) => r.includes('同章节存在同名'))) {
            item.suspiciousReasons.push(`同章节存在 ${items.length} 处同名模块`);
          }
        }
        sameChapterDups.push({
          title: first.cleanTitle,
          normalizedTitle: first.normalizedTitle,
          chapterTitle: first.chapterTitle,
          chapterSlug: first.chapterSlug,
          file: first.file,
          filename: first.filename,
          count: items.length,
          items,
        });
      }
    }
  }
  sameChapterDups.sort((a, b) => b.count - a.count || naturalSort(a.filename, b.filename));
  result.sameChapterDuplicates = sameChapterDups;
  result.stats.sameChapterDupsCount = sameChapterDups.length;

  const allDups = [];
  for (const [normTitle, items] of normalizedTitleMap.entries()) {
    if (items.length > 1) {
      const isCommonSub = COMMON_SUB_BLOCK_PATTERN.test(normTitle) || COMMON_SUB_BLOCK_PATTERN.test(items[0].cleanTitle);
      if (!isCommonSub) {
        const chaptersSet = new Set(items.map((x) => x.chapterSlug));
        allDups.push({
          title: items[0].cleanTitle,
          normalizedTitle: normTitle,
          count: items.length,
          chaptersCount: chaptersSet.size,
          items,
        });
      }
    }
  }
  allDups.sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));
  result.allDuplicates = allDups;
  result.stats.allDupsCount = allDups.length;

  const suspicious = allModules.filter((m) => m.suspiciousReasons.length > 0);
  result.suspiciousItems = suspicious;
  result.stats.suspiciousCount = suspicious.length;

  return result;
}

export function listAllBooks() {
  const books = [];
  for (const col of collections) {
    for (const book of col.books) {
      books.push({
        colSlug: col.slug,
        colTitle: col.title,
        bookSlug: book.slug,
        bookTitle: book.title,
        entryPoint: book.entryPoint,
        key: `${col.slug}/${book.slug}`,
      });
    }
  }
  return books;
}
