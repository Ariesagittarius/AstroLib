import fs from 'node:fs';
import path from 'node:path';

/**
 * 语法状态机：剥离 JavaScript / TypeScript / JSONC 格式中的注释
 * 精确处理单双引号、模板字符串（支持多层 ${...} 嵌套）、正则表达式字面量
 */
export function stripJsTsComments(code) {
  let output = '';
  const len = code.length;
  let i = 0;

  const stateStack = [];

  while (i < len) {
    const ch = code[i];
    const next = i + 1 < len ? code[i + 1] : '';

    const currentState = stateStack.length > 0 ? stateStack[stateStack.length - 1] : 'DEFAULT';

    if (currentState === 'DEFAULT' || currentState === 'TEMPLATE_EXPR') {
      // 1. 单行注释 //
      if (ch === '/' && next === '/') {
        i += 2;
        while (i < len && code[i] !== '\n' && code[i] !== '\r') {
          i++;
        }
        continue;
      }

      // 2. 多行注释 /* ... */
      if (ch === '/' && next === '*') {
        i += 2;
        while (i < len && !(code[i] === '*' && i + 1 < len && code[i + 1] === '/')) {
          i++;
        }
        i += 2;
        continue;
      }

      // 3. 单引号字符串
      if (ch === "'") {
        output += ch;
        i++;
        while (i < len) {
          const c = code[i];
          output += c;
          if (c === '\\' && i + 1 < len) {
            i++;
            output += code[i];
          } else if (c === "'") {
            i++;
            break;
          }
          i++;
        }
        continue;
      }

      // 4. 双引号字符串
      if (ch === '"') {
        output += ch;
        i++;
        while (i < len) {
          const c = code[i];
          output += c;
          if (c === '\\' && i + 1 < len) {
            i++;
            output += code[i];
          } else if (c === '"') {
            i++;
            break;
          }
          i++;
        }
        continue;
      }

      // 5. 模板字符串 `...`
      if (ch === '`') {
        output += ch;
        i++;
        stateStack.push('TEMPLATE_LITERAL');
        continue;
      }

      // 6. 正则表达式判断
      if (ch === '/') {
        if (isRegExpStart(output)) {
          output += ch;
          i++;
          let inCharClass = false;
          while (i < len) {
            const c = code[i];
            output += c;
            if (c === '\\' && i + 1 < len) {
              i++;
              output += code[i];
            } else if (c === '[') {
              inCharClass = true;
            } else if (c === ']' && inCharClass) {
              inCharClass = false;
            } else if (c === '/' && !inCharClass) {
              i++;
              while (i < len && /[a-z]/i.test(code[i])) {
                output += code[i];
                i++;
              }
              break;
            }
            i++;
          }
          continue;
        }
      }

      // 7. 处理模板表达式花括号闭合
      if (currentState === 'TEMPLATE_EXPR' && ch === '}') {
        stateStack.pop();
        output += ch;
        i++;
        continue;
      }

      output += ch;
      i++;
    } else if (currentState === 'TEMPLATE_LITERAL') {
      if (ch === '\\' && i + 1 < len) {
        output += ch + next;
        i += 2;
      } else if (ch === '$' && next === '{') {
        output += '${';
        i += 2;
        stateStack.push('TEMPLATE_EXPR');
      } else if (ch === '`') {
        output += ch;
        i++;
        stateStack.pop();
      } else {
        output += ch;
        i++;
      }
    }
  }

  return cleanEmptyLines(output);
}

function isRegExpStart(prevOutput) {
  let trimmed = prevOutput.trimEnd();
  if (!trimmed) return true;
  const lastChar = trimmed[trimmed.length - 1];

  if (/[=(,;:[?!&|{}><+*~%^-]/.test(lastChar)) {
    return true;
  }

  const match = trimmed.match(/\b(return|typeof|instanceof|case|yield|await|throw|void|delete|else|in|of)$/);
  return !!match;
}

export function stripCssComments(css) {
  let output = '';
  const len = css.length;
  let i = 0;

  while (i < len) {
    const ch = css[i];
    const next = i + 1 < len ? css[i + 1] : '';

    if (ch === '"' || ch === "'") {
      const quote = ch;
      output += quote;
      i++;
      while (i < len) {
        const c = css[i];
        output += c;
        if (c === '\\' && i + 1 < len) {
          i++;
          output += css[i];
        } else if (c === quote) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    if (ch === '/' && next === '*') {
      i += 2;
      while (i < len && !(css[i] === '*' && i + 1 < len && css[i + 1] === '/')) {
        i++;
      }
      i += 2;
      continue;
    }

    output += ch;
    i++;
  }

  return cleanEmptyLines(output);
}

export function stripHtmlComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

export function stripAstroComments(content) {
  let result = content;

  const fmMatch = result.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch) {
    const rawFm = fmMatch[1];
    const strippedFm = stripJsTsComments(rawFm);
    result = `---\n${strippedFm.trim()}\n---` + result.slice(fmMatch[0].length);
  }

  result = result.replace(/(<style(?:\s[^>]*)?>)([\s\S]*?)(<\/style>)/gi, (_, open, body, close) => {
    return open + stripCssComments(body) + close;
  });

  result = result.replace(/(<script(?:\s[^>]*)?>)([\s\S]*?)(<\/script>)/gi, (_, open, body, close) => {
    return open + stripJsTsComments(body) + close;
  });

  result = result.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  result = stripHtmlComments(result);

  return cleanEmptyLines(result);
}

export function stripMdxComments(content) {
  const codeBlockRegex = /(```[\s\S]*?```|`[^`\n]+`)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.slice(lastIndex, match.index);
    parts.push({ type: 'text', content: textBefore });
    parts.push({ type: 'code', content: match[0] });
    lastIndex = codeBlockRegex.lastIndex;
  }
  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIndex) });
  }

  const processed = parts.map(part => {
    if (part.type === 'code') {
      return part.content;
    }
    let text = part.content;

    const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (fmMatch) {
      const rawFm = fmMatch[1];
      const strippedFm = stripYamlComments(rawFm);
      text = `---\n${strippedFm.trim()}\n---` + text.slice(fmMatch[0].length);
    }

    text = stripHtmlComments(text);
    text = text.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

    return text;
  });

  return cleanEmptyLines(processed.join(''));
}

export function stripPythonComments(code) {
  let output = '';
  const len = code.length;
  let i = 0;

  while (i < len) {
    const ch = code[i];

    if ((ch === "'" || ch === '"') && i + 2 < len && code[i + 1] === ch && code[i + 2] === ch) {
      const triple = ch + ch + ch;
      output += triple;
      i += 3;
      while (i < len) {
        if (code[i] === '\\' && i + 1 < len) {
          output += code[i] + code[i + 1];
          i += 2;
        } else if (code.slice(i, i + 3) === triple) {
          output += triple;
          i += 3;
          break;
        } else {
          output += code[i];
          i++;
        }
      }
      continue;
    }

    if (ch === "'" || ch === '"') {
      const quote = ch;
      output += quote;
      i++;
      while (i < len) {
        const c = code[i];
        output += c;
        if (c === '\\' && i + 1 < len) {
          i++;
          output += code[i];
        } else if (c === quote) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    if (ch === '#') {
      if (i === 0 && code.slice(0, 2) === '#!') {
        while (i < len && code[i] !== '\n' && code[i] !== '\r') {
          output += code[i];
          i++;
        }
        continue;
      }
      while (i < len && code[i] !== '\n' && code[i] !== '\r') {
        i++;
      }
      continue;
    }

    output += ch;
    i++;
  }

  return cleanEmptyLines(output);
}

export function stripYamlComments(yaml) {
  const lines = yaml.split(/\r?\n/);
  const resultLines = lines.map(line => {
    if (line.includes('"') || line.includes("'")) {
      let inSingle = false;
      let inDouble = false;
      let cutIndex = -1;
      for (let j = 0; j < line.length; j++) {
        const c = line[j];
        if (c === "'" && !inDouble) inSingle = !inSingle;
        else if (c === '"' && !inSingle) inDouble = !inDouble;
        else if (c === '#' && !inSingle && !inDouble) {
          cutIndex = j;
          break;
        }
      }
      return cutIndex >= 0 ? line.slice(0, cutIndex).trimEnd() : line;
    }
    const hashIndex = line.indexOf('#');
    return hashIndex >= 0 ? line.slice(0, hashIndex).trimEnd() : line;
  }).filter(line => line.trim().length > 0 || line === '');

  return cleanEmptyLines(resultLines.join('\n'));
}

export function stripShellPsComments(code) {
  let cleaned = code.replace(/<#[\s\S]*?#>/g, '');
  return stripPythonComments(cleaned);
}

function cleanEmptyLines(text) {
  return text
    .replace(/[ \t]+$/gm, '')
    .replace(/(\r?\n){3,}/g, '\n\n')
    .trim() + '\n';
}

export function stripContentByExtension(content, ext) {
  const normalizedExt = ext.toLowerCase().replace(/^\./, '');

  switch (normalizedExt) {
    case 'js':
    case 'mjs':
    case 'cjs':
    case 'ts':
    case 'mts':
    case 'cts':
    case 'jsonc':
      return stripJsTsComments(content);

    case 'css':
    case 'scss':
    case 'less':
      return stripCssComments(content);

    case 'astro':
      return stripAstroComments(content);

    case 'md':
    case 'mdx':
      return stripMdxComments(content);

    case 'py':
      return stripPythonComments(content);

    case 'yml':
    case 'yaml':
      return stripYamlComments(content);

    case 'sh':
    case 'bash':
    case 'ps1':
      return stripShellPsComments(content);

    case 'html':
    case 'svg':
      return stripHtmlComments(content);

    default:
      return content;
  }
}

export function stripFile(filePath) {
  const ext = path.extname(filePath);
  const original = fs.readFileSync(filePath, 'utf8');
  const stripped = stripContentByExtension(original, ext);
  if (original !== stripped) {
    fs.writeFileSync(filePath, stripped, 'utf8');
    return true;
  }
  return false;
}
