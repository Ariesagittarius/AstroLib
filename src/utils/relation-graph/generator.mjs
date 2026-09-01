/**
 * ============================================================================
 * 全书各章节内联关系与知识导图生成器 (Book Relation Graph Generator)
 * ============================================================================
 * 
 * 职责：
 *   1. 扫描指定书籍（colSlug / bookSlug）下的全部 MDX 章节；
 *   2. 提取各章元数据、定义的知识卡片（例/定理/定义/方法/习题等）；
 *   3. 识别正文中的交叉引用（Block & Figure 引用），通过全局索引建立有向依赖图；
 *   4. 生成拓扑网络图数据（Force/Circular Nodes & Links）、层级导图数据（Mindmap Tree）
 *      与章节关联双向追溯矩阵（Inbound & Outbound Matrix）。
 * 
 * 特性：
 *   - 纯 ESM 无副作用模块，供构建期脚本 scripts/build-relation-graphs.mjs 
 *     与开发期 Vite 插件 dev-server-plugin.mjs 共同调用；
 *   - 严格调用 cleanSlug，保证 URL 绝对精准无 404；
 *   - 零自造轮子：直接输出标准 Apache ECharts 5 兼容的 Graph & Tree 图表数据结构。
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { collections } from '../../config/collections.config.mjs';
import { cleanSlug, naturalSort } from '../sidebar.mjs';
import { buildGlobalBlockIndex } from '../cross-ref-indexer.mjs';

/** ECharts 节点分类和谐配色板（对齐 VitePress 调色） */
const CATEGORY_COLORS = [
  '#3451b2', '#059669', '#d97706', '#0284c7', '#0d9488',
  '#7c3aed', '#e11d48', '#4f46e5', '#ca8a04', '#0891b2',
  '#65a30d', '#c026d3', '#9333ea', '#64748b'
];

/**
 * 递归收集目录下的所有 MDX 文件并按自然数排序
 */
function walkMdxFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  files.sort(naturalSort);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'images' && file !== '.git') walkMdxFiles(fullPath, fileList);
    } else if (file.endsWith('.mdx') || file.endsWith('.md')) {
      fileList.push({ fullPath, mtimeMs: stat.mtimeMs });
    }
  }
  return fileList;
}

/**
 * 提取章节所属的主分组（如 "第1章", "第2章", "附录", "前言" 等）
 */
function extractGroupName(title, filename) {
  const match = title.match(/^(第[0-9一二三四五六七八九十百]+章|[0-9]+\.[0-9]+|[0-9]+|附录[A-Za-z0-9\-_]*)/);
  if (match) {
    const raw = match[1];
    if (raw.startsWith('第') && raw.endsWith('章')) return raw;
    const numPart = raw.split('.')[0];
    if (/^\d+$/.test(numPart)) return `第${numPart}章`;
    return raw;
  }
  const fileMatch = filename.match(/^([0-9]+|附录[A-Za-z0-9\-_]*)/);
  if (fileMatch) {
    const fnum = fileMatch[1];
    if (/^\d+$/.test(fnum)) return `第${fnum}章`;
    return fnum;
  }
  return '基础与导言';
}

const relationGraphCache = new Map();

/**
 * 生成指定图书的全书内联关系图谱数据（带内存快照缓存）
 * @param {string} colSlug 合集 slug（如 'math'）
 * @param {string} bookSlug 图书 slug（如 'engineering_analysis'）
 * @param {boolean} [force=false] 是否强制跳过缓存
 * @returns {object|null}
 */
export function generateBookRelationGraph(colSlug, bookSlug, force = false) {
  const bookKey = `${colSlug}/${bookSlug}`;
  const bookDir = path.resolve(`src/content/docs/collections/${colSlug}/${bookSlug}`);
  if (!fs.existsSync(bookDir)) return null;

  const files = walkMdxFiles(bookDir);
  const signature = files.map((f) => `${f.fullPath}:${f.mtimeMs}`).join('|');

  if (!force && relationGraphCache.has(bookKey)) {
    const cached = relationGraphCache.get(bookKey);
    if (cached && cached.signature === signature) {
      return cached.result;
    }
  }

  const globalIndex = buildGlobalBlockIndex(colSlug, bookSlug, force);

  let bookConfig = null;
  for (const col of collections) {
    if (col.slug === colSlug) {
      bookConfig = col.books.find(b => b.slug === bookSlug);
      if (bookConfig) break;
    }
  }

  const modules = bookConfig?.modules || {};
  const allAliases = [];
  for (const [key, meta] of Object.entries(modules)) {
    if (key !== '图' && !meta.isImage && meta.aliases) {
      allAliases.push(...meta.aliases);
    }
  }
  const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const typePattern = allAliases.map(escapeRegExp).join('|');
  const blockRefRegex = new RegExp(`(${typePattern})\\s*(\\d+(?:\\.\\d+)*)`, 'g');
  const figRegex = new RegExp(`(图)\\s*(\\d+\\s*[-－]\\s*\\d+)`, 'g');

  const chapters = [];
  const groupMap = new Map(); // groupName -> categoryIndex

  files.forEach(({ fullPath: filePath }, idx) => {
    const relativePath = path.relative('src/content/docs', filePath);
    const rawSlug = relativePath.replace(/\.mdx?$/, '').replace(/\\/g, '/');
    const cleanedSlug = cleanSlug(rawSlug);
    const url = `/${cleanedSlug}/`;
    const filename = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');

    // 提取 Frontmatter 标题
    const titleMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    let title = path.basename(filePath, path.extname(filePath));
    if (titleMatch) {
      const fmTitle = titleMatch[1].match(/title:\s*['"]?(.*?)['"]?$/m);
      if (fmTitle) title = fmTitle[1].trim();
    }

    const groupName = extractGroupName(title, filename);
    if (!groupMap.has(groupName)) {
      groupMap.set(groupName, groupMap.size);
    }

    // 扫描本章内部定义的知识卡片
    const cardTagRegex = /<(Example|Variant|Knowledge|Summary|Method|Conclusion|Block|Exercise|Solution)\s+title=["'](.*?)["']/g;
    const localCards = [];
    let cm;
    while ((cm = cardTagRegex.exec(content)) !== null) {
      localCards.push({
        kind: cm[1],
        title: cm[2].trim(),
        anchor: cm[2].trim().replace(/\s+/g, '-'),
      });
    }

    chapters.push({
      index: idx,
      id: `chap-${idx}`,
      filename,
      filePath,
      rawSlug,
      cleanedSlug,
      url,
      title,
      groupName,
      category: groupMap.get(groupName),
      cardCount: localCards.length,
      cards: localCards,
      content,
      outReferences: [],
      inReferences: [],
    });
  });

  // 扫描每个章节引用的外部/内部目标
  const linksMap = new Map(); // "sourceIndex->targetIndex"
  let totalCrossReferences = 0;
  let totalIntraReferences = 0;
  let totalFigReferences = 0;

  chapters.forEach((chap) => {
    // 剔除 frontmatter 和行间公式内部文本，避免误匹配
    const text = chap.content.replace(/^---\s*[\s\S]*?\n---/, '');

    // 1. 扫描块引用
    let m;
    blockRefRegex.lastIndex = 0;
    while ((m = blockRefRegex.exec(text)) !== null) {
      const matchedType = m[1].trim();
      const matchedNum = m[2].trim();
      let masterKey = matchedType;
      for (const [mk, mm] of Object.entries(modules)) {
        if (mm.aliases && mm.aliases.includes(matchedType)) {
          masterKey = mk;
          break;
        }
      }
      const keyNoSpace = `${matchedType}${matchedNum}`.replace(/\s+/g, '');
      const masterKeyNoSpace = `${masterKey}${matchedNum}`.replace(/\s+/g, '');

      const rawCandidates = globalIndex[keyNoSpace] || globalIndex[masterKeyNoSpace] || [];
      const candidates = Array.isArray(rawCandidates)
        ? rawCandidates
        : typeof rawCandidates === 'string'
        ? [{ url: rawCandidates, chapterTitle: '', rawTitle: keyNoSpace, cleanTitle: keyNoSpace }]
        : [];

      // 优先校验是否属于本章内部卡片
      const hasLocalCard = chap.cards.some((card) => {
        const cardClean = card.title.replace(/\s+/g, '');
        return cardClean.startsWith(keyNoSpace) || cardClean.startsWith(masterKeyNoSpace);
      });

      if (hasLocalCard) {
        totalIntraReferences++;
        chap.outReferences.push({
          refText: `${matchedType} ${matchedNum}`,
          type: masterKey,
          targetUrl: `#${keyNoSpace}`,
          targetAnchor: keyNoSpace,
          targetChapterTitle: chap.title,
          targetChapterIndex: chap.index,
          isCrossChapter: false,
        });
      } else if (candidates.length === 1) {
        const cand = candidates[0];
        const [targetSlugPart, anchor] = cand.url.split('#');
        const targetChapter = chapters.find(
          (c) => c.cleanedSlug.endsWith(targetSlugPart.replace(/\/$/, '')) || c.url.includes(targetSlugPart)
        );

        if (targetChapter && targetChapter.index !== chap.index) {
          totalCrossReferences++;
          chap.outReferences.push({
            refText: `${matchedType} ${matchedNum}`,
            type: masterKey,
            targetUrl: cand.url,
            targetAnchor: anchor || '',
            targetChapterTitle: targetChapter.title,
            targetChapterIndex: targetChapter.index,
            isCrossChapter: true,
          });

          targetChapter.inReferences.push({
            sourceTitle: chap.title,
            sourceIndex: chap.index,
            sourceUrl: chap.url,
            refText: `${matchedType} ${matchedNum}`,
            type: masterKey,
          });

          const linkKey = `${chap.index}->${targetChapter.index}`;
          if (!linksMap.has(linkKey)) {
            linksMap.set(linkKey, {
              source: chap.id,
              target: targetChapter.id,
              sourceIndex: chap.index,
              targetIndex: targetChapter.index,
              sourceTitle: chap.title,
              targetTitle: targetChapter.title,
              value: 0,
              refs: [],
            });
          }
          const linkObj = linksMap.get(linkKey);
          linkObj.value++;
          if (!linkObj.refs.includes(`${matchedType} ${matchedNum}`)) {
            linkObj.refs.push(`${matchedType} ${matchedNum}`);
          }
        } else {
          totalIntraReferences++;
        }
      } else if (candidates.length > 1) {
        // 存在多章歧义的模糊引用（如纯例 5），仅当含显式章节/小数编号（如 1.5）时才计入跨章图
        if (matchedNum.includes('.')) {
          const scopeMatch = matchedNum.match(/^(\d+)\./);
          if (scopeMatch) {
            const chapNumStr = scopeMatch[1];
            const targetChapter = chapters.find(
              (c) =>
                c.title.includes(`第${chapNumStr}章`) ||
                c.title.includes(`第 ${chapNumStr} 章`) ||
                c.filename.startsWith(chapNumStr)
            );
            if (targetChapter && targetChapter.index !== chap.index) {
              totalCrossReferences++;
              const targetCand =
                candidates.find((c) => c.url.includes(targetChapter.cleanedSlug)) || candidates[0];

              chap.outReferences.push({
                refText: `${matchedType} ${matchedNum}`,
                type: masterKey,
                targetUrl: targetCand.url,
                targetAnchor: '',
                targetChapterTitle: targetChapter.title,
                targetChapterIndex: targetChapter.index,
                isCrossChapter: true,
              });

              targetChapter.inReferences.push({
                sourceTitle: chap.title,
                sourceIndex: chap.index,
                sourceUrl: chap.url,
                refText: `${matchedType} ${matchedNum}`,
                type: masterKey,
              });

              const linkKey = `${chap.index}->${targetChapter.index}`;
              if (!linksMap.has(linkKey)) {
                linksMap.set(linkKey, {
                  source: chap.id,
                  target: targetChapter.id,
                  sourceIndex: chap.index,
                  targetIndex: targetChapter.index,
                  sourceTitle: chap.title,
                  targetTitle: targetChapter.title,
                  value: 0,
                  refs: [],
                });
              }
              const linkObj = linksMap.get(linkKey);
              linkObj.value++;
              if (!linkObj.refs.includes(`${matchedType} ${matchedNum}`)) {
                linkObj.refs.push(`${matchedType} ${matchedNum}`);
              }
            }
          }
        }
      }
    }

    // 2. 扫描图引用
    figRegex.lastIndex = 0;
    while ((m = figRegex.exec(text)) !== null) {
      totalFigReferences++;
      chap.outReferences.push({
        refText: `图 ${m[2].trim()}`,
        type: '图',
        targetUrl: `#图-${m[2].replace(/\s+/g, '')}`,
        targetAnchor: `图-${m[2].replace(/\s+/g, '')}`,
        targetChapterTitle: chap.title,
        targetChapterIndex: chap.index,
        isCrossChapter: false,
      });
    }
  });

  // 构建 ECharts 分类字典
  const categories = Array.from(groupMap.keys()).map((gName, idx) => ({
    name: gName,
    itemStyle: { color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] },
  }));

  // 计算节点大小（根据被引用入度与包含卡片数进行对数缩放）
  const nodes = chapters.map((c) => {
    const inDegree = c.inReferences.length;
    const outDegree = c.outReferences.filter(r => r.isCrossChapter).length;
    // 基础尺寸 16px，根据入度（被引用越多次越大）和卡片数放大
    const symbolSize = Math.max(16, Math.min(52, 16 + Math.round(Math.sqrt(inDegree) * 6 + Math.log2(c.cardCount + 1) * 3)));

    return {
      id: c.id,
      name: c.title,
      cleanSlug: c.cleanedSlug,
      url: c.url,
      category: c.category,
      groupName: c.groupName,
      value: inDegree,
      symbolSize,
      cardCount: c.cardCount,
      inDegree,
      outDegree,
      intraRefCount: c.outReferences.filter(r => !r.isCrossChapter).length,
      cards: c.cards.slice(0, 30), // 取前 30 个核心卡片
    };
  });

  // 构建 ECharts 有向边列表
  const links = Array.from(linksMap.values()).map((l) => ({
    source: l.source,
    target: l.target,
    value: l.value,
    lineStyle: {
      width: Math.min(6, 1 + l.value * 0.8),
      curveness: 0.22, // 微弧线，防止双向边重叠
    },
    label: {
      show: false,
    },
    tooltip: {
      formatter: `${l.sourceTitle} 引用了 ${l.targetTitle}<br/><b>引用项目 (${l.value}次)：</b>${l.refs.slice(0, 5).join('、')}${l.refs.length > 5 ? ' 等' : ''}`,
    },
    refs: l.refs,
    sourceTitle: l.sourceTitle,
    targetTitle: l.targetTitle,
  }));

  // 构建 Mindmap 思维导图树（Book -> Group -> Chapter -> Cards）
  const treeGroups = new Map();
  chapters.forEach((c) => {
    if (!treeGroups.has(c.groupName)) {
      treeGroups.set(c.groupName, []);
    }
    treeGroups.get(c.groupName).push({
      name: c.title,
      url: c.url,
      value: `${c.cardCount}模块 · 被引${c.inReferences.length}次`,
      children: c.cards.slice(0, 15).map(card => ({
        name: card.title,
        url: `${c.url}#${card.anchor}`,
        value: card.kind,
      })),
    });
  });

  const treeData = {
    name: bookConfig?.title || bookSlug,
    children: Array.from(treeGroups.entries()).map(([gName, chaps]) => ({
      name: gName,
      children: chaps,
    })),
  };

  // 章节关联速查矩阵（供列表筛选与双向检索）
  const matrix = chapters.map((c) => ({
    id: c.id,
    title: c.title,
    url: c.url,
    groupName: c.groupName,
    cardCount: c.cardCount,
    inDegree: c.inReferences.length,
    outDegree: c.outReferences.filter(r => r.isCrossChapter).length,
    outReferences: c.outReferences,
    inReferences: c.inReferences,
  }));

  // 核心枢纽章节排行（按被引用次数降序）
  const topHubs = [...nodes]
    .sort((a, b) => b.inDegree - a.inDegree)
    .slice(0, 6)
    .map(n => ({
      name: n.name,
      url: n.url,
      inDegree: n.inDegree,
      groupName: n.groupName,
    }));

  // 构建按篇章/大章聚合的数据 (Group Aggregation)
  const groupNodesMap = new Map();
  const groupLinksMap = new Map();

  chapters.forEach((c) => {
    const gName = c.groupName;
    const catIdx = groupMap.get(gName);
    if (!groupNodesMap.has(gName)) {
      groupNodesMap.set(gName, {
        id: `group-${catIdx}`,
        name: gName,
        groupName: gName,
        category: catIdx,
        chapterCount: 0,
        cardCount: 0,
        inDegree: 0,
        outDegree: 0,
        chapters: [],
      });
    }
    const gNode = groupNodesMap.get(gName);
    gNode.chapterCount++;
    gNode.cardCount += c.cardCount;
    gNode.chapters.push({ title: c.title, url: c.url });
  });

  // 计算篇章组间引用边
  links.forEach((l) => {
    const sourceChap = chapters.find(c => c.id === l.source);
    const targetChap = chapters.find(c => c.id === l.target);
    if (sourceChap && targetChap && sourceChap.groupName !== targetChap.groupName) {
      const srcG = sourceChap.groupName;
      const tgtG = targetChap.groupName;
      const glKey = `${srcG}->${tgtG}`;
      if (!groupLinksMap.has(glKey)) {
        groupLinksMap.set(glKey, {
          source: `group-${groupMap.get(srcG)}`,
          target: `group-${groupMap.get(tgtG)}`,
          sourceName: srcG,
          targetName: tgtG,
          value: 0,
          refs: [],
        });
      }
      const gLink = groupLinksMap.get(glKey);
      gLink.value += l.value;
      l.refs.forEach(r => {
        if (!gLink.refs.includes(r)) gLink.refs.push(r);
      });

      const srcNode = groupNodesMap.get(srcG);
      const tgtNode = groupNodesMap.get(tgtG);
      if (srcNode) srcNode.outDegree += l.value;
      if (tgtNode) tgtNode.inDegree += l.value;
    }
  });

  const groupNodes = Array.from(groupNodesMap.values()).map(g => ({
    id: g.id,
    name: `${g.name} (${g.chapterCount}章)`,
    rawName: g.name,
    category: g.category,
    groupName: g.name,
    value: g.inDegree,
    chapterCount: g.chapterCount,
    cardCount: g.cardCount,
    inDegree: g.inDegree,
    outDegree: g.outDegree,
    symbolSize: Math.max(28, Math.min(64, 28 + Math.round(Math.sqrt(g.inDegree) * 6 + Math.log2(g.chapterCount + 1) * 4))),
    isGroupNode: true,
  }));

  const groupLinks = Array.from(groupLinksMap.values()).map(gl => ({
    source: gl.source,
    target: gl.target,
    value: gl.value,
    lineStyle: {
      width: Math.min(8, 2 + gl.value * 0.4),
      curveness: 0.2,
    },
    tooltip: {
      formatter: `${gl.sourceName} 引用了 ${gl.targetName}<br/><b>共 ${gl.value} 次跨篇章引用</b>`,
    },
    refs: gl.refs,
    sourceTitle: gl.sourceName,
    targetTitle: gl.targetName,
  }));

  const groupData = {
    nodes: groupNodes,
    links: groupLinks,
    categories,
  };

  return {
    ok: true,
    colSlug,
    bookSlug,
    book: {
      title: bookConfig?.title || bookSlug,
      author: bookConfig?.author || '',
      publisher: bookConfig?.publisher || '',
      description: bookConfig?.description || '',
    },
    stats: {
      totalChapters: chapters.length,
      totalCrossReferences,
      totalIntraReferences,
      totalFigReferences,
      totalLinks: links.length,
      totalGroups: groupMap.size,
    },
    topHubs,
    categories,
    nodes,
    links,
    groupData,
    treeData,
    matrix,
  };
}
