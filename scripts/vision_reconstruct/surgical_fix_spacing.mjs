import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const rebuildDir = path.join(ROOT_DIR, 'src/content/docs/collections/math/engineering_analysis_rebuild');

function cleanFile(fileName) {
  const filePath = path.join(rebuildDir, fileName);
  if (!fs.existsSync(filePath)) return;

  let text = fs.readFileSync(filePath, 'utf-8');

  text = text.replace(/import\s*\{[^}]*\}\s*from\s*['"][^'"]*['"];?\r?\n/g, '');

  text = text.replace(/\\wideparen/g, '\\widehat');
  text = text.replace(/\\overparen/g, '\\widehat');

  const cardNames = 'Knowledge|Solution|Example|SideNote|Block|Analysis|Note|Method|Guide|Variant';
  text = text.replace(new RegExp(`(<(?:${cardNames})(?:\\s+(?:"[^"]*"|'[^']*'|[^>'"])*)?>)([^\\r\\n])`, 'g'), '$1\n\n$2');
  text = text.replace(new RegExp(`([^\\r\\n])(<\\/(?:${cardNames})>)`, 'g'), '$1\n\n$2');

  text = text.replace(/\n{4,}/g, '\n\n\n');

  fs.writeFileSync(filePath, text, 'utf-8');
  console.log(`[Cleaned & Formatted] ${fileName}`);
}

cleanFile('a1_附录1-2_参数表示极坐标与常见曲线.mdx');
cleanFile('a2_附录3-4_三角函数公式与反三角函数.mdx');
cleanFile('a3_附录5-6_复数与积分表.mdx');
cleanFile('a4_下册附录_部分曲面和空间立体的图形.mdx');
cleanFile('00_前言.mdx');
cleanFile('01_绪论.mdx');

console.log('🎉 所有新增 MDX 卡片与语法间距规范化完成！');
