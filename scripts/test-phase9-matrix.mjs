#!/usr/bin/env node
/**
 * scripts/test-phase9-matrix.mjs
 * AstroLib Phase 9: Academic Typography 全矩阵测试与 Fixture 验证套件
 *
 * 覆盖 4 个核心维度：
 * 1. 预设 × 模式矩阵 (4 Presets × 2 Modes = 8 组合)
 * 2. 模板矩阵 (Chapter, Handout, Exam)
 * 3. 历史兼容矩阵 (16 组 Legacy Combinations + 优先级 + LocalStorage 迁移)
 * 4. 物理 XeLaTeX 编译与嵌入字体审计 (4 份长篇学术 PDF 实测，零 Variable Font，零缺失)
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import {
  PRESET_REGISTRY,
  listTypographyPresets,
  renderTypographyPreamble,
  resolveTypographyConfig,
  normalizeLegacyIntent,
  isTypographyPresetId,
} from '../src/publishing/typography/index.ts';
import {
  renderChapterLatexDocument,
  generateLatexDocument,
} from '../src/publishing/latex/latex-generator.ts';
import {
  getTypographyTarget,
  DEFAULT_CHAPTER_EXPORT_SETTINGS,
  DEFAULT_EXERCISE_EXPORT_SETTINGS,
} from '../src/publishing/common/export-settings.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FIXTURES_DIR = path.join(ROOT, 'test', 'fixtures', 'typography');
const OUT_DIR = path.join(ROOT, '.tmp', 'phase9-matrix');

fs.mkdirSync(OUT_DIR, { recursive: true });

console.log('================================================================');
console.log('🧪 AstroLib Phase 9: Academic Typography 全矩阵自动化测试');
console.log('================================================================\n');

// 1. 加载所有标准 Fixtures
console.log('--- [步骤 0] 加载标准测试 Fixtures ---');
const canonicalChapter = JSON.parse(
  fs.readFileSync(path.join(FIXTURES_DIR, 'canonical-chapter.json'), 'utf8')
);
const canonicalExercises = JSON.parse(
  fs.readFileSync(path.join(FIXTURES_DIR, 'canonical-exercises.json'), 'utf8')
);
const legacyCases = JSON.parse(
  fs.readFileSync(path.join(FIXTURES_DIR, 'legacy-matrix-fixtures.json'), 'utf8')
);
const stressMathTeX = fs.readFileSync(path.join(FIXTURES_DIR, 'stress-math-suite.tex'), 'utf8');

console.log(`✅ 已加载章节 Fixture: "${canonicalChapter.title}" (${canonicalChapter.blocks.length} 块)`);
console.log(`✅ 已加载习题 Fixture: ${canonicalExercises.length} 道题目`);
console.log(`✅ 已加载 Legacy 测试用例: ${legacyCases.length} 组`);
console.log(`✅ 已加载公式压力测试 TeX 源码: ${stressMathTeX.length} 字符\n`);

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    totalPassed++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    totalFailed++;
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

// =============================================================================
// 维度 1: 预设 × 模式解析与代码生成矩阵 (4 Presets × 2 Modes = 8 单元)
// =============================================================================
console.log('--- [维度 1] 预设 × 模式生成矩阵 (4 Presets × 2 Modes = 8 单元) ---');

const presets = listTypographyPresets();
const modes = ['deterministic', 'adaptive'];
const dim1Results = [];

for (const preset of presets) {
  for (const mode of modes) {
    const target = preset.id;
    const resolved = resolveTypographyConfig(target, mode);

    const doc = renderChapterLatexDocument(canonicalChapter, {
      typography: target,
      resolutionMode: mode,
    });

    const hasUnicodeMath = doc.includes('\\usepackage{unicode-math}');
    const hasBaselineStretch = doc.includes(`\\linespread{${preset.metrics.baselineStretch}}`);
    const hasParindent = doc.includes(`\\setlength{\\parindent}{${preset.metrics.parIndent}}`);
    const hasDocClass = doc.includes('\\documentclass');

    let modeValid = false;
    if (mode === 'deterministic') {
      // 确定性模式：应当包含直接设置或确定性回退链
      modeValid = doc.includes('\\setmainfont') && doc.includes('\\setmathfont') && doc.includes('\\setCJKmainfont');
    } else {
      // 自适应模式：应当包含 \\IfFontExistsTF 条件探测
      modeValid = doc.includes('\\IfFontExistsTF');
    }

    const cellPass = hasUnicodeMath && hasBaselineStretch && hasParindent && hasDocClass && modeValid;
    assert(cellPass, `[${preset.id} × ${mode}] 源码生成与排版指令完备`);

    dim1Results.push({
      preset: preset.id,
      mode,
      baselineStretch: preset.metrics.baselineStretch,
      rhythmProfile: preset.metrics.rhythmProfile,
      linesCount: doc.split('\n').length,
      status: cellPass ? 'PASS' : 'FAIL',
    });
  }
}

// =============================================================================
// 维度 2: 文档模版矩阵 (Chapter, Handout, Exam)
// =============================================================================
console.log('\n--- [维度 2] 文档模版生成矩阵 (Chapter, Handout, Exam) ---');

// 2.1 Chapter Document (ctexart + astrolib-chapter.sty)
const chapterDoc = renderChapterLatexDocument(canonicalChapter, {
  typography: 'scholarly',
  headerMode: 'standard',
  showToc: true,
});
assert(chapterDoc.includes('\\usepackage{astrolib-chapter}'), 'Chapter 模版注入 astrolib-chapter 宏包');
assert(chapterDoc.includes('\\tableofcontents'), 'Chapter 模版正确包含目录指令');
assert(chapterDoc.includes('\\begin{theorem}{柯西收敛准则'), 'Chapter 模版正确渲染 amsthm 定理环境');
assert(chapterDoc.includes('\\begin{solution}'), 'Chapter 模版正确渲染解题环境');
assert(chapterDoc.includes('\\astrolibdigitalresource'), 'Chapter 模版正确渲染数字资源');

// 2.2 Handout Worksheet (homework template)
const handoutDoc = generateLatexDocument(canonicalExercises, {
  template: 'handout',
  typography: 'mathematical',
  answerPlacement: 'appendix',
});
assert(handoutDoc.includes('\\documentclass['), 'Handout 模版生成有效 documentclass');
assert(handoutDoc.includes('title in boldface'), 'Handout 模版注入 Jinwen-XU/homework 标准选项');
assert(handoutDoc.includes('LibertinusMath-Regular.otf'), 'Handout 模版按 mathematical 预设注入 Libertinus 公式字体');
assert(handoutDoc.includes('\\begin{solution}'), 'Handout 模版附录题解渲染有效');

// 2.3 Exam Paper (exam template)
const examDoc = generateLatexDocument(canonicalExercises, {
  template: 'exam',
  typography: 'classic',
  writingSpace: 'comfortable',
  answerPlacement: 'none',
});
assert(examDoc.includes('hide solution'), 'Exam 模版正确注入 hide solution 考试试卷选项');
assert(examDoc.includes('latinmodern-math.otf'), 'Exam 模版按 classic 预设注入 Latin Modern 公式字体');

// =============================================================================
// 维度 3: 历史配置规范化与兼容矩阵 (16 组 Legacy Combinations)
// =============================================================================
console.log('\n--- [维度 3] Legacy 规范化与兼容矩阵 (16 组用例) ---');

const originalRegistryJson = JSON.stringify(PRESET_REGISTRY);

for (const tc of legacyCases) {
  const intent = normalizeLegacyIntent(tc.input);
  const passBase = intent.basePresetId === tc.expected.basePresetId;
  const passMath = (intent.overrides?.mathFamily || undefined) === (tc.expected.mathFamily || undefined);
  const passSans = !!intent.overrides?.isSansTitle === !!tc.expected.isSansTitle;

  const resolved = resolveTypographyConfig(tc.input, 'deterministic');
  const passSource = resolved.source === 'legacy';
  const passWarning = resolved.warnings.length > 0;

  assert(
    passBase && passMath && passSans && passSource && passWarning,
    `${tc.name} -> base: ${intent.basePresetId}, math: ${intent.overrides?.mathFamily || 'default'}`
  );
}

// 验证 PRESET_REGISTRY 未被正交覆写所污染 (Immutability / Purity Check)
assert(
  JSON.stringify(PRESET_REGISTRY) === originalRegistryJson,
  'PRESET_REGISTRY 具备纯粹不可变性，解析旧参数未发生全局对象污染'
);

// 优先级契约测试 (Precedence Rules)
console.log('\n--- [维度 3.1] 优先级规则断言 ---');
const explicitModern = getTypographyTarget(
  { typography: 'scholarly' },
  { typography: 'classic', mathFont: 'times' }
);
assert(explicitModern === 'classic', '明确的 modern typography 优于任何 legacy mathFont');

const explicitLegacy = getTypographyTarget(
  { typography: 'scholarly' },
  { mathFont: 'modern' }
);
assert(
  typeof explicitLegacy === 'object' && explicitLegacy.mathFont === 'modern',
  '明确的 userExplicit legacy 优于默认 settings.typography'
);

const defaultFallback = getTypographyTarget({});
assert(defaultFallback === 'scholarly', '空输入默认稳定回退至 scholarly');

// =============================================================================
// 维度 4: 物理 XeLaTeX 编译与嵌入字体审计 (4 Presets 真实长篇 PDF 实测)
// =============================================================================
console.log('\n--- [维度 4] 真实 XeLaTeX 物理双遍编译与嵌入字体审计 ---');

function findXelatex() {
  const candidates = [
    'xelatex',
    'D:\\texlive\\2026\\bin\\windows\\xelatex.exe',
    'C:\\texlive\\2026\\bin\\windows\\xelatex.exe',
  ];
  for (const cand of candidates) {
    try {
      execSync(`"${cand}" --version`, { stdio: 'ignore' });
      return cand;
    } catch {}
  }
  return null;
}

// 从 PDF 二进制流中提取所有嵌入的 BaseFont
function extractPdfEmbeddedFonts(pdfBuffer) {
  const decompressed = [];
  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match;
  while ((match = streamRegex.exec(pdfBuffer.toString('latin1'))) !== null) {
    const raw = Buffer.from(match[1], 'latin1');
    try {
      const dec = zlib.inflateSync(raw);
      decompressed.push(dec.toString('latin1'));
    } catch {
      decompressed.push(raw.toString('latin1'));
    }
  }

  const allText = pdfBuffer.toString('latin1') + '\n' + decompressed.join('\n');
  const baseFonts = new Set();
  const fontRegex = /\/(?:BaseFont|FontName)\s*\/([A-Za-z0-9\+\-_]+)/g;
  while ((match = fontRegex.exec(allText)) !== null) {
    const rawName = match[1];
    const cleanName = rawName.split('+').pop();
    baseFonts.add(cleanName);
  }

  return Array.from(baseFonts).sort();
}

const xelatexBin = findXelatex();
if (!xelatexBin) {
  console.warn('⚠️ 未检测到本地 xelatex 编译器，跳过物理编译阶段。');
} else {
  console.log(`🔍 本地编译器: ${xelatexBin}\n`);

  // 拷贝宏包与素材
  const stySource = fs.readFileSync(
    path.join(ROOT, 'src', 'publishing', 'latex', 'templates', 'astrolib-chapter.sty'),
    'utf8'
  );

  const dim4Results = [];

  for (const preset of presets) {
    const pId = preset.id;
    const testDir = path.join(OUT_DIR, pId);
    fs.mkdirSync(testDir, { recursive: true });

    // 拷贝样式与 assets
    fs.writeFileSync(path.join(testDir, 'astrolib-chapter.sty'), stySource, 'utf8');
    const assetsDir = path.join(testDir, 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });

    const sampleImgSrc = path.join(
      ROOT,
      'public',
      'data',
      'exercises',
      'engineering_analysis',
      'images',
      '04e418ad37d92cf97aaf8ee7ac3a3d3f7ed4e87b6481fe84f73472a81e853cbf.jpg'
    );
    if (fs.existsSync(sampleImgSrc)) {
      fs.copyFileSync(sampleImgSrc, path.join(assetsDir, path.basename(sampleImgSrc)));
    }

    // 生成正文并追加公式压力测试
    let chapterTex = renderChapterLatexDocument(canonicalChapter, {
      typography: pId,
      resolutionMode: 'deterministic',
    });

    // 在 \\end{document} 前插入公式压力测试
    chapterTex = chapterTex.replace(
      '\\end{document}',
      `\n% ================= 插入公式压力测试 =================\n${stressMathTeX}\n\\end{document}`
    );

    const texPath = path.join(testDir, 'main.tex');
    const pdfPath = path.join(testDir, 'main.pdf');
    fs.writeFileSync(texPath, chapterTex, 'utf8');

    const start = Date.now();
    let compileSuccess = false;

    try {
      // 双遍编译保证引用与目录收敛
      execSync(`"${xelatexBin}" -interaction=nonstopmode -file-line-error main.tex`, {
        cwd: testDir,
        stdio: 'ignore',
        timeout: 30000,
      });
      execSync(`"${xelatexBin}" -interaction=nonstopmode -file-line-error main.tex`, {
        cwd: testDir,
        stdio: 'ignore',
        timeout: 30000,
      });
      compileSuccess = fs.existsSync(pdfPath);
    } catch (e) {
      compileSuccess = false;
    }

    const durMs = Date.now() - start;

    let embeddedFonts = [];
    let vfCount = 0;
    let pageCount = 0;
    let fileSizeKb = '0';

    if (compileSuccess) {
      const pdfBuffer = fs.readFileSync(pdfPath);
      fileSizeKb = (pdfBuffer.length / 1024).toFixed(1);
      embeddedFonts = extractPdfEmbeddedFonts(pdfBuffer);
      const vfFonts = embeddedFonts.filter((f) => /(-VF|-Variable|VariableFont)/i.test(f));
      vfCount = vfFonts.length;

      const logPath = path.join(testDir, 'main.log');
      if (fs.existsSync(logPath)) {
        const logContent = fs.readFileSync(logPath, 'utf8');
        const m = logContent.match(/Output written on [^\r\n]+ \((\d+) pages/);
        pageCount = m ? parseInt(m[1], 10) : 1;
      }
    }

    const passCompilation = compileSuccess && fs.existsSync(pdfPath);
    const passZeroVF = vfCount === 0;
    const passFonts = embeddedFonts.length >= 4;

    assert(passCompilation, `[Preset: ${pId}] XeLaTeX 双遍物理编译成功 (${pageCount} 页, ${fileSizeKb} KB, ${(durMs / 1000).toFixed(2)}s)`);
    assert(passZeroVF, `[Preset: ${pId}] 可变字体检测为 0 (严格静态)`);
    assert(passFonts, `[Preset: ${pId}] 嵌入字体完整 (${embeddedFonts.length} 字体: ${embeddedFonts.filter((f) => !f.includes('Identity-H')).slice(0, 4).join(', ')})`);

    dim4Results.push({
      preset: pId,
      name: preset.name,
      pageCount: `${pageCount} 页`,
      fileSize: `${fileSizeKb} KB`,
      duration: `${(durMs / 1000).toFixed(2)}s`,
      fontCount: embeddedFonts.length,
      variableFonts: vfCount,
      primaryEmbedded: embeddedFonts.filter((f) => !f.includes('Identity-H')).slice(0, 5).join(', '),
      status: passCompilation && passZeroVF && passFonts ? '✅ PASS' : '❌ FAIL',
    });
  }

  console.log('\n📊 物理编译与字体嵌入审计汇总:');
  console.table(
    dim4Results.map((r) => ({
      预设标识: r.preset,
      出版预设名称: r.name,
      页数: r.pageCount,
      体积: r.fileSize,
      耗时: r.duration,
      嵌入字体数: r.fontCount,
      可变字体数: r.variableFonts,
      状态: r.status,
    }))
  );
}

// 写入完整测试矩阵报告
const reportPath = path.join(ROOT, '.tmp', 'phase9-test-matrix-report.json');
fs.writeFileSync(
  reportPath,
  JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      summary: {
        totalPassed,
        totalFailed,
        successRate: `${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`,
      },
      dim1_preset_modes: dim1Results,
      dim3_legacy_matrix: legacyCases,
    },
    null,
    2
  ),
  'utf8'
);

console.log(`\n📄 Phase 9 全矩阵测试报告已写入: ${reportPath}`);
console.log('================================================================');
console.log(`🏁 Phase 9 自动化测试完成: ${totalPassed} 项通过, ${totalFailed} 项失败！`);
console.log('================================================================\n');

if (totalFailed > 0) {
  process.exit(1);
}
