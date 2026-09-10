import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import {
  exportChapterToLatex,
  createChapterZipPackage,
} from '../src/publishing/latex/chapter-exporter.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('🧪 开始运行 AstroLib 教材章节 LaTeX / PDF 导出与编译自动化测试');
console.log('================================================================\n');

// 1. 选择真实教材样本 MDX 进行全量解析与导出 (2.2 求导的基本法则，含定理、图示、例题)
const sampleMdxPath = path.join(
  ROOT,
  'src',
  'content',
  'docs',
  'collections',
  'math',
  'engineering_analysis',
  '2.2_求导的基本法则.mdx'
);

if (!fs.existsSync(sampleMdxPath)) {
  console.error(`❌ 找不到测试样本 MDX 文件: ${sampleMdxPath}`);
  process.exit(1);
}

const mdxSource = fs.readFileSync(sampleMdxPath, 'utf8');

console.log('--- [阶段 1] MDX -> Semantic Document -> LaTeX 导出转换 ---');
const exportResult = exportChapterToLatex({
  mdxSource,
  slug: '2.2_求导的基本法则',
  bookSlug: 'engineering_analysis',
  colSlug: 'math',
  bookTitle: '工科数学分析基础（第三版）',
  courseName: '工科数学分析',
  latexConfig: {
    documentclass: 'ctexart',
  },
});

console.log(`✅ 章节标题: ${exportResult.title} (清理后: ${exportResult.cleanTitle})`);
console.log(`✅ 生成 LaTeX 文件名: ${exportResult.filename}`);
console.log(`✅ 包含插图资源数: ${exportResult.assets.length}`);
console.log(`✅ 语义块总数: ${exportResult.doc.blocks.length}`);
console.log(`✅ 生成 LaTeX 源码行数: ${exportResult.tex.split('\n').length}`);

// 2. 检查 LaTeX 语法平衡
console.log('\n--- [阶段 2] 检查生成的 LaTeX 源码语法平衡 ---');
function validateLatexSyntax(latexCode) {
  const errors = [];

  // 占位符残留
  if (/§§|___MATH/.test(latexCode)) {
    errors.push('包含未还原的占位符 (§§ 或 ___MATH)');
  }

  // HTML 标签残留 (常见如 <b>, <div> 等)
  const htmlMatch = latexCode.match(/<\/?[a-z][a-z0-9]*[^<>]*>/i);
  if (htmlMatch) {
    errors.push(`包含残留 HTML 标签: ${htmlMatch[0]}`);
  }

  // HTML 实体残留
  const entityMatch = latexCode.match(/&(?:nbsp|amp|lt|gt|quot|#39);/);
  if (entityMatch) {
    errors.push(`包含残留 HTML 实体: ${entityMatch[0]}`);
  }

  // 环境闭合检查
  const envs = [
    'document',
    'theorem',
    'definition',
    'lemma',
    'corollary',
    'proposition',
    'axiom',
    'property',
    'criterion',
    'academicblock',
    'example',
    'variant',
    'method',
    'proof',
    'solution',
    'remark',
    'analysis',
    'guide',
    'summary',
    'exercise',
    'itemize',
    'enumerate',
    'figure',
    'table',
  ];

  envs.forEach((env) => {
    const beginMatches = (latexCode.match(new RegExp(`\\\\begin\\{${env}\\}`, 'g')) || []).length;
    const endMatches = (latexCode.match(new RegExp(`\\\\end\\{${env}\\}`, 'g')) || []).length;
    if (beginMatches !== endMatches) {
      errors.push(`环境 \\begin{${env}} (${beginMatches}次) 与 \\end{${env}} (${endMatches}次) 数量不平衡`);
    }
  });

  return errors;
}

const syntaxErrors = validateLatexSyntax(exportResult.tex);
if (syntaxErrors.length > 0) {
  console.error('❌ LaTeX 语法检查未通过:');
  syntaxErrors.forEach((e) => console.error(`   - ${e}`));
  process.exit(1);
}
console.log('✅ LaTeX 语法平衡检查全部通过！');

// 3. 测试 ZIP 归档包生成
console.log('\n--- [阶段 3] 测试可离线编译的 ZIP 包打包 ---');
const zipBuffer = createChapterZipPackage(exportResult);
console.log(`✅ ZIP 打包成功，包体大小: ${(zipBuffer.length / 1024).toFixed(1)} KB`);

const testWorkspace = path.join(ROOT, '.tmp', 'test-chapter-latex');
try {
  fs.mkdirSync(testWorkspace, { recursive: true });
} catch {}

const texPath = path.join(testWorkspace, 'chapter.tex');
fs.writeFileSync(texPath, exportResult.tex, 'utf8');

const styPath = path.join(testWorkspace, 'astrolib-chapter.sty');
fs.writeFileSync(styPath, exportResult.styleSource, 'utf8');

// 拷贝相关插图
for (const asset of exportResult.assets) {
  const destPath = path.join(testWorkspace, asset.targetPath);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(asset.localPath, destPath);
}
console.log(`✅ 测试目录已准备: .tmp/test-chapter-latex/`);

// 5. 调用本地 XeLaTeX 进行编译验证
console.log('\n--- [阶段 4] 本地 XeLaTeX 编译真实验证 ---');
let xelatexCmd = 'xelatex';
const candidates = [
  'xelatex',
  'D:\\texlive\\2026\\bin\\windows\\xelatex.exe',
  'C:\\texlive\\2026\\bin\\windows\\xelatex.exe',
  'C:\\texlive\\2025\\bin\\windows\\xelatex.exe',
  'C:\\texlive\\2024\\bin\\windows\\xelatex.exe',
];

let availableXelatex = null;
for (const cand of candidates) {
  try {
    execSync(`"${cand}" --version`, { stdio: 'ignore' });
    availableXelatex = cand;
    break;
  } catch (e) {
    // continue
  }
}

if (!availableXelatex) {
  console.warn('⚠️ 未检测到本地 xelatex 命令行工具，跳过物理 PDF 编译测试（语法已通过）');
} else {
  console.log(`🔍 使用 XeLaTeX 引擎: ${availableXelatex}`);
  try {
    // 第一次编译生成 aux / 交叉引用
    console.log('⏳ 执行第 1 次 XeLaTeX 编译...');
    execSync(
      `"${availableXelatex}" -file-line-error -interaction=nonstopmode chapter.tex`,
      {
        cwd: testWorkspace,
        stdio: 'pipe',
      }
    );

    // 第二次编译解决 cleveref 与 tcolorbox 交叉引用
    console.log('⏳ 执行第 2 次 XeLaTeX 编译 (解析引用与计数器)...');
    execSync(
      `"${availableXelatex}" -file-line-error -interaction=nonstopmode chapter.tex`,
      {
        cwd: testWorkspace,
        stdio: 'pipe',
      }
    );

    const pdfPath = path.join(testWorkspace, 'chapter.pdf');
    if (fs.existsSync(pdfPath)) {
      const stat = fs.statSync(pdfPath);
      console.log(`\n🎉 PDF 编译大获成功！`);
      console.log(`📄 产物路径: .tmp/test-chapter-latex/chapter.pdf`);
      console.log(`📊 产物大小: ${(stat.size / 1024).toFixed(1)} KB`);
    } else {
      throw new Error('未生成 chapter.pdf 目标文件！');
    }
  } catch (err) {
    console.error('❌ XeLaTeX 编译失败:');
    const logPath = path.join(testWorkspace, 'chapter.log');
    if (fs.existsSync(logPath)) {
      const log = fs.readFileSync(logPath, 'utf8');
      const lines = log.split('\n');
      console.error(lines.slice(-60).join('\n'));
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
}

console.log('\n======================================================');
console.log('✅ 章节 LaTeX 导出引擎与物理 XeLaTeX 编译验证全部通过！');
console.log('======================================================\n');
