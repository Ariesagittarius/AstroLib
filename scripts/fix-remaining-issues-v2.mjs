// 修复脚本 v2：
// 0. 撤销 v1 的错误拆行（CRLF 下 close.replace 取不到标签名，导致单行组件被拆成两行）
// 1. 多行组件块的开/闭标签独占一行（正确实现，带 CRLF 安全判断）
// 2. 正文 “<” 后接中文标点 → &lt;
// 3. 24.3 的 $(1)$ $$ 同行 → 拆行
import fs from 'node:fs';
import path from 'node:path';
import { compile } from '@mdx-js/mdx';
import remarkMath from 'remark-math';

const TAG = '(?:Note|Solution|Example|Knowledge|Method|Block|Guide|Analysis|Variant|Summary)';
const files = [
  'src/content/docs/collections/math/math_analysis/2.4_Cauchy 命题与 Stolz 定理.mdx',
  'src/content/docs/collections/math/math_analysis/21.4_条件极值与条件最值.mdx',
  'src/content/docs/collections/math/math_analysis/24.3_Green 公式.mdx',
  'src/content/docs/collections/math/math_analysis/5.3_有界性定理与最值定理.mdx',
  'src/content/docs/collections/math/math_analysis/5.4_一致连续性与 Cantor 定理.mdx',
  'src/content/docs/collections/math/math_analysis/7.1_微分学中值定理.mdx',
  'src/content/docs/collections/math/math_analysis/8.4_函数的凸性.mdx',
];

async function compiles(body) {
  try {
    await compile(body.replace(/^---[\s\S]*?---\r?\n?/, '').replace(/\r/g, ''), {
      remarkPlugins: [remarkMath],
      jsx: true,
    });
    return true;
  } catch {
    return false;
  }
}

function fixContent(content, eol) {
  let out = content;
  // 0. 撤销错误拆行：<Tag...>text + </Tag> 合并回一行
  out = out.replace(
    new RegExp(`^(\\s*<${TAG}\\b[^>]*>\\S[^\\r\\n]*)\\r?\\n(\\s*</${TAG}>\\s*)$`, 'gm'),
    (m, first, close) => first + close.trim()
  );
  // 1. 开标签同行文字（该行无闭合标签）→ 开标签独占一行
  out = out.replace(
    new RegExp(`^(\\s*<${TAG}\\b[^>]*>)(\\S.*)$`, 'gm'),
    (m, open, rest) => (m.includes('</') ? m : open + eol + rest)
  );
  // 2. 闭合标签前同行文字（该行无开标签）→ 闭合标签独占一行
  out = out.replace(
    new RegExp(`^(.*\\S)(</${TAG}>\\s*)$`, 'gm'),
    (m, rest, close) => {
      const tagName = close.trim().replace(/^<\/(.*)>$/, '$1');
      return m.includes(`<${tagName}`) ? m : rest + eol + close.trim();
    }
  );
  // 3. “<” 后接中文标点
  out = out.replace(/“<”/g, '“&lt;”');
  // 4. 24.3：$(1)$ $$ 同行 → 拆成两行，去掉中间多余空行
  out = out.replace(/^\$\(1\)\$ \$\$\r?\n\r?\n/gm, () => '$(1)$' + eol + '$$' + eol);
  // 4b. 兜底：$(1)$ 后跟单个 $ 的破损状态 → 补成 $$
  out = out.replace(/^(\$\(1\)\$)\r?\n(\$)\r?\n/gm, (m, p1) => p1 + eol + '$$' + eol);
  return out;
}

let fixedCount = 0;
for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  if (await compiles(original)) {
    console.log('本就通过:', path.basename(file));
    continue;
  }
  const eol = original.includes('\r\n') ? '\r\n' : '\n';
  const fixed = fixContent(original, eol);
  if (fixed === original) {
    console.log('无变化:', path.basename(file));
    continue;
  }
  fs.writeFileSync(file, fixed, 'utf8');
  fixedCount++;
  const ok = await compiles(fixed);
  console.log(`${ok ? '已修复' : '仍失败'}: ${path.basename(file)}`);
}
console.log(`\n共修改 ${fixedCount} 个文件`);
