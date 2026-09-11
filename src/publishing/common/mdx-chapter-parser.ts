import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import * as remarkMdx from 'remark-mdx';
import type {
  ChapterDocument,
  SemanticBlock,
  SemanticBlockKind,
  ChapterImageItem,
  SemanticTableData,
  SemanticFigureData,
  SemanticListData,
  DigitalResourceItem,
} from '../../types/chapter-semantic';
import { resolveChapterCanonicalMetadata } from '../../core/catalog/chapter-metadata.ts';

const mdxPlugin = (remarkMdx as any).remarkMdx ?? (remarkMdx as any).default ?? remarkMdx;

export function extractFrontmatter(source: string): { frontmatter: Record<string, string>; body: string } {
  const clean = source.replace(/^\uFEFF/, '');
  const match = clean.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { frontmatter: {}, body: clean };
  }

  const fmText = match[1];
  const body = clean.slice(match[0].length);
  const frontmatter: Record<string, string> = {};

  const lines = fmText.split(/\r?\n/);
  for (const line of lines) {
    const kv = line.match(/^([a-zA-Z0-9_\-]+)\s*:\s*(.*)$/);
    if (kv) {
      const key = kv[1].trim();
      let val = kv[2].trim();

      val = val.replace(/^['"]|['"]$/g, '');
      frontmatter[key] = val;
    }
  }

  return { frontmatter, body };
}

function getJsxAttr(node: any, name: string): string | undefined {
  if (!node || !node.attributes) return undefined;
  for (const attr of node.attributes) {
    if (attr.type === 'mdxJsxAttribute' && attr.name === name) {
      if (typeof attr.value === 'string') return attr.value;
      if (attr.value && typeof attr.value === 'object') {
        if (attr.value.type === 'mdxJsxAttributeValueExpression') {
          return String(attr.value.value ?? '').replace(/^['"]|['"]$/g, '');
        }
      }
      return String(attr.value ?? '');
    }
  }
  return undefined;
}

function serializeInlineNodes(nodes: any[]): string {
  if (!nodes || nodes.length === 0) return '';
  let result = '';

  for (const n of nodes) {
    if (!n) continue;
    switch (n.type) {
      case 'text':
        result += n.value;
        break;
      case 'inlineMath':
        result += `$${n.value}$`;
        break;
      case 'math':
        result += `\n$$\n${n.value}\n$$\n`;
        break;
      case 'strong':
        result += `**${serializeInlineNodes(n.children)}**`;
        break;
      case 'emphasis':
        result += `*${serializeInlineNodes(n.children)}*`;
        break;
      case 'inlineCode':
        result += `\`${n.value}\``;
        break;
      case 'delete':
        result += `~~${serializeInlineNodes(n.children)}~~`;
        break;
      case 'link':
        result += `[${serializeInlineNodes(n.children)}](${n.url || ''})`;
        break;
      case 'image':
        result += `![${n.alt || ''}](${n.url || ''})`;
        break;
      case 'html':
        result += n.value;
        break;
      case 'mdxJsxTextElement':
      case 'mdxJsxFlowElement':
        result += serializeInlineNodes(n.children || []);
        break;
      default:
        if (n.children) {
          result += serializeInlineNodes(n.children);
        } else if (n.value) {
          result += n.value;
        }
    }
  }

  return result;
}

function classifyKnowledgeSemantic(title: string): { kind: SemanticBlockKind; coreTitle: string; number?: string } {
  const clean = (title || '').trim().replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}\u{27BF}\uFE0F]/gu, '').trim();

  let m = clean.match(/^(定理)\s*([0-9\.\-－]*)\s*(.*)$/);
  if (m) {
    return { kind: 'theorem', coreTitle: m[3] || m[1], number: m[2] };
  }

  m = clean.match(/^(定义)\s*([0-9\.\-－]*)\s*(.*)$/);
  if (m) {
    return { kind: 'definition', coreTitle: m[3] || m[1], number: m[2] };
  }

  m = clean.match(/^(引理)\s*([0-9\.\-－]*)\s*(.*)$/);
  if (m) {
    return { kind: 'lemma', coreTitle: m[3] || m[1], number: m[2] };
  }

  m = clean.match(/^(推论)\s*([0-9\.\-－]*)\s*(.*)$/);
  if (m) {
    return { kind: 'corollary', coreTitle: m[3] || m[1], number: m[2] };
  }

  m = clean.match(/^(命题)\s*([0-9\.\-－]*)\s*(.*)$/);
  if (m) {
    return { kind: 'proposition', coreTitle: m[3] || m[1], number: m[2] };
  }

  m = clean.match(/^(公理)\s*([0-9\.\-－]*)\s*(.*)$/);
  if (m) {
    return { kind: 'axiom', coreTitle: m[3] || m[1], number: m[2] };
  }

  m = clean.match(/^(性质)\s*([0-9\.\-－]*)\s*(.*)$/);
  if (m) {
    return { kind: 'property', coreTitle: m[3] || m[1], number: m[2] };
  }

  m = clean.match(/^(准则)\s*([0-9a-zA-Z\.\-－ⅠⅡⅢⅣⅤⅥ]*)\s*(.*)$/);
  if (m) {
    return { kind: 'criterion', coreTitle: m[3] || m[1], number: m[2] };
  }

  return { kind: 'academicblock', coreTitle: clean };
}

function extractTableDataFromJsx(tableNode: any): SemanticTableData | null {
  const rows: string[][] = [];
  let caption = '';
  function collectRows(parent: any) {
    if (!parent || !parent.children) return;
    for (const child of parent.children) {
      if (child.name === 'caption') {
        caption = serializeInlineNodes(child.children || []).trim();
      } else if (child.name === 'tr') {
        const cells: string[] = [];
        for (const c of child.children || []) {
          if (c.name === 'td' || c.name === 'th') {
            cells.push(serializeInlineNodes(c.children || []).trim());
          }
        }
        if (cells.length > 0) {
          rows.push(cells);
        }
      } else if (child.name === 'thead' || child.name === 'tbody' || child.name === 'tfoot') {
        collectRows(child);
      }
    }
  }

  collectRows(tableNode);
  if (rows.length === 0) return null;

  const headers = rows[0];
  const dataRows = rows.slice(1);
  return {
    headers,
    aligns: headers.map(() => 'center'),
    rows: dataRows,
    caption: caption || undefined,
  };
}

function parseHtmlTable(html: string): SemanticTableData | null {
  const capMatch = html.match(/<caption[^>]*>([\s\S]*?)<\/caption>/i);
  const caption = capMatch ? capMatch[1].replace(/<[^>]+>/g, '').trim() : undefined;

  const trMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
  if (!trMatches || trMatches.length === 0) return null;

  const rows: string[][] = [];
  for (const tr of trMatches) {
    const cellMatches = tr.match(/<(td|th)[^>]*>([\s\S]*?)<\/\1>/gi);
    if (!cellMatches) continue;
    const cells = cellMatches.map((cell) => {
      return cell.replace(/^<(td|th)[^>]*>/i, '').replace(/<\/(td|th)>$/i, '').trim();
    });
    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  if (rows.length === 0) return null;
  return {
    headers: rows[0],
    aligns: rows[0].map(() => 'center'),
    rows: rows.slice(1),
    caption,
  };
}

function parseAstNodes(
  nodes: any[],
  imageCollector: ChapterImageItem[],
  parentContext?: { kind: SemanticBlockKind; id?: string; title?: string }
): SemanticBlock[] {
  const blocks: SemanticBlock[] = [];

  for (const node of nodes) {
    if (!node) continue;

    switch (node.type) {
      case 'heading': {
        const text = serializeInlineNodes(node.children).trim();
        blocks.push({
          kind: 'heading',
          level: node.depth,
          title: text,
          content: text,
        });
        break;
      }

      case 'paragraph': {

        const hasTableChild = (node.children || []).some((c: any) => c.name === 'table');
        if (hasTableChild) {
          let textAcc: any[] = [];
          for (const child of node.children) {
            if (child.name === 'table') {
              if (textAcc.length > 0) {
                const text = serializeInlineNodes(textAcc).trim();
                if (text) {
                  blocks.push({ kind: 'paragraph', content: text });
                }
                textAcc = [];
              }
              const tblData = extractTableDataFromJsx(child);
              if (tblData) {
                blocks.push({ kind: 'table', tableData: tblData });
              }
            } else {
              textAcc.push(child);
            }
          }
          if (textAcc.length > 0) {
            const text = serializeInlineNodes(textAcc).trim();
            if (text) {
              blocks.push({ kind: 'paragraph', content: text });
            }
          }
          break;
        }

        const isSingleImage =
          node.children.length === 1 && node.children[0].type === 'image';

        if (isSingleImage) {
          const img = node.children[0];
          const imgUrl = img.url || '';
          imageCollector.push({ alt: img.alt || '', url: imgUrl, originalPath: imgUrl });
          blocks.push({
            kind: 'figure',
            figureData: {
              url: imgUrl,
              alt: img.alt || '',
            },
          });
        } else {

          for (const c of node.children) {
            if (c.type === 'image') {
              imageCollector.push({ alt: c.alt || '', url: c.url || '', originalPath: c.url || '' });
            }
          }
          const text = serializeInlineNodes(node.children).trim();
          if (text) {
            blocks.push({
              kind: 'paragraph',
              content: text,
            });
          }
        }
        break;
      }

      case 'math': {
        blocks.push({
          kind: 'math',
          content: node.value.trim(),
        });
        break;
      }

      case 'code': {
        blocks.push({
          kind: 'code',
          content: node.value,
          meta: { lang: node.lang || '' },
        });
        break;
      }

      case 'blockquote': {
        const innerBlocks = parseAstNodes(node.children, imageCollector);
        blocks.push({
          kind: 'quote',
          children: innerBlocks,
        });
        break;
      }

      case 'list': {
        const listData: SemanticListData = {
          ordered: !!node.ordered,
          start: node.start || 1,
          items: [],
        };
        for (const item of node.children || []) {
          const itemBlocks = parseAstNodes(item.children || [], imageCollector);
          listData.items.push(itemBlocks);
        }
        blocks.push({
          kind: 'list',
          listData,
        });
        break;
      }

      case 'table': {
        const tableData: SemanticTableData = {
          headers: [],
          aligns: node.align || [],
          rows: [],
        };
        const rows = node.children || [];
        if (rows.length > 0) {
          const headRow = rows[0];
          tableData.headers = (headRow.children || []).map((cell: any) => serializeInlineNodes(cell.children).trim());
          for (let i = 1; i < rows.length; i++) {
            const rowCells = (rows[i].children || []).map((cell: any) => serializeInlineNodes(cell.children).trim());
            tableData.rows.push(rowCells);
          }
        }
        blocks.push({
          kind: 'table',
          tableData,
        });
        break;
      }

      case 'thematicBreak': {

        break;
      }

      case 'html': {
        if (node.value && /<table[\s>]/i.test(node.value)) {
          const tblData = parseHtmlTable(node.value);
          if (tblData) {
            blocks.push({ kind: 'table', tableData: tblData });
            break;
          }
        }
        break;
      }

      case 'mdxJsxFlowElement':
      case 'mdxJsxTextElement': {
        const name = node.name;
        const titleAttr = getJsxAttr(node, 'title') || '';
        const idAttr = getJsxAttr(node, 'id') || '';
        const urlAttr = getJsxAttr(node, 'url') || '';

        if (name === 'table') {
          const tblData = extractTableDataFromJsx(node);
          if (tblData) {
            blocks.push({ kind: 'table', tableData: tblData });
            break;
          }
        }

        if (name === 'Knowledge') {
          const info = classifyKnowledgeSemantic(titleAttr);
          const childBlocks = parseAstNodes(node.children || [], imageCollector, {
            kind: info.kind,
            id: info.number || idAttr,
            title: titleAttr,
          });
          blocks.push({
            kind: info.kind,
            title: titleAttr,
            number: info.number,
            label: idAttr,
            children: childBlocks,
          });
        }

        else if (name === 'Example') {
          const childBlocks = parseAstNodes(node.children || [], imageCollector, {
            kind: 'example',
            id: idAttr || titleAttr,
            title: titleAttr,
          });
          blocks.push({
            kind: 'example',
            title: titleAttr,
            label: idAttr,
            children: childBlocks,
          });
        }

        else if (name === 'Variant') {
          const childBlocks = parseAstNodes(node.children || [], imageCollector, {
            kind: 'variant',
            id: idAttr || titleAttr,
            title: titleAttr,
          });
          blocks.push({
            kind: 'variant',
            title: titleAttr,
            label: idAttr,
            children: childBlocks,
          });
        }

        else if (name === 'Solution') {
          const isProof = /证明|证/i.test(titleAttr);
          const childBlocks = parseAstNodes(node.children || [], imageCollector, {
            kind: isProof ? 'proof' : 'solution',
            id: titleAttr,
            title: titleAttr,
          });
          blocks.push({
            kind: isProof ? 'proof' : 'solution',
            title: titleAttr,
            children: childBlocks,
          });
        }

        else if (name === 'Note') {
          const childBlocks = parseAstNodes(node.children || [], imageCollector, {
            kind: 'remark',
            id: titleAttr,
            title: titleAttr,
          });
          blocks.push({
            kind: 'remark',
            title: titleAttr,
            children: childBlocks,
          });
        }

        else if (name === 'Analysis') {
          const childBlocks = parseAstNodes(node.children || [], imageCollector, {
            kind: 'analysis',
            id: titleAttr,
            title: titleAttr || '思路分析',
          });
          blocks.push({
            kind: 'analysis',
            title: titleAttr || '思路分析',
            children: childBlocks,
          });
        }

        else if (name === 'Method') {
          const childBlocks = parseAstNodes(node.children || [], imageCollector, {
            kind: 'method',
            id: titleAttr,
            title: titleAttr,
          });
          blocks.push({
            kind: 'method',
            title: titleAttr,
            children: childBlocks,
          });
        }

        else if (name === 'Block') {
          const childBlocks = parseAstNodes(node.children || [], imageCollector, {
            kind: 'academicblock',
            id: titleAttr,
            title: titleAttr,
          });
          blocks.push({
            kind: 'academicblock',
            title: titleAttr,
            children: childBlocks,
          });
        }

        else if (name === 'Exercise') {
          const childBlocks = parseAstNodes(node.children || [], imageCollector, {
            kind: 'exercise',
            id: titleAttr,
            title: titleAttr,
          });
          blocks.push({
            kind: 'exercise',
            title: titleAttr,
            children: childBlocks,
          });
        }

        else if (name === 'Guide') {
          const childBlocks = parseAstNodes(node.children || [], imageCollector, {
            kind: 'guide',
            id: titleAttr,
            title: titleAttr || '本节导读',
          });
          blocks.push({
            kind: 'guide',
            title: titleAttr || '本节导读',
            children: childBlocks,
          });
        }

        else if (name === 'Summary') {
          const childBlocks = parseAstNodes(node.children || [], imageCollector, {
            kind: 'summary',
            id: titleAttr,
            title: titleAttr || '总结',
          });
          blocks.push({
            kind: 'summary',
            title: titleAttr || '总结',
            children: childBlocks,
          });
        }

        else if (name === 'QRCodeVideo' || name === 'DigitalResource') {

          const cleanTitle = titleAttr
            .replace(/^二维码\s*[\d\.\-－]*\s*/, '')
            .replace(/[\.\。\s]+$/, '')
            .trim() || '配套数字资源';

          let categoryLabel = '配套数字资源';
          if (/课件|讲义|PPT|演示文稿/i.test(cleanTitle)) {
            categoryLabel = '教学课件';
          } else if (/视频|微课|讲解|录像/i.test(cleanTitle)) {
            categoryLabel = '微课视频';
          } else if (/动画|演示|仿真|几何画板|GeoGebra/i.test(cleanTitle)) {
            categoryLabel = '动态演示';
          }

          const isEmbedded = !!parentContext;
          const hostKind = parentContext?.kind;
          const hostId = parentContext?.id || parentContext?.title;

          const resourceData: DigitalResourceItem = {
            id: idAttr || undefined,
            title: cleanTitle,
            url: urlAttr ? urlAttr.trim() : '',
            category: 'digital_resource',
            categoryLabel,
            relation: isEmbedded ? 'embedded' : 'flow',
            hostKind,
            hostId,
          };

          blocks.push({
            kind: 'digital_resource',
            title: cleanTitle,
            content: urlAttr ? urlAttr.trim() : '',
            meta: { id: idAttr, url: urlAttr },
            resourceData,
          });
        }

        else if (name === 'figure') {
          let figImg: string | undefined;
          let figAlt = '';
          let figCap = '';
          for (const c of node.children || []) {
            if (c.type === 'paragraph') {
              for (const p of c.children || []) {
                if (p.type === 'image') {
                  figImg = p.url;
                  figAlt = p.alt || '';
                  imageCollector.push({ alt: figAlt, url: figImg, originalPath: figImg });
                }
              }
            } else if (c.name === 'figcaption') {
              figCap = serializeInlineNodes(c.children || []).trim();
            }
          }
          if (figImg) {
            blocks.push({
              kind: 'figure',
              figureData: {
                url: figImg,
                alt: figAlt,
                caption: figCap,
              },
            });
          }
        }

        else {
          const childBlocks = parseAstNodes(node.children || [], imageCollector, parentContext);
          blocks.push(...childBlocks);
        }
        break;
      }

      default:
        if (node.children) {
          blocks.push(...parseAstNodes(node.children, imageCollector, parentContext));
        }
    }
  }

  return blocks;
}

export function parseMdxChapter(
  mdxSource: string,
  options: { slug?: string; bookSlug?: string; colSlug?: string; bookTitle?: string; courseName?: string } = {}
): ChapterDocument {
  const { frontmatter, body } = extractFrontmatter(mdxSource);
  const rawTitle = frontmatter.title || options.slug || '章节文档';

  const metadata = resolveChapterCanonicalMetadata({
    slug: options.slug || 'chapter',
    bookSlug: options.bookSlug,
    colSlug: options.colSlug,
    bookTitle: options.bookTitle,
    rawTitle,
  });

  const title = metadata.fullTitle || rawTitle;
  const cleanTitle = metadata.sectionTitle || rawTitle.replace(/^[\d\.\s_-]+/, '').trim() || rawTitle;

  const processor = unified().use(remarkParse).use(mdxPlugin).use(remarkMath);
  const ast = processor.parse(body);

  const images: ChapterImageItem[] = [];
  const blocks = parseAstNodes(ast.children, images);

  return {
    title,
    cleanTitle,
    slug: options.slug || 'chapter',
    bookTitle: metadata.bookTitle || options.bookTitle,
    bookSlug: options.bookSlug,
    colSlug: options.colSlug,
    author: frontmatter.author || metadata.bookAuthor,
    courseName: options.courseName,
    metadata,
    blocks,
    images,
    rawMdx: mdxSource,
  };
}
