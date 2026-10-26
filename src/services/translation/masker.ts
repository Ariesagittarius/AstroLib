import type { MaskedToken, MaskResult, MaskTokenType } from './types.ts';

const TOKEN_PREFIX = '⟦ASTRO_TOK_';
const TOKEN_SUFFIX = '⟧';

const FRONTMATTER_REGEX = /^---[\r\n]+[\s\S]*?[\r\n]+---(?:\r?\n)?/;

const IMPORT_REGEX = /^(?:import\s+[\s\S]*?from\s+['"][^'"]+['"];?|import\s+['"][^'"]+['"];?)\s*$/gm;

const MATH_BLOCK_REGEX = /\$\$[\s\S]*?\$\$/g;

const MATH_INLINE_REGEX = /(?<!\\)\$(?!\$)([^\$\r\n]+?)(?<!\\)\$/g;

const CODE_BLOCK_REGEX = /```[\s\S]*?```/g;

const CODE_INLINE_REGEX = /`[^`\r\n]+`/g;

const JSX_COMPONENT_REGEX = /<\/?[A-Z][a-zA-Z0-9]*(?:\s+[^>]*?)?\/?>/g;

const MD_LINK_URL_REGEX = /(?<=\[[^\]]+\]\()https?:\/\/[^\s\)]+(?=\))/g;

const MD_IMAGE_REGEX = /!\[[^\]]*\]\([^\)]+\)/g;

export class StructurePreservingMasker {

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

    processed = processed.replace(FRONTMATTER_REGEX, (match) => {
      return createToken(match, 'frontmatter');
    });

    processed = processed.replace(IMPORT_REGEX, (match) => {
      return createToken(match, 'import');
    });

    processed = processed.replace(MD_IMAGE_REGEX, (match) => {
      return createToken(match, 'markdown-image');
    });

    processed = processed.replace(MATH_BLOCK_REGEX, (match) => {
      return createToken(match, 'math-block');
    });

    processed = processed.replace(CODE_BLOCK_REGEX, (match) => {
      return createToken(match, 'code-block');
    });

    processed = processed.replace(MATH_INLINE_REGEX, (match) => {
      return createToken(match, 'math-inline');
    });

    processed = processed.replace(CODE_INLINE_REGEX, (match) => {
      return createToken(match, 'code-inline');
    });

    processed = processed.replace(JSX_COMPONENT_REGEX, (match) => {
      return createToken(match, 'jsx-tag');
    });

    processed = processed.replace(MD_LINK_URL_REGEX, (match) => {
      return createToken(match, 'markdown-link-target');
    });

    return {
      maskedText: processed,
      tokens,
    };
  }

  static unmask(translatedText: string, tokens: Map<string, MaskedToken>): { restoredText: string; restoredCount: number } {
    if (!translatedText) {
      return { restoredText: '', restoredCount: 0 };
    }

    let restoredCount = 0;

    const TOLERANT_RESTORE_REGEX = /<span[^>]*translate="no"[^>]*>\s*[⟦\[]\s*ASTRO_TOK_(\d+)\s*[⟧\]]\s*<\/span>|[⟦\[]\s*ASTRO_TOK_(\d+)\s*[⟧\]]/gi;

    let restored = translatedText.replace(TOLERANT_RESTORE_REGEX, (_match, p1, p2) => {
      const idxStr = p1 ?? p2;
      const key = `${TOKEN_PREFIX}${idxStr}${TOKEN_SUFFIX}`;
      const token = tokens.get(key);
      if (token) {
        restoredCount++;
        return token.original;
      }
      return _match;
    });

    restored = this.applyPanguSpacing(restored);

    return {
      restoredText: restored,
      restoredCount,
    };
  }

  private static applyPanguSpacing(text: string): string {

    let res = text.replace(/([\u4e00-\u9fa5])(\$[^\$\r\n]+\$)/g, '$1 $2');
    res = res.replace(/(\$[^\$\r\n]+\$)([\u4e00-\u9fa5])/g, '$1 $2');

    res = res.replace(/([\u4e00-\u9fa5])(`[^`\r\n]+`)/g, '$1 $2');
    res = res.replace(/(`[^`\r\n]+`)([\u4e00-\u9fa5])/g, '$1 $2');

    return res;
  }
}
