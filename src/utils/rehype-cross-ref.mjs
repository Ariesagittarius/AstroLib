import { visit } from 'unist-util-visit';

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

function getClasses(el) {
  const c = el.properties?.className;
  if (Array.isArray(c)) return c;
  if (typeof c === 'string') return c.split(/\s+/).filter(Boolean);
  return [];
}

const EMOJI_RE = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}\u{27BF}\uFE0F]/gu;

function parseTitleFromConfig(title, modules) {
  title = (title || '').trim().replace(EMOJI_RE, '').trim();
  for (const [modKey, modMeta] of Object.entries(modules)) {
    const aliases = modMeta.aliases || [modKey];
    for (const alias of aliases) {
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`^(${escapedAlias})\\s*(\\$?[\\d\\s\\.].*)$`, 'i');
      const match = title.match(regex);
      if (match) {
        const fullNumStr = match[2].trim();
        const coreMatch = fullNumStr.match(/^(\d+(?:\.\d+)*(?:[-－]\d+)?)/);
        const coreNumber = coreMatch ? coreMatch[1].replace(/－/g, '-') : fullNumStr;
        return { type: modKey, number: fullNumStr, coreNumber };
      }
    }
  }
  if (title.includes('导读')) return { type: '导读', number: '', coreNumber: '' };
  return { type: '模块', number: title, coreNumber: title };
}

function resolveBookKey(file) {
  if (!file || !file.path) return null;
  const m = String(file.path).match(/collections[\\/]([^\\/]+)[\\/]([^\\/]+)[\\/]/);
  return m ? `${m[1]}/${m[2]}` : null;
}

function findBook(collections, bookKey) {
  if (!collections) return null;
  for (const col of collections) {
    for (const book of col.books) {
      if (`${col.slug}/${book.slug}` === bookKey) return book;
    }
  }
  return null;
}

function collectText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.value || '';
  if (node.type !== 'element') return '';
  return (node.children || []).map(collectText).join('');
}

function findFirstImg(node) {
  if (node.type !== 'element') return null;
  if (node.tagName === 'img') return node;
  for (const c of node.children || []) {
    const r = findFirstImg(c);
    if (r) return r;
  }
  return null;
}

function isComponentTag(tagName) {
  return /^[A-Z]/.test(tagName || '');
}

function makeSvgNode(children, extraClass = []) {
  return {
    type: 'element',
    tagName: 'svg',
    properties: {
      className: ['badge-svg', ...extraClass],
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      ariaHidden: 'true',
    },
    children,
  };
}

function getIconSvgHast(masterKey) {
  switch (masterKey) {
    case '例题':
    case '例':
      return makeSvgNode([
        { type: 'element', tagName: 'path', properties: { d: 'M12 20h9' }, children: [] },
        { type: 'element', tagName: 'path', properties: { d: 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' }, children: [] },
      ]);
    case '定理':
    case '公理':
    case '命题':
    case '推论':
    case '引理':
    case '性质':
      return makeSvgNode([
        { type: 'element', tagName: 'polygon', properties: { points: '12 2 2 22 22 22' }, children: [] },
        { type: 'element', tagName: 'circle', properties: { cx: '12', cy: '14', r: '2' }, children: [] },
      ]);
    case '定义':
      return makeSvgNode([
        { type: 'element', tagName: 'path', properties: { d: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20' }, children: [] },
        { type: 'element', tagName: 'path', properties: { d: 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' }, children: [] },
      ]);
    case '变式':
      return makeSvgNode([
        { type: 'element', tagName: 'circle', properties: { cx: '12', cy: '12', r: '10' }, children: [] },
        { type: 'element', tagName: 'circle', properties: { cx: '12', cy: '12', r: '6' }, children: [] },
        { type: 'element', tagName: 'circle', properties: { cx: '12', cy: '12', r: '2' }, children: [] },
      ]);
    case '结论总结':
    case '结论':
    case '经验总结':
    case '经验':
      return makeSvgNode([
        { type: 'element', tagName: 'circle', properties: { cx: '12', cy: '8', r: '6' }, children: [] },
        { type: 'element', tagName: 'path', properties: { d: 'M15.477 12.89 17 22l-5-3-5 3 1.523-9.11' }, children: [] },
      ]);
    case '方法总结':
    case '方法':
      return makeSvgNode([
        { type: 'element', tagName: 'path', properties: { d: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' }, children: [] },
      ]);
    case '知识点':
    case '考点':
      return makeSvgNode([
        { type: 'element', tagName: 'path', properties: { d: 'M9 18h6' }, children: [] },
        { type: 'element', tagName: 'path', properties: { d: 'M10 22h4' }, children: [] },
        { type: 'element', tagName: 'path', properties: { d: 'M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.7 3.5 6h7c2-1.3 3.5-3.5 3.5-6a7 7 0 0 0-7-7z' }, children: [] },
      ]);
    case '问题':
    case '习题':
    case '解析':
      return makeSvgNode([
        { type: 'element', tagName: 'circle', properties: { cx: '12', cy: '12', r: '10' }, children: [] },
        { type: 'element', tagName: 'path', properties: { d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' }, children: [] },
        { type: 'element', tagName: 'line', properties: { x1: '12', y1: '17', x2: '12.01', y2: '17' }, children: [] },
      ]);
    case '图':
    default:
      return makeSvgNode([
        { type: 'element', tagName: 'rect', properties: { x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2' }, children: [] },
        { type: 'element', tagName: 'circle', properties: { cx: '8.5', cy: '8.5', r: '1.5' }, children: [] },
        { type: 'element', tagName: 'polyline', properties: { points: '21 15 16 10 5 21' }, children: [] },
      ]);
  }
}

function makeArrowSvgNode() {
  return makeSvgNode([
    { type: 'element', tagName: 'path', properties: { d: 'M7 17l9.2-9.2M17 17V8H8' }, children: [] },
  ], ['badge-arrow-svg']);
}

function makeBlockBadge(masterKey, _emoji, text, targetId) {
  const isInteractive = Boolean(targetId);
  const classes = isInteractive
    ? ['block-ref-badge', 'interactive-badge']
    : ['block-ref-badge', 'static-badge'];
  const props = { className: classes, dataType: masterKey };
  if (targetId) props.dataTarget = targetId;

  const children = [
    {
      type: 'element',
      tagName: 'span',
      properties: { className: ['block-icon'] },
      children: [getIconSvgHast(masterKey)],
    },
    {
      type: 'element',
      tagName: 'span',
      properties: { className: ['block-text'] },
      children: [{ type: 'text', value: text }],
    },
  ];

  if (isInteractive) {
    children.push({
      type: 'element',
      tagName: 'span',
      properties: { className: ['block-arrow'] },
      children: [makeArrowSvgNode()],
    });
  }

  return {
    type: 'element',
    tagName: 'span',
    properties: props,
    children,
  };
}

function makeFigBadge(figText, targetId) {
  const isInteractive = Boolean(targetId);
  const classes = isInteractive
    ? ['fig-ref-badge', 'interactive-badge']
    : ['fig-ref-badge', 'static-badge'];
  const props = { className: classes };
  if (targetId) props.dataTarget = targetId;

  const children = [
    {
      type: 'element',
      tagName: 'span',
      properties: { className: ['fig-icon'] },
      children: [getIconSvgHast('图')],
    },
    {
      type: 'element',
      tagName: 'span',
      properties: { className: ['fig-text'] },
      children: [{ type: 'text', value: `图 ${figText}`.replace(/\s+/g, ' ') }],
    },
  ];

  if (isInteractive) {
    children.push({
      type: 'element',
      tagName: 'span',
      properties: { className: ['fig-arrow'] },
      children: [makeArrowSvgNode()],
    });
  }

  return {
    type: 'element',
    tagName: 'span',
    properties: props,
    children,
  };
}

function replaceTextNode(value, ctx) {
  const { blockRefRegex, figRegex, modules, localTargets, figIdSet, forceStatic } = ctx;

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

    parts.push(makeBlockBadge(masterKey, emoji, `${matchedType}${matchedNum}`, forceStatic ? null : localId));
    last = m.index + m[0].length;
  }
  if (found) {
    if (last < value.length) parts.push({ type: 'text', value: value.slice(last) });
    return parts;
  }

  figRegex.lastIndex = 0;
  while ((m = figRegex.exec(value)) !== null) {
    found = true;
    const matchedNum = m[2];
    const figNum = matchedNum.replace(/\s+/g, '');
    const figId = `图-${figNum}`;
    const localFig = figIdSet.has(figId);
    if (m.index > last) parts.push({ type: 'text', value: value.slice(last, m.index) });
    parts.push(makeFigBadge(matchedNum, forceStatic ? null : (localFig ? figId : null)));
    last = m.index + m[0].length;
  }
  if (found) {
    if (last < value.length) parts.push({ type: 'text', value: value.slice(last) });
    return parts;
  }

  return null;
}

export function rehypeCrossRef(options = {}) {
  const { collections, refs = 'interactive' } = options;
  const forceStatic = refs === 'static';
  return (tree, file) => {
    const bookKey = resolveBookKey(file);
    const book = findBook(collections, bookKey);
    if (!book || !book.modules) return;

    const modules = book.modules;

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

    const trackSelectors = book.trackClasses && book.trackClasses.length
      ? book.trackClasses.map((s) => s.replace(/^\./, ''))
      : ['toc-chunk'];
    const localTargets = {};
    const figIdSet = new Set();
    let solutionSeq = 0;
    const parentMap = new WeakMap();

    const attrValue = (node, name) => {
      for (const attr of node.attributes || []) {
        if (attr.type === 'mdxJsxAttribute' && attr.name === name && typeof attr.value === 'string') {
          return attr.value;
        }
      }
      return null;
    };

    visit(tree, 'mdxJsxFlowElement', (node, index, parent) => {
      if (parent) parentMap.set(node, parent);
      const renderedClass = COMPONENT_CLASS[node.name];
      if (renderedClass && trackSelectors.includes(renderedClass)) {
        const rawTitle = attrValue(node, 'title');
        if (rawTitle) {
          const { type, number, coreNumber } = parseTitleFromConfig(rawTitle, modules);
          if (number) {
            const cleanId = rawTitle.trim().replace(/\s+/g, '-');
            localTargets[`${type}${number}`.replace(/\s+/g, '')] = cleanId;
            if (coreNumber) {
              localTargets[`${type}${coreNumber}`.replace(/\s+/g, '')] = cleanId;
            }
          }
        }
      }

      if (node.name === 'Solution') {
        solutionSeq += 1;
        const summaryText = (attrValue(node, 'title') || '查看解析与步骤').trim();
        const { type, number, coreNumber } = parseTitleFromConfig(summaryText, modules);
        if (number) {
          const solId = `sol-ref-block-${solutionSeq}`;
          localTargets[`${type}${number}`.replace(/\s+/g, '')] = solId;
          if (coreNumber) localTargets[`${type}${coreNumber}`.replace(/\s+/g, '')] = solId;
        }
      }
    });

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

    const jobs = [];
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || parent.type !== 'element') return;
      const tag = parent.tagName;
      if (tag === 'script' || tag === 'style') return;

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
        blockRefRegex, figRegex, modules, localTargets, figIdSet, forceStatic,
      });
      if (replaced) jobs.push({ parent, index, children: replaced });
    });

    for (const job of jobs) {
      job.parent.children.splice(job.index, 1, ...job.children);
    }

    if (tree.children && tree.children.length > 0) {
      const first = tree.children.find((c) => c.type === 'element' && !isComponentTag(c.tagName));
      if (first) {
        first.properties = { ...(first.properties || {}), dataXrefBuilt: '' };
      }
    }
  };
}
