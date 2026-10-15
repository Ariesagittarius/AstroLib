/**
 * src/features/scratchpad/core/markdown-parser.ts
 * ============================================================================
 * 空白文档 Markdown / KaTeX / Mermaid / 学术卡片 核心解析引擎
 * ============================================================================
 * 职责：
 * 1. 负责 Frontmatter YAML 元数据与正文的高性能解析与双向序列化；
 * 2. 调度 KaTeX 实现行内与块级数学公式实时渲染，并注入 data-latex 属性；
 * 3. 拦截 Mermaid 图表代码块，编译为 AstroLib 统一的 .mermaid-container；
 * 4. 识别并编译 AstroLib 专属学术卡片组件（Knowledge, Theorem, Definition, Example, Note, Solution, Algorithm）；
 * 5. 产出语义化 HTML，并提取章节多级大纲（TOC）供右侧侧载栏联动。
 * ============================================================================
 */

import { marked } from 'marked';
import katex from 'katex';
import type { DocumentMetadata, ParsedDocument, ParsedHeadingItem } from '../types.ts';

// 配置 marked 解析器基础参数
marked.setOptions({
  gfm: true,
  breaks: false,
});

/**
 * 提取并解析 Markdown 顶部的 YAML Frontmatter
 */
export function parseFrontmatter(source: string): { metadata: DocumentMetadata; rawFrontmatter: string; body: string } {
  if (!source) {
    return { metadata: { title: '未命名草稿' }, rawFrontmatter: '', body: '' };
  }

  const clean = source.replace(/^\uFEFF/, '');
  const match = clean.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

  if (!match) {
    return {
      metadata: { title: '未命名草稿' },
      rawFrontmatter: '',
      body: clean,
    };
  }

  const rawFrontmatter = match[1];
  const body = clean.slice(match[0].length);
  const metadata: DocumentMetadata = { title: '未命名草稿' };

  const lines = rawFrontmatter.split(/\r?\n/);
  let currentListKey: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // 处理列表子项: - item
    if (trimmed.startsWith('- ') && currentListKey) {
      const itemVal = trimmed.slice(2).trim().replace(/^['"]|['"]$/g, '');
      if (Array.isArray(metadata[currentListKey])) {
        metadata[currentListKey].push(itemVal);
      }
      continue;
    }

    // 解析 key: value
    const kv = line.match(/^([a-zA-Z0-9_\-]+)\s*:\s*(.*)$/);
    if (kv) {
      const key = kv[1].trim();
      let val = kv[2].trim();

      // 判断是否开启新的多行列表: tags:
      if (!val) {
        currentListKey = key;
        metadata[key] = [];
        continue;
      }

      currentListKey = null;

      // 判断内联数组: [a, b, c]
      if (val.startsWith('[') && val.endsWith(']')) {
        const inner = val.slice(1, -1).trim();
        metadata[key] = inner
          ? inner.split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
          : [];
        continue;
      }

      // 去除两端单双引号
      val = val.replace(/^['"]|['"]$/g, '');
      metadata[key] = val;
    }
  }

  if (!metadata.title) {
    metadata.title = '未命名草稿';
  }

  return { metadata, rawFrontmatter, body };
}

/**
 * 将结构化元数据序列化为 YAML Frontmatter 字符串
 */
export function serializeFrontmatter(meta: DocumentMetadata): string {
  const lines: string[] = ['---'];
  const title = (meta.title || '未命名草稿').trim();
  lines.push(`title: "${title.replace(/"/g, '\\"')}"`);

  if (meta.description) {
    lines.push(`description: "${meta.description.replace(/"/g, '\\"')}"`);
  }
  if (meta.author) {
    lines.push(`author: "${meta.author.replace(/"/g, '\\"')}"`);
  }
  if (meta.subject) {
    lines.push(`subject: "${meta.subject.replace(/"/g, '\\"')}"`);
  }
  if (meta.date) {
    lines.push(`date: "${meta.date}"`);
  }
  if (Array.isArray(meta.tags) && meta.tags.length > 0) {
    lines.push('tags:');
    for (const t of meta.tags) {
      lines.push(`  - "${String(t).replace(/"/g, '\\"')}"`);
    }
  }

  // 写入其他自定义字段
  for (const [k, v] of Object.entries(meta)) {
    if (['title', 'description', 'author', 'subject', 'date', 'tags'].includes(k)) continue;
    if (typeof v === 'string') {
      lines.push(`${k}: "${v.replace(/"/g, '\\"')}"`);
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      lines.push(`${k}: ${v}`);
    } else if (Array.isArray(v)) {
      lines.push(`${k}:`);
      for (const item of v) {
        lines.push(`  - "${String(item).replace(/"/g, '\\"')}"`);
      }
    }
  }

  lines.push('---');
  return lines.join('\n');
}

/**
 * 组装完整 Markdown（Frontmatter + 正文）
 */
export function combineDocument(meta: DocumentMetadata, body: string): string {
  const fm = serializeFrontmatter(meta);
  return `${fm}\n\n${body.trim()}\n`;
}

/**
 * 生成标题的安全 URL Slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, '') // 移除 HTML 标签
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '') // 保留中文字符、字母、数字、破折号
    .replace(/\s+/g, '-');
}

/**
 * 将 AstroLib 学术卡片标签编译为符合站点样式规范的 DOM 结构
 */
function transformAcademicCards(html: string): string {
  // 定义 12 种卡片的映射规则
  const cardConfigs: Record<string, { className: string; title: string; iconKind: string; isDetails?: boolean }> = {
    knowledge: { className: 'knowledge-card', title: '知识点', iconKind: 'knowledge' },
    theorem: { className: 'knowledge-card', title: '定理', iconKind: 'theorem' },
    definition: { className: 'knowledge-card', title: '定义', iconKind: 'definition' },
    property: { className: 'knowledge-card', title: '性质', iconKind: 'property' },
    formula: { className: 'knowledge-card', title: '公式', iconKind: 'formula' },
    example: { className: 'example-card', title: '例题', iconKind: 'example' },
    variant: { className: 'variant-card', title: '变式', iconKind: 'variant' },
    method: { className: 'method-card', title: '方法总结', iconKind: 'method' },
    summary: { className: 'summary-card', title: '小结', iconKind: 'summary' },
    note: { className: 'note-block', title: '注意', iconKind: 'note' },
    solution: { className: 'solution-details', title: '查看解析与步骤', iconKind: 'solution', isDetails: true },
    algorithm: { className: 'algorithm-card', title: '算法', iconKind: 'algorithm' },
  };

  const getCardIconSvg = (kind: string) => {
    switch (kind) {
      case 'theorem':
        return '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18 4H6v2l6.5 6L6 18v2h12v-3h-7l5-5-5-5h7z"/></svg>';
      case 'definition':
        return '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm-1 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/></svg>';
      case 'property':
        return '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2l-5.5 9h11z"/><circle cx="17.5" cy="17.5" r="4.5"/><path d="M3 13.5h8v8H3z"/></svg>';
      case 'note':
        return '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>';
      case 'algorithm':
        return '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>';
      default:
        return '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>';
    }
  };

  let transformed = html;

  // 正则匹配自定义卡片组件标签：<Theorem title="...">...</Theorem> 等
  const tagPattern = /<([A-Z][a-zA-Z0-9]*)\b([^>]*)>([\s\S]*?)<\/\1>/g;
  transformed = transformed.replace(tagPattern, (_match, tagName, attrsStr, content) => {
    const key = tagName.toLowerCase();
    const config = cardConfigs[key];
    if (!config) {
      // 非已知卡片，原样返回
      return _match;
    }

    // 提取 title="..."
    const titleMatch = attrsStr.match(/\btitle=(?:["']([^"']*)["']|{`([^`]*)`})/);
    const title = (titleMatch ? (titleMatch[1] || titleMatch[2]) : config.title).trim();
    const cleanId = slugify(title) || `card-${Math.random().toString(36).slice(2, 7)}`;

    if (config.isDetails) {
      return `
        <details class="${config.className}" data-title="${title}" id="${cleanId}">
          <summary class="solution-summary">
            <span class="solution-icon">${getCardIconSvg(config.iconKind)}</span>
            <span class="solution-title-text">${title}</span>
          </summary>
          <div class="solution-content">
            ${content}
          </div>
        </details>
      `.trim();
    }

    if (key === 'note') {
      return `
        <div class="note-block" data-title="${title}" id="${cleanId}">
          <div class="note-header">
            <span class="note-mdicon" aria-hidden="true">${getCardIconSvg('note')}</span>
            <span class="note-title-text">${title}</span>
          </div>
          <div class="note-content">
            ${content}
          </div>
        </div>
      `.trim();
    }

    if (key === 'example') {
      return `
        <div class="example-card toc-chunk" data-title="${title}" id="${cleanId}">
          <div class="card-header" role="heading" aria-level="4">${title}</div>
          <div class="card-body">
            ${content}
          </div>
        </div>
      `.trim();
    }

    // 通用知识卡片与衍生卡片
    return `
      <div class="${config.className} toc-chunk" data-title="${title}" data-icon-kind="${config.iconKind}" id="${cleanId}">
        <div class="card-header" role="heading" aria-level="4">
          <span class="card-mdicon" aria-hidden="true">${getCardIconSvg(config.iconKind)}</span>
          <span class="card-title-text">${title}</span>
        </div>
        <div class="card-content">
          ${content}
        </div>
      </div>
    `.trim();
  });

  return transformed;
}

/**
 * 核心 Markdown 与公式渲染引擎
 */
export function renderMarkdown(markdownBody: string): { html: string; headings: ParsedHeadingItem[] } {
  if (!markdownBody || !markdownBody.trim()) {
    return {
      html: '<div class="blank-doc-empty-hint">暂无内容，请在左侧编辑器中输入 Markdown 内容或载入模板。</div>',
      headings: [],
    };
  }

  // 1. 保护与提取 Mermaid 图表代码块
  const mermaidPlaceholders: Array<{ placeholder: string; replacement: string }> = [];
  let processed = markdownBody.replace(/```mermaid\r?\n([\s\S]*?)```/g, (_m, code) => {
    const p = `@@MERMAID_PLACEHOLDER_${mermaidPlaceholders.length}@@`;
    const cleanCode = code.trim();
    const encoded = encodeURIComponent(cleanCode);
    const replacement = `<div class="mermaid-container" data-mermaid-code="${encoded}" data-feature="mermaid"><div class="mermaid-render"><pre class="mermaid">${cleanCode}</pre></div></div>`;
    mermaidPlaceholders.push({ placeholder: p, replacement });
    return p;
  });

  // 2. 保护与提取 LaTeX 数学公式（防止 marked 误将其中的 _ / * / \ 转译）
  const mathPlaceholders: Array<{ placeholder: string; replacement: string }> = [];

  // 2.1 块级公式 $$ ... $$ (外层优先，完整保留内部的 pmatrix / aligned 环境)
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (fullMatch, tex) => {
    const p = `@@MATH_BLOCK_${mathPlaceholders.length}@@`;
    const cleanTex = tex.trim();
    try {
      const renderedHtml = katex.renderToString(cleanTex, {
        displayMode: true,
        throwOnError: false,
      });
      const replacement = `<div class="katex-display" data-latex="${encodeURIComponent(cleanTex)}">${renderedHtml}</div>`;
      mathPlaceholders.push({ placeholder: p, replacement });
    } catch {
      mathPlaceholders.push({ placeholder: p, replacement: `<pre class="katex-error">${fullMatch}</pre>` });
    }
    return p;
  });

  // 2.2 独立的块级环境公式 \begin{...} ... \end{...}（未包裹在 $$ 中的裸环境）
  processed = processed.replace(/\\begin\{([a-zA-Z*]+)\}([\s\S]*?)\\end\{\1\}/g, (fullMatch) => {
    const p = `@@MATH_BLOCK_${mathPlaceholders.length}@@`;
    try {
      const renderedHtml = katex.renderToString(fullMatch, {
        displayMode: true,
        throwOnError: false,
      });
      const replacement = `<div class="katex-display" data-latex="${encodeURIComponent(fullMatch)}">${renderedHtml}</div>`;
      mathPlaceholders.push({ placeholder: p, replacement });
    } catch {
      mathPlaceholders.push({ placeholder: p, replacement: `<pre class="katex-error">${fullMatch}</pre>` });
    }
    return p;
  });

  // 2.3 行内公式 $ ... $
  processed = processed.replace(/(?<!\\)\$((?:\\\$|[^$\r\n])+?)\$/g, (fullMatch, tex) => {
    const p = `@@MATH_INLINE_${mathPlaceholders.length}@@`;
    const cleanTex = tex.trim();
    try {
      const renderedHtml = katex.renderToString(cleanTex, {
        displayMode: false,
        throwOnError: false,
      });
      const replacement = `<span class="katex" data-latex="${encodeURIComponent(cleanTex)}">${renderedHtml}</span>`;
      mathPlaceholders.push({ placeholder: p, replacement });
    } catch {
      mathPlaceholders.push({ placeholder: p, replacement: `<code>${fullMatch}</code>` });
    }
    return p;
  });

  // 3. 执行标准 Markdown 解析 (GFM)
  let rawHtml = marked.parse(processed) as string;

  // 4. 回填 Mermaid 图表
  for (const item of mermaidPlaceholders) {
    rawHtml = rawHtml.replace(item.placeholder, item.replacement);
  }

  // 5. 回填 LaTeX 数学公式
  for (const item of mathPlaceholders) {
    rawHtml = rawHtml.replace(item.placeholder, item.replacement);
  }

  // 6. 转译 AstroLib 学术卡片组件
  let finalHtml = transformAcademicCards(rawHtml);

  // 7. 扫描并注入大纲标题（Headings Slug & List）
  const headings: ParsedHeadingItem[] = [];
  const headingRegex = /<h([1-4])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;

  finalHtml = finalHtml.replace(headingRegex, (_match, levelStr, attrsStr, innerHtml) => {
    const level = parseInt(levelStr, 10);
    // 纯文本标题
    const text = innerHtml.replace(/<[^>]+>/g, '').trim();
    const idMatch = attrsStr.match(/\bid=["']([^"']*)["']/);
    const existingId = idMatch ? idMatch[1] : '';
    const id = existingId || slugify(text) || `heading-${headings.length + 1}`;

    headings.push({ id, text, level });

    if (existingId) {
      return _match;
    }
    return `<h${level} id="${id}" ${attrsStr}>${innerHtml}</h${level}>`;
  });

  return { html: finalHtml, headings };
}

/**
 * 完整解析整个空白文档文本
 */
export function renderDocument(fullSource: string): ParsedDocument {
  const { metadata, rawFrontmatter, body } = parseFrontmatter(fullSource);
  const { html, headings } = renderMarkdown(body);
  return {
    metadata,
    rawFrontmatter,
    body,
    html,
    headings,
  };
}
