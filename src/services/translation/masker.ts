/**
 * src/services/translation/masker.ts
 * ============================================================================
 * AstroLib 结构保护遮蔽与还原引擎 (Structure-Preserving Masker & Restorer)
 * ============================================================================
 * 核心职责：
 * 1. 扫描 MDX/Markdown 源码中的公式、代码、算法、JSX 组件、Frontmatter 等结构；
 * 2. 将非文本或结构性语法元素替换为机器翻译引擎友好的抗混淆安全占位符；
 * 3. 译文返回后，通过容错宽容正则 100% 逐字原样还原结构；
 * 4. 自动修复中西文/公式排版呼吸间距，确保达到出版级学术排版质量。
 * ============================================================================
 */

import type { MaskedToken, MaskResult, MaskTokenType } from './types.ts';

/** 占位符前缀与标识 */
const TOKEN_PREFIX = '⟦ASTRO_TOK_';
const TOKEN_SUFFIX = '⟧';

/**
 * 正则表达式合集（遵循严格匹配优先级）
 */
// 1. Frontmatter (YAML 头)
const FRONTMATTER_REGEX = /^---[\r\n]+[\s\S]*?[\r\n]+---(?:\r?\n)?/;

// 2. MDX Import 声明
const IMPORT_REGEX = /^(?:import\s+[\s\S]*?from\s+['"][^'"]+['"];?|import\s+['"][^'"]+['"];?)\s*$/gm;

// 3. Display Math 块级公式 ($$...$$)
const MATH_BLOCK_REGEX = /\$\$[\s\S]*?\$\$/g;

// 4. Inline Math 行内公式 ($...$) - 排除转义 \$ 与空公式
const MATH_INLINE_REGEX = /(?<!\\)\$(?!\$)([^\$\r\n]+?)(?<!\\)\$/g;

// 5. Fenced Code Block 代码块 / 算法伪代码 (```...```)
const CODE_BLOCK_REGEX = /```[\s\S]*?```/g;

// 6. Inline Code 行内代码 (`...`)
const CODE_INLINE_REGEX = /`[^`\r\n]+`/g;

// 7. JSX / Astro 自定义组件标签 (如 <Knowledge title="..."> 或 </Knowledge>)
const JSX_COMPONENT_REGEX = /<\/?[A-Z][a-zA-Z0-9]*(?:\s+[^>]*?)?\/?>/g;

// 8. Markdown 超链接 URL 目标保护: [text](https://...)
const MD_LINK_URL_REGEX = /(?<=\[[^\]]+\]\()https?:\/\/[^\s\)]+(?=\))/g;

// 9. Markdown 图片完整语法保护: ![alt](url)
const MD_IMAGE_REGEX = /!\[[^\]]*\]\([^\)]+\)/g;

export class StructurePreservingMasker {
  /**
   * 将含有公式与算法的 Markdown/MDX 文本进行结构遮蔽
   * @param source 原始文本
   * @param useHtmlWrap 是否使用 <span class="notranslate"> 包装占位符（适用于 Google Translate HTML 模式）
   */
  static mask(source: string, useHtmlWrap = false): MaskResult {
    if (!source || typeof source !== 'string') {
      return { maskedText: '', tokens: new Map() };
    }

    const tokens = new Map<string, MaskedToken>();
    let counter = 0;

    const createToken = (original: string, type: MaskTokenType): string => {
      const tokenId = `${TOKEN_PREFIX}${counter}${TOKEN_SUFFIX}`;
      tokens.set(tokenId, {
        id: tokenId,
        index: counter,
        type,
        original,
      });
      counter++;

      if (useHtmlWrap) {
        return `<span class="notranslate" translate="no">${tokenId}</span>`;
      }
      return tokenId;
    };

    let processed = source;

    // 步骤 1: 保护 Frontmatter
    processed = processed.replace(FRONTMATTER_REGEX, (match) => {
      return createToken(match, 'frontmatter');
    });

    // 步骤 2: 保护 import 语句
    processed = processed.replace(IMPORT_REGEX, (match) => {
      return createToken(match, 'import');
    });

    // 步骤 3: 保护 Markdown 图片
    processed = processed.replace(MD_IMAGE_REGEX, (match) => {
      return createToken(match, 'markdown-image');
    });

    // 步骤 4: 保护块级数学公式 ($$...$$) - 必须先于行内公式处理
    processed = processed.replace(MATH_BLOCK_REGEX, (match) => {
      return createToken(match, 'math-block');
    });

    // 步骤 5: 保护算法代码块 (```...```) - 必须先于行内代码处理
    processed = processed.replace(CODE_BLOCK_REGEX, (match) => {
      return createToken(match, 'code-block');
    });

    // 步骤 6: 保护行内数学公式 ($...$)
    processed = processed.replace(MATH_INLINE_REGEX, (match) => {
      return createToken(match, 'math-inline');
    });

    // 步骤 7: 保护行内代码 (`...`)
    processed = processed.replace(CODE_INLINE_REGEX, (match) => {
      return createToken(match, 'code-inline');
    });

    // 步骤 8: 保护 JSX / Astro 组件标签
    processed = processed.replace(JSX_COMPONENT_REGEX, (match) => {
      return createToken(match, 'jsx-tag');
    });

    // 步骤 9: 保护 Markdown 链接的目标 URL
    processed = processed.replace(MD_LINK_URL_REGEX, (match) => {
      return createToken(match, 'markdown-link-target');
    });

    return {
      maskedText: processed,
      tokens,
    };
  }

  /**
   * 将翻译后的文本中的占位符进行精准 1:1 还原
   * 包含对翻译引擎可能插入的空白字符、大小写变形的宽容容错
   * @param translatedText 含有占位符的译文
   * @param tokens 遮蔽时保存的 Token Map
   */
  static unmask(translatedText: string, tokens: Map<string, MaskedToken>): { restoredText: string; restoredCount: number } {
    if (!translatedText) {
      return { restoredText: '', restoredCount: 0 };
    }

    let restoredCount = 0;

    // 宽容容错正则表达式：
    // 支持匹配：
    // 1. <span class="notranslate" translate="no">⟦ASTRO_TOK_0⟧</span>
    // 2. ⟦ASTRO_TOK_0⟧
    // 3. ⟦ ASTRO_TOK_0 ⟧ (翻译引擎自动在括号内注入的空格)
    // 4. [ASTRO_TOK_0] 或 [ ASTRO_TOK_0 ] (部分引擎将特殊中括号降级为英文中括号)
    const TOLERANT_RESTORE_REGEX = /<span[^>]*translate="no"[^>]*>\s*[⟦\[]\s*ASTRO_TOK_(\d+)\s*[⟧\]]\s*<\/span>|[⟦\[]\s*ASTRO_TOK_(\d+)\s*[⟧\]]/gi;

    let restored = translatedText.replace(TOLERANT_RESTORE_REGEX, (_match, p1, p2) => {
      const idxStr = p1 ?? p2;
      const key = `${TOKEN_PREFIX}${idxStr}${TOKEN_SUFFIX}`;
      const token = tokens.get(key);
      if (token) {
        restoredCount++;
        return token.original;
      }
      return _match; // 未匹配到则保留原样（防御式编程）
    });

    // 步骤 10: 盘古中西文间距排版自愈 (在中文与内联公式/英文字符之间注入标准呼吸间距)
    restored = this.applyPanguSpacing(restored);

    return {
      restoredText: restored,
      restoredCount,
    };
  }

  /**
   * 盘古排版自愈：优化中文与行内公式/英文之间的间距
   */
  private static applyPanguSpacing(text: string): string {
    // 匹配汉字与行内公式之间的边界：汉字后接 $ 或 $ 后接汉字，确保有空格
    let res = text.replace(/([\u4e00-\u9fa5])(\$[^\$\r\n]+\$)/g, '$1 $2');
    res = res.replace(/(\$[^\$\r\n]+\$)([\u4e00-\u9fa5])/g, '$1 $2');

    // 匹配汉字与行内代码之间的边界
    res = res.replace(/([\u4e00-\u9fa5])(`[^`\r\n]+`)/g, '$1 $2');
    res = res.replace(/(`[^`\r\n]+`)([\u4e00-\u9fa5])/g, '$1 $2');

    return res;
  }
}
