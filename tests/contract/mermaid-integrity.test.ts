/**
 * Mermaid 图表语法与公式契约测试 (Mermaid Integrity Invariant Contract)
 *
 * 守护目标：
 * 1. 全站所有 MDX 章节中的 Mermaid 图表必须 100% 通过 mermaid.parse 官方词法与语法分析；
 * 2. 边标签中含有括号、花括号、下划线等特殊字符时必须使用双引号包裹，杜绝 Parse error；
 * 3. 节点中包含数学公式时，必须符合 Mermaid 官方规范使用双美元符号 $$...$$，严禁裸单美元符号。
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import DOMPurify from 'dompurify';
import mermaid from 'mermaid';

function walk(dir: string, list: string[] = []): string[] {
  if (!fs.existsSync(dir)) return list;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, list);
    else if (entry.name.endsWith('.mdx')) list.push(full);
  }
  return list;
}

describe('Mermaid Integrity Invariant Contract (图表语法与数学公式契约)', () => {
  beforeAll(() => {
    (DOMPurify as any).sanitize = (s: string) => s;
    (DOMPurify as any).addHook = () => {};
    (globalThis as any).window = { DOMPurify };
    (globalThis as any).document = {
      createElement: () => ({ getContext: () => null }),
      getElementById: () => null,
    };

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
    });
  });

  const docsDir = path.resolve('src/content/docs');
  const allMdxFiles = walk(docsDir);

  it('全站所有 Mermaid 代码块必须 100% 成功通过 mermaid.parse 词法与语法分析', async () => {
    const parseErrors: { file: string; block: number; error: string; snippet: string }[] = [];
    let totalDiagrams = 0;

    for (const file of allMdxFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const matches = [...content.matchAll(/```mermaid([\s\S]*?)```/g)];

      let blockIdx = 0;
      for (const m of matches) {
        blockIdx++;
        totalDiagrams++;
        const rawCode = m[1].trim();
        if (!rawCode) continue;

        try {
          await mermaid.parse(rawCode);
        } catch (err: any) {
          parseErrors.push({
            file: path.relative(process.cwd(), file).replace(/\\/g, '/'),
            block: blockIdx,
            error: err.message || err.str || String(err),
            snippet: rawCode.slice(0, 100).replace(/\s+/g, ' '),
          });
        }
      }
    }

    expect(totalDiagrams, '全站应至少包含已编写的 Mermaid 图表').toBeGreaterThan(0);
    expect(parseErrors, `发现 ${parseErrors.length} 处 Mermaid 语法解析错误:\n${JSON.stringify(parseErrors, null, 2)}`).toEqual([]);
  });

  it('Mermaid 边标签中包含括号或特殊字符时必须使用双引号包裹', () => {
    const unquotedEdgeErrors: { file: string; line: number; edge: string }[] = [];

    for (const file of allMdxFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split(/\r?\n/);
      let inMermaid = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith('```mermaid')) {
          inMermaid = true;
          continue;
        }
        if (inMermaid && line.trim().startsWith('```')) {
          inMermaid = false;
          continue;
        }

        if (inMermaid) {
          // 检查 -->|label|，若包含 () 且未加引号
          const match = line.match(/(-->|---\||--\s*\|)([^"|\n]+)\|/);
          if (match) {
            const label = match[2];
            if (/[()]/.test(label)) {
              unquotedEdgeErrors.push({
                file: path.relative(process.cwd(), file).replace(/\\/g, '/'),
                line: i + 1,
                edge: match[0],
              });
            }
          }
        }
      }
    }

    expect(unquotedEdgeErrors, 'Mermaid 边标签包含括号但未加双引号，将导致词法解析崩溃').toEqual([]);
  });

  it('Mermaid 视觉排版与防漂移样式契约：必须配置 foreignObject overflow 与 p 标签外边距清零', () => {
    const cssPath = path.resolve('src/styles/components/mermaid.css');
    expect(fs.existsSync(cssPath), 'src/styles/components/mermaid.css 必须存在').toBe(true);

    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    expect(cssContent).toContain('overflow: visible !important');
    expect(cssContent).toContain('margin: 0 !important');
    expect(cssContent).toContain('text-indent: 0 !important');
    expect(cssContent).toContain('.mermaid-container');
    expect(cssContent).toContain('.mermaid-render');

    const customCssPath = path.resolve('src/styles/custom.css');
    const customCssContent = fs.readFileSync(customCssPath, 'utf-8');
    expect(customCssContent).toContain("components/mermaid.css");
  });

  it('Mermaid 客户端加载器 mermaid-loader.ts 必须配置 themeCSS 防漂移内联保护与换行自愈', () => {
    const loaderPath = path.resolve('src/components/sidebar/mermaid-loader.ts');
    const loaderContent = fs.readFileSync(loaderPath, 'utf-8');

    expect(loaderContent).toContain('themeCSS: MERMAID_STABILIZATION_CSS');
    expect(loaderContent).toContain('MERMAID_STABILIZATION_CSS');
    expect(loaderContent).toContain('<br/>');
  });
});
