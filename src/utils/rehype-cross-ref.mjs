/**
 * rehype-cross-ref：构建期“引用徽章化”下沉插件（性能优化·方案 B）
 *
 * 背景：此前“例题 1.74”“图 3-48”等引用徽章完全由客户端在每次 SPA 切换后
 * 全量扫描正文文本节点生成（PageSidebarOverride 的 linkPageElements），
 * 单页数千文本节点 × 正则替换 + DOM 变更，是切换卡顿的主要来源之一。
 *
 * 本插件在 @mdx-js/mdx 的 hast 阶段（rehype-katex 之后）把同一套匹配逻辑
 * 下沉到构建期：
 *   - 正文中的引用直接输出为 <span class="block-ref-badge / fig-ref-badge">；
 *   - 同页引用生成 interactive-badge（带 data-target，可点击/悬停联动）；
 *   - 跨页/找不到目标生成 static-badge（与既有客户端行为一致）；
 *   - 同时完成 figcaption 的 id 分配与图片标记（客户端图联动依赖）；
 *   - 在首个普通 HTML 元素注入 data-xref-built 标记，客户端据此跳过重复扫描。
 *
 * 行为与 PageSidebarOverride 中 linkPageElements 的既有规则严格对齐：
 *   - 文本节点匹配顺序：块引用（例题/定理…）优先，命中则不再匹配图片引用；
 *   - 匹配到的文本按“去空格”拼入 badge 文本；
 *   - 卡片标题 / summary / 公式（.katex）内部文本不参与匹配。
 *
 * 构建期做（相对客户端）更安全的两个修正（客户端潜在 bug，不继承）：
 *   - 不匹配 .katex 公式内部的文本（客户端可能把公式内文字误替换成徽章）；
 *   - 不替换 figcaption 自身文本（避免目标 caption 被徽章化后跳转失效）。
 *
 * 说明：MDX 组件（<Knowledge title="…"> 等）在 hast 阶段以“组件名”为 tagName
 * 的 element 存在（未渲染成 DOM），其渲染后的卡片 id 可按组件逻辑预测
 * （title.trim().replace(/\s+/g, '-')），与客户端运行时读到的卡片 id 一致。
 */

import { visit } from 'unist-util-visit';

/* ------------------------------------------------------------------ *
 *  通用工具
 * ------------------------------------------------------------------ */

/** MDX 卡片组件名 → 渲染后的 CSS 类名（与 src/components 下各 .astro 模板一致） */
const COMPONENT_CLASS = {
  Example: 'example-card',
  Variant: 'variant-card',
  Knowledge: 'knowledge-card',
  Summary: 'summary-card',
  Method: 'method-card',
  Guide: 'guide-block',
  Block: 'fallback-block',
  Exercise: 'exercise-card',
};

/** 元素 class 归一为数组（hast 中可能是数组或字符串） */
function getClasses(el) {
  const c = el.properties?.className;
  if (Array.isArray(c)) return c;
  if (typeof c === 'string') return c.split(/\s+/).filter(Boolean);
  return [];
}

/** 与客户端一致的 emoji 剔除正则 */
const EMOJI_RE = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}\u{27BF}\uFE0F]/gu;

/**
 * 与客户端 parseTitleFromConfig 完全一致的标题分词：
 * 返回 { type: 模块key, number: 编号文本 } 或 { type:'模块', number: 原文 }。
 */
function parseTitleFromConfig(title, modules) {
  title = (title || '').trim().replace(EMOJI_RE, '').trim();
  for (const [modKey, modMeta] of Object.entries(modules)) {
    const aliases = modMeta.aliases || [modKey];
    for (const alias of aliases) {
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`^(${escapedAlias})\\s*(\\$?[\\d\\s\\.].*)$`, 'i');
      const match = title.match(regex);
      if (match) return { type: modKey, number: match[2].trim() };
    }
  }
  if (title.includes('导读')) return { type: '导读', number: '' };
  return { type: '模块', number: title };
}

/** 从文件路径/URL 推断当前书标识（collections/<col>/<book>），非内容页返回 null */
function resolveBookKey(file) {
  if (!file || !file.path) return null;
  const m = String(file.path).match(/collections[\\/]([^\\/]+)[\\/]([^\\/]+)[\\/]/);
  return m ? `${m[1]}/${m[2]}` : null;
}

/** 由书标识在 collections 配置中查找 book 配置 */
function findBook(collections, bookKey) {
  if (!collections) return null;
  for (const col of collections) {
    for (const book of col.books) {
      if (`${col.slug}/${book.slug}` === bookKey) return book;
    }
  }
  return null;
}

/** 拼接元素内全部文本（近似 textContent） */
function collectText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.value || '';
  if (node.type !== 'element') return '';
  return (node.children || []).map(collectText).join('');
}

/** 在元素子树中找第一个 img */
function findFirstImg(node) {
  if (node.type !== 'element') return null;
  if (node.tagName === 'img') return node;
  for (const c of node.children || []) {
    const r = findFirstImg(c);
    if (r) return r;
  }
  return null;
}

/** MDX 组件名（首字母大写的 tagName 视为组件，普通 HTML 标签为小写） */
function isComponentTag(tagName) {
  return /^[A-Z]/.test(tagName || '');
}

/* ------------------------------------------------------------------ *
 *  badge 构造（hast 元素，结构与客户端渲染结果一致）
 * ------------------------------------------------------------------ */

function makeBlockBadge(masterKey, emoji, text, targetId) {
  const classes = targetId
    ? ['block-ref-badge', 'interactive-badge']
    : ['block-ref-badge', 'static-badge'];
  const props = { className: classes, dataType: masterKey };
  if (targetId) props.dataTarget = targetId;
  return {
    type: 'element',
    tagName: 'span',
    properties: props,
    children: [
      {
        type: 'element',
        tagName: 'span',
        properties: { className: ['block-icon'] },
        children: [{ type: 'text', value: emoji }],
      },
      {
        type: 'element',
        tagName: 'span',
        properties: { className: ['block-text'] },
        children: [{ type: 'text', value: text }],
      },
    ],
  };
}

function makeFigBadge(figText, targetId) {
  const classes = targetId
    ? ['fig-ref-badge', 'interactive-badge']
    : ['fig-ref-badge', 'static-badge'];
  const props = { className: classes };
  if (targetId) props.dataTarget = targetId;
  return {
    type: 'element',
    tagName: 'span',
    properties: props,
    children: [
      {
        type: 'element',
        tagName: 'span',
        properties: { className: ['fig-icon'] },
        children: [{ type: 'text', value: '图' }],
      },
      {
        type: 'element',
        tagName: 'span',
        properties: { className: ['fig-text'] },
        children: [{ type: 'text', value: figText }],
      },
    ],
  };
}

/* ------------------------------------------------------------------ *
 *  文本节点匹配与替换
 * ------------------------------------------------------------------ */

/**
 * 对单个文本节点执行替换。返回新 children 数组；无匹配返回 null。
 * 顺序与客户端一致：块引用优先，命中后不再匹配图片引用。
 */
function replaceTextNode(value, ctx) {
  const { blockRefRegex, figRegex, modules, localTargets, figIdSet } = ctx;

  // A. 块引用匹配（例题/定理/…）
  let m;
  blockRefRegex.lastIndex = 0;
  let found = false;
  const parts = [];
  let last = 0;
  while ((m = blockRefRegex.exec(value)) !== null) {
    found = true;
    const matchedType = m[1].trim();
    const matchedNum = m[2].trim();
    let masterKey = matchedType;
    for (const [modKey, modMeta] of Object.entries(modules)) {
      if (modMeta.aliases && modMeta.aliases.includes(matchedType)) {
        masterKey = modKey;
        break;
      }
    }
    const modMeta = modules[masterKey] || {};
    const emoji = modMeta.emoji || '📦';
    const lookupKey = `${masterKey}${matchedNum}`.replace(/\s+/g, '');
    const localId = localTargets[lookupKey];
    if (m.index > last) parts.push({ type: 'text', value: value.slice(last, m.index) });
    parts.push(makeBlockBadge(masterKey, emoji, `${matchedType}${matchedNum}`, localId));
    last = m.index + m[0].length;
  }
  if (found) {
    if (last < value.length) parts.push({ type: 'text', value: value.slice(last) });
    return parts;
  }

  // B. 图片引用匹配（图 3-48）
  figRegex.lastIndex = 0;
  while ((m = figRegex.exec(value)) !== null) {
    found = true;
    const matchedNum = m[2];
    const figNum = matchedNum.replace(/\s+/g, '');
    const figId = `图-${figNum}`;
    const localFig = figIdSet.has(figId);
    if (m.index > last) parts.push({ type: 'text', value: value.slice(last, m.index) });
    parts.push(makeFigBadge(matchedNum, localFig ? figId : null));
    last = m.index + m[0].length;
  }
  if (found) {
    if (last < value.length) parts.push({ type: 'text', value: value.slice(last) });
    return parts;
  }

  return null;
}

/* ------------------------------------------------------------------ *
 *  插件主体
 * ------------------------------------------------------------------ */

/**
 * @param {{ collections?: Array }} options 传入 collections 配置
 */
export function rehypeCrossRef(options = {}) {
  const { collections } = options;
  return (tree, file) => {
    const bookKey = resolveBookKey(file);
    const book = findBook(collections, bookKey);
    if (!book || !book.modules) return;

    const modules = book.modules;

    // 1. 编译匹配正则（与客户端一致的别名集，排除图片模块）
    const allAliases = [];
    for (const [key, meta] of Object.entries(modules)) {
      if (key !== '图' && !meta.isImage && meta.aliases) {
        allAliases.push(...meta.aliases);
      }
    }
    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const typePattern = allAliases.map(escapeRegExp).join('|');
    const blockRefRegex = new RegExp(`(${typePattern})\\s*(\\d+(?:\\.\\d+)*)`, 'g');
    const figRegex = new RegExp(`(图)\\s*(\\d+\\s*[-－]\\s*\\d+)`, 'g');

    // 2. 同页 localTargets：本书 trackClasses 对应的 MDX 卡片组件 + Solution
    const trackSelectors = book.trackClasses && book.trackClasses.length
      ? book.trackClasses.map((s) => s.replace(/^\./, ''))
      : ['toc-chunk'];
    const localTargets = {};
    const figIdSet = new Set();
    let solutionSeq = 0;
    const parentMap = new WeakMap();

    // 从 mdxJsx 节点的 attributes 中取指定属性值（字符串字面量）
    const attrValue = (node, name) => {
      for (const attr of node.attributes || []) {
        if (attr.type === 'mdxJsxAttribute' && attr.name === name && typeof attr.value === 'string') {
          return attr.value;
        }
      }
      return null;
    };

    // 2a/2b. 卡片与 Solution：MDX 组件节点（@mdx-js/mdx 的 hast 阶段保留为
    // mdxJsxFlowElement，渲染后的卡片 id 可按组件逻辑预测：
    // title.trim().replace(/\s+/g, '-')，与客户端运行时读到的卡片 id 一致）
    visit(tree, 'mdxJsxFlowElement', (node, index, parent) => {
      if (parent) parentMap.set(node, parent);
      const renderedClass = COMPONENT_CLASS[node.name];
      if (renderedClass && trackSelectors.includes(renderedClass)) {
        const rawTitle = attrValue(node, 'title');
        if (rawTitle) {
          const { type, number } = parseTitleFromConfig(rawTitle, modules);
          if (number) {
            const cleanId = rawTitle.trim().replace(/\s+/g, '-');
            localTargets[`${type}${number}`.replace(/\s+/g, '')] = cleanId;
          }
        }
      }
      // Solution 板块：title 默认“查看解析与步骤”，id 由客户端按文档序补
      // （sol-ref-block-N，与客户端编号一致），这里登记 key → 客户端运行时 id。
      if (node.name === 'Solution') {
        solutionSeq += 1;
        const summaryText = (attrValue(node, 'title') || '查看解析与步骤').trim();
        const { type, number } = parseTitleFromConfig(summaryText, modules);
        if (number) localTargets[`${type}${number}`.replace(/\s+/g, '')] = `sol-ref-block-${solutionSeq}`;
      }
    });

    // 2c. figcaption / 目标段落：分配图 id 并标记图片（仅普通 HTML 元素）
    visit(tree, 'element', (node, index, parent) => {
      if (parent) parentMap.set(node, parent);
      const tag = node.tagName;
      const classes = getClasses(node);
      if (tag !== 'p' && tag !== 'div' && tag !== 'figcaption') return;
      const text = collectText(node).trim();
      const captionMatch = text.match(/^图\s*(\d+\s*[-－]\s*\d+)$/);
      if (!captionMatch) return;
      const figNum = captionMatch[1].replace(/\s+/g, '');
      const figId = `图-${figNum}`;
      node.properties.id = figId;
      if (!classes.includes('fig-target-caption')) {
        node.properties.className = [...classes, 'fig-target-caption'];
      }
      figIdSet.add(figId);
      // 前一个 element 兄弟中的 img 标记为目标图
      const holder = parentMap.get(node);
      if (holder) {
        const idx = holder.children.indexOf(node);
        for (let i = idx - 1; i >= 0; i--) {
          const prev = holder.children[i];
          if (prev.type !== 'element') continue;
          const img = prev.tagName === 'img' ? prev : findFirstImg(prev);
          if (img) {
            const imgClasses = getClasses(img);
            if (!imgClasses.includes('fig-target-image')) {
              img.properties.className = [...imgClasses, 'fig-target-image'];
            }
            img.properties.dataFigRef = figId;
          }
          break;
        }
      }
    });

    // 3. 文本节点替换（收集-替换，避免遍历被新插入节点干扰）
    const jobs = [];
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || parent.type !== 'element') return;
      const tag = parent.tagName;
      if (tag === 'script' || tag === 'style') return;
      // 沿祖先链跳过：summary / 卡片标题 / 公式 / 目标 caption / 已生成 badge
      let anc = parent;
      while (anc && anc.type === 'element') {
        const ac = getClasses(anc);
        if (
          ac.includes('katex') || ac.includes('katex-display') ||
          ac.includes('card-header') || ac.includes('fallback-header') ||
          ac.includes('guide-header') || ac.includes('fig-target-caption') ||
          ac.includes('block-ref-badge') || ac.includes('fig-ref-badge')
        ) {
          return;
        }
        if (anc.tagName === 'summary') return;
        anc = parentMap.get(anc);
      }
      const value = node.value;
      if (!value || !value.trim()) return;
      const replaced = replaceTextNode(value, {
        blockRefRegex, figRegex, modules, localTargets, figIdSet,
      });
      if (replaced) jobs.push({ parent, index, children: replaced });
    });

    for (const job of jobs) {
      job.parent.children.splice(job.index, 1, ...job.children);
    }

    // 4. 注入 data-xref-built 标记（客户端据此跳过重复扫描）。
    // 只能落在“普通 HTML 元素”上（MDX 组件节点的属性会作为 props 传给组件，
    // 不会渲染进最终 HTML），因此取第一个 tagName 为小写（非组件）的元素。
    if (tree.children && tree.children.length > 0) {
      const first = tree.children.find((c) => c.type === 'element' && !isComponentTag(c.tagName));
      if (first) {
        first.properties = { ...(first.properties || {}), dataXrefBuilt: '' };
      }
    }
  };
}
