/**
 * tests/helpers/latex-validators.ts
 * LaTeX 源码平衡性与无泄露审计工具
 */

export interface LatexViolation {
  kind: string;
  message: string;
  snippet?: string;
}

export function validateLatexSyntax(latexCode: string): LatexViolation[] {
  const violations: LatexViolation[] = [];

  // 1. 占位符残留检测
  if (/§§|___MATH|___TYPST|TYPST_/.test(latexCode)) {
    violations.push({
      kind: 'placeholder_leak',
      message: 'LaTeX 源码中包含未还原的占位符 (§§ 或 ___MATH 等)',
    });
  }

  // 2. HTML 标签残留检测 (允许特定注释，不允许普通标签)
  const htmlMatch = latexCode.match(/<\/?[a-z][a-z0-9]*[^<>]*>/i);
  if (htmlMatch) {
    violations.push({
      kind: 'html_tag_leak',
      message: `包含残留的 HTML 标签: ${htmlMatch[0]}`,
      snippet: htmlMatch[0],
    });
  }

  // 3. HTML 实体残留检测
  const entityMatch = latexCode.match(/&(?:nbsp|amp|lt|gt|quot|#39);/);
  if (entityMatch) {
    violations.push({
      kind: 'html_entity_leak',
      message: `包含残留的 HTML 实体: ${entityMatch[0]}`,
      snippet: entityMatch[0],
    });
  }

  // 4. 环境平衡配对检测
  const envStack: string[] = [];
  const lines = latexCode.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 忽略纯注释行
    if (/^\s*%/.test(line)) continue;

    const beginMatches = [...line.matchAll(/\\begin\{([a-zA-Z*]+)\}/g)];
    const endMatches = [...line.matchAll(/\\end\{([a-zA-Z*]+)\}/g)];

    // 顺序记录
    const events: { type: 'begin' | 'end'; name: string; index: number }[] = [];
    for (const m of beginMatches) {
      if (m.index !== undefined) events.push({ type: 'begin', name: m[1], index: m.index });
    }
    for (const m of endMatches) {
      if (m.index !== undefined) events.push({ type: 'end', name: m[1], index: m.index });
    }
    events.sort((a, b) => a.index - b.index);

    for (const ev of events) {
      if (ev.type === 'begin') {
        envStack.push(ev.name);
      } else {
        const last = envStack.pop();
        if (last !== ev.name) {
          violations.push({
            kind: 'env_mismatch',
            message: `行 ${i + 1}: 环境闭合不匹配: 期望 \\end{${last || 'NONE'}}，实际得到 \\end{${ev.name}}`,
          });
        }
      }
    }
  }

  if (envStack.length > 0) {
    violations.push({
      kind: 'env_unclosed',
      message: `存在未闭合的 LaTeX 环境: ${envStack.join(', ')}`,
    });
  }

  return violations;
}
