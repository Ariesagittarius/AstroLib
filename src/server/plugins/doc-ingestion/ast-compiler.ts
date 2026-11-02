/**
 * src/server/plugins/doc-ingestion/ast-compiler.ts
 * ============================================================================
 * AstroLib MinerU 结构化 AST 编译器
 * 将 MinerU content_list_v2.json / layout.json / full.md 编译为统一高质量 LayoutBlock
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import katex from 'katex';
import type { LayoutBlock } from './types.ts';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 将 LaTeX 数学公式安全渲染为 KaTeX HTML
 */
function renderMath(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex.trim(), {
      displayMode,
      throwOnError: false,
    });
  } catch {
    return displayMode ? `$$\n${tex}\n$$` : `$${tex}$`;
  }
}

/**
 * 核心导出函数：将解压目录编译为结构化 LayoutBlock 集合
 */
export function compileIngestAST(targetDir: string, taskId: string): LayoutBlock[] {
  // 1. 优先尝试 MinerU 原生 content_list_v2.json 或 content_list.json
  const listFiles = fs.readdirSync(targetDir).filter((f) => f.includes('content_list') && f.endsWith('.json'));
  if (listFiles.length > 0) {
    // 优先 v2
    const file = listFiles.find((f) => f.includes('v2')) || listFiles[0];
    try {
      const data = JSON.parse(fs.readFileSync(path.join(targetDir, file), 'utf-8'));
      if (Array.isArray(data) && data.length > 0) {
        return compileFromContentList(data, taskId);
      }
    } catch {
      // fallback
    }
  }

  // 2. 次选 layout.json
  const layoutPath = path.join(targetDir, 'layout.json');
  if (fs.existsSync(layoutPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(layoutPath, 'utf-8'));
      if (raw.pdf_info && Array.isArray(raw.pdf_info)) {
        return compileFromLayoutJson(raw.pdf_info, taskId);
      }
    } catch {
      // fallback
    }
  }

  // 3. 后备：纯 Markdown (如 Agent 轻量接口)
  const mdFiles = fs.readdirSync(targetDir).filter((f) => f.endsWith('.md'));
  if (mdFiles.length > 0) {
    try {
      const mdContent = fs.readFileSync(path.join(targetDir, mdFiles[0]), 'utf-8');
      return compileFromMarkdown(mdContent, taskId);
    } catch {
      // ignore
    }
  }

  return [];
}

/**
 * 编译器 1：基于 MinerU content_list_v2.json 进行高保真 AST 编译
 * 该文件中的 bbox 坐标均为归一化 1000 分制 [x0, y0, x1, y1] (0 - 1000)
 */
function compileFromContentList(pages: any[], taskId: string): LayoutBlock[] {
  const blocks: LayoutBlock[] = [];

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const pageItems = pages[pageIdx];
    if (!Array.isArray(pageItems)) continue;

    for (let itemIdx = 0; itemIdx < pageItems.length; itemIdx++) {
      const item = pageItems[itemIdx];
      const rawType = item.type || 'paragraph';
      const bbox: [number, number, number, number] = Array.isArray(item.bbox) && item.bbox.length === 4
        ? [item.bbox[0], item.bbox[1], item.bbox[2], item.bbox[3]]
        : [0, 0, 1000, 1000];

      const blockId = `blk_p${pageIdx}_${itemIdx}`;
      let blockType: LayoutBlock['type'] = 'text';
      let html = '';
      let text = '';
      let caption: string | undefined = undefined;
      let level: number | undefined = undefined;

      if (rawType === 'title') {
        blockType = 'title';
        level = Math.min(6, Math.max(1, item.content?.level || 1));
        const spans = item.content?.title_content || [];
        let innerHtml = '';
        for (const s of spans) {
          if (s.type === 'equation_inline') {
            innerHtml += renderMath(s.content, false);
            text += `$${s.content}$`;
          } else {
            innerHtml += escapeHtml(s.content || '');
            text += s.content || '';
          }
        }
        html = `<h${level} class="doc-heading doc-heading-${level}">${innerHtml}</h${level}>`;
      } else if (rawType === 'paragraph') {
        blockType = 'text';
        const spans = item.content?.paragraph_content || [];
        let innerHtml = '';
        for (const s of spans) {
          if (s.type === 'equation_inline') {
            innerHtml += renderMath(s.content, false);
            text += `$${s.content}$`;
          } else if (s.type === 'equation_interline') {
            innerHtml += `<div class="doc-equation-display">${renderMath(s.content, true)}</div>`;
            text += `\n$$\n${s.content}\n$$\n`;
          } else {
            innerHtml += escapeHtml(s.content || '');
            text += s.content || '';
          }
        }
        html = `<p class="doc-paragraph">${innerHtml}</p>`;
      } else if (rawType === 'equation_interline' || rawType === 'equation') {
        blockType = 'equation';
        const math = item.content?.math_content || item.content || '';
        text = `$$\n${math}\n$$`;
        html = `<div class="doc-equation-display">${renderMath(math, true)}</div>`;
      } else if (rawType === 'image' || rawType === 'chart') {
        blockType = 'image';
        const imgPath = item.content?.image_source?.path || '';
        const imgName = path.basename(imgPath);
        caption = (item.content?.image_caption || []).map((c: any) => c.content || '').join('');
        text = `![${caption || '插图'}](/api/ingest/image?taskId=${encodeURIComponent(taskId)}&name=${encodeURIComponent(imgName)})`;
        const imgSrc = `/api/ingest/image?taskId=${encodeURIComponent(taskId)}&name=${encodeURIComponent(imgName)}`;
        html = `<figure class="doc-figure"><img src="${imgSrc}" alt="${escapeHtml(caption || '插图')}" loading="lazy" />${caption ? `<figcaption class="doc-figcaption">${escapeHtml(caption)}</figcaption>` : ''}</figure>`;
      } else if (rawType === 'table') {
        blockType = 'table';
        const tableHtml = item.content?.html || '';
        caption = (item.content?.table_caption || []).map((c: any) => c.content || '').join('');
        text = caption ? `${caption}\n${tableHtml}` : tableHtml;
        html = `<div class="doc-table-wrapper">${tableHtml}${caption ? `<div class="doc-table-caption">${escapeHtml(caption)}</div>` : ''}</div>`;
      } else if (rawType === 'list') {
        blockType = 'list';
        const listItems = item.content?.list_items || [];
        const itemsHtml = listItems.map((li: any) => {
          const txt = (li.item_content || []).map((c: any) => c.content || '').join('');
          text += `* ${txt}\n`;
          return `<li>${escapeHtml(txt)}</li>`;
        }).join('');
        html = `<ul class="doc-list">${itemsHtml}</ul>`;
      } else if (rawType === 'page_header') {
        blockType = 'header';
        text = (item.content?.page_header_content || []).map((c: any) => c.content || '').join('');
        html = `<header class="doc-meta-header">${escapeHtml(text)}</header>`;
      } else if (rawType === 'page_footnote') {
        blockType = 'footer';
        let fnHtml = '';
        for (const s of (item.content?.page_footnote_content || [])) {
          if (s.type === 'equation_inline') {
            fnHtml += renderMath(s.content, false);
            text += `$${s.content}$`;
          } else {
            fnHtml += escapeHtml(s.content || '');
            text += s.content || '';
          }
        }
        html = `<div class="doc-meta-footnote">${fnHtml}</div>`;
      } else if (rawType === 'page_aside_text') {
        blockType = 'aside';
        text = (item.content?.page_aside_text_content || []).map((c: any) => c.content || '').join('');
        html = `<aside class="doc-meta-aside">${escapeHtml(text)}</aside>`;
      } else if (rawType === 'page_number') {
        // 页码仅在左侧 PDF 保留选框，右侧正文流不渲染独立段落
        blockType = 'footer';
        text = (item.content?.page_number_content || []).map((c: any) => c.content || '').join('');
        html = '';
      }

      blocks.push({
        id: blockId,
        type: blockType,
        pageIndex: pageIdx,
        bbox,
        pageWidth: 1000,
        pageHeight: 1000,
        html,
        text: text.trim(),
        caption,
        level,
      });
    }
  }

  return blocks;
}

/**
 * 编译器 2：从 layout.json 的 pdf_info 编译回退
 */
function compileFromLayoutJson(pdfInfo: any[], taskId: string): LayoutBlock[] {
  const blocks: LayoutBlock[] = [];

  for (let pageIdx = 0; pageIdx < pdfInfo.length; pageIdx++) {
    const page = pdfInfo[pageIdx];
    const [pageWidth, pageHeight] = Array.isArray(page.page_size) && page.page_size.length === 2
      ? page.page_size
      : [612, 792];

    const paraBlocks = page.para_blocks || [];
    for (let i = 0; i < paraBlocks.length; i++) {
      const pb = paraBlocks[i];
      if (!pb.bbox || !Array.isArray(pb.bbox) || pb.bbox.length !== 4) continue;

      const lines = pb.lines || pb.blocks?.flatMap((b: any) => b.lines || []) || [];
      let innerHtml = '';
      let text = '';
      const rawType = (pb.type || 'text') as string;
      let blockType: LayoutBlock['type'] = 'text';

      for (const line of lines) {
        for (const span of (line.spans || [])) {
          if (span.type === 'image') {
            blockType = 'image';
            const imgName = span.image_path || `img_${pageIdx}_${i}.png`;
            const imgSrc = `/api/ingest/image?taskId=${encodeURIComponent(taskId)}&name=${encodeURIComponent(imgName)}`;
            innerHtml += `<figure class="doc-figure"><img src="${imgSrc}" alt="切片插图" loading="lazy" /></figure>`;
            text += `![插图](${imgSrc})\n`;
          } else if (span.type === 'table') {
            blockType = 'table';
            innerHtml += `<div class="doc-table-wrapper">${span.html || ''}</div>`;
            text += span.html || '';
          } else if (span.type === 'inline_equation') {
            innerHtml += renderMath(span.content || '', false);
            text += `$${span.content}$`;
          } else if (span.type === 'interline_equation') {
            blockType = 'equation';
            innerHtml += `<div class="doc-equation-display">${renderMath(span.content || '', true)}</div>`;
            text += `\n$$\n${span.content}\n$$\n`;
          } else {
            innerHtml += escapeHtml(span.content || '');
            text += span.content || '';
          }
        }
      }

      let html = innerHtml;
      if (rawType === 'title') {
        blockType = 'title';
        const lvl = Math.min(6, Math.max(1, pb.level || 1));
        html = `<h${lvl} class="doc-heading doc-heading-${lvl}">${innerHtml}</h${lvl}>`;
      } else if (blockType === 'text') {
        html = `<p class="doc-paragraph">${innerHtml}</p>`;
      }

      // 将 layout.json 的 pt 坐标归一化为 1000 分制
      const normBbox: [number, number, number, number] = [
        Math.round((pb.bbox[0] / pageWidth) * 1000),
        Math.round((pb.bbox[1] / pageHeight) * 1000),
        Math.round((pb.bbox[2] / pageWidth) * 1000),
        Math.round((pb.bbox[3] / pageHeight) * 1000),
      ];

      blocks.push({
        id: `blk_p${pageIdx}_${i}`,
        type: blockType,
        pageIndex: pageIdx,
        bbox: normBbox,
        pageWidth: 1000,
        pageHeight: 1000,
        html,
        text: text.trim(),
      });
    }
  }

  return blocks;
}

/**
 * 编译器 3：从纯 Markdown 编译回退 (Agent 免密接口)
 */
function compileFromMarkdown(mdContent: string, taskId: string): LayoutBlock[] {
  const blocks: LayoutBlock[] = [];
  const sections = mdContent.split(/\n\n+/);

  sections.forEach((sec, idx) => {
    const trimmed = sec.trim();
    if (!trimmed) return;

    let blockType: LayoutBlock['type'] = 'text';
    let html = '';

    if (/^#{1,6}\s/.test(trimmed)) {
      blockType = 'title';
      const m = trimmed.match(/^(#{1,6})\s+(.*)$/);
      const lvl = m ? m[1].length : 2;
      const titleText = m ? m[2] : trimmed;
      html = `<h${lvl} class="doc-heading doc-heading-${lvl}">${escapeHtml(titleText)}</h${lvl}>`;
    } else if (/^\$\$[\s\S]+\$\$$/.test(trimmed)) {
      blockType = 'equation';
      const math = trimmed.replace(/^\$\$|\$\$$/g, '');
      html = `<div class="doc-equation-display">${renderMath(math, true)}</div>`;
    } else if (/^!\[.*?\]\(.*?\)$/.test(trimmed)) {
      blockType = 'image';
      const m = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      const alt = m ? m[1] : '';
      const src = m ? m[2] : '';
      const imgName = path.basename(src);
      const imgSrc = `/api/ingest/image?taskId=${encodeURIComponent(taskId)}&name=${encodeURIComponent(imgName)}`;
      html = `<figure class="doc-figure"><img src="${imgSrc}" alt="${escapeHtml(alt)}" loading="lazy" />${alt ? `<figcaption class="doc-figcaption">${escapeHtml(alt)}</figcaption>` : ''}</figure>`;
    } else if (/^\|.*\|\n\|.*\|/.test(trimmed)) {
      blockType = 'table';
      html = `<div class="doc-table-wrapper"><pre>${escapeHtml(trimmed)}</pre></div>`;
    } else {
      // 普通段落，解析行内公式
      let pText = trimmed.replace(/\$([^\$\n]+?)\$/g, (_, eq) => renderMath(eq, false));
      html = `<p class="doc-paragraph">${pText}</p>`;
    }

    blocks.push({
      id: `blk_syn_${idx}`,
      type: blockType,
      pageIndex: 0,
      bbox: [0, 0, 1000, 1000],
      pageWidth: 1000,
      pageHeight: 1000,
      html,
      text: trimmed,
    });
  });

  return blocks;
}
