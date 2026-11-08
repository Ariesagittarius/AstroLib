import { marked } from 'marked';
import katex from 'katex';
import type { DocumentMetadata, ParsedDocument, ParsedHeadingItem } from '../types.ts';

marked.setOptions({
  gfm: true,
  breaks: false,
});

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

    if (trimmed.startsWith('- ') && currentListKey) {
      const itemVal = trimmed.slice(2).trim().replace(/^['"]|['"]$/g, '');
      if (Array.isArray(metadata[currentListKey])) {
        metadata[currentListKey].push(itemVal);
      }
      continue;
    }

    const kv = line.match(/^([a-zA-Z0-9_\-]+)\s*:\s*(.*)$/);
    if (kv) {
      const key = kv[1].trim();
      let val = kv[2].trim();

      if (!val) {
        currentListKey = key;
        metadata[key] = [];
        continue;
      }

      currentListKey = null;

      if (val.startsWith('[') && val.endsWith(']')) {
        const inner = val.slice(1, -1).trim();
        metadata[key] = inner
          ? inner.split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
          : [];
        continue;
      }

      val = val.replace(/^['"]|['"]$/g, '');
      metadata[key] = val;
    }
  }

  if (!metadata.title) {
    metadata.title = '未命名草稿';
  }

  return { metadata, rawFrontmatter, body };
}

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

export function combineDocument(meta: DocumentMetadata, body: string): string {
  const fm = serializeFrontmatter(meta);
  return `${fm}\n\n${body.trim()}\n`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-');
}

function transformAcademicCards(html: string): string {

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

  const tagPattern = /<([A-Z][a-zA-Z0-9]*)\b([^>]*)>([\s\S]*?)<\/\1>/g;
  transformed = transformed.replace(tagPattern, (_match, tagName, attrsStr, content) => {
    const key = tagName.toLowerCase();
    const config = cardConfigs[key];
    if (!config) {

      return _match;
    }

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

export function renderMarkdown(markdownBody: string): { html: string; headings: ParsedHeadingItem[] } {
  if (!markdownBody || !markdownBody.trim()) {
    return {
      html: '<div class="blank-doc-empty-hint">暂无内容，请在左侧编辑器中输入 Markdown 内容或载入模板。</div>',
      headings: [],
    };
  }

  const mermaidPlaceholders: Array<{ placeholder: string; replacement: string }> = [];
  let processed = markdownBody.replace(/```mermaid\r?\n([\s\S]*?)```/g, (_m, code) => {
    const p = `@@MERMAID_PLACEHOLDER_${mermaidPlaceholders.length}@@`;
    const cleanCode = code.trim();
    const encoded = encodeURIComponent(cleanCode);
    const replacement = `<div class="mermaid-container" data-mermaid-code="${encoded}" data-feature="mermaid"><div class="mermaid-render"><pre class="mermaid">${cleanCode}</pre></div></div>`;
    mermaidPlaceholders.push({ placeholder: p, replacement });
    return p;
  });

  const mathPlaceholders: Array<{ placeholder: string; replacement: string }> = [];

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

  let rawHtml = marked.parse(processed) as string;

  for (const item of mermaidPlaceholders) {
    rawHtml = rawHtml.replace(item.placeholder, item.replacement);
  }

  for (const item of mathPlaceholders) {
    rawHtml = rawHtml.replace(item.placeholder, item.replacement);
  }

  let finalHtml = transformAcademicCards(rawHtml);

  const headings: ParsedHeadingItem[] = [];
  const headingRegex = /<h([1-4])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;

  finalHtml = finalHtml.replace(headingRegex, (_match, levelStr, attrsStr, innerHtml) => {
    const level = parseInt(levelStr, 10);

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
