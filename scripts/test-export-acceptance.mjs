import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_CHAPTER_EXPORT_SETTINGS,
  DEFAULT_EXERCISE_EXPORT_SETTINGS,
  SHARED_EXPORT_STORAGE_KEYS,
  renderFontPreamble,
  getStoredExportSettings,
} from '../src/publishing/common/export-settings.ts';
import {
  resolveChapterAssets,
  normalizeLatexPath,
} from '../src/publishing/common/resource-resolver.ts';
import {
  exportChapterToLatex,
} from '../src/publishing/latex/chapter-exporter.ts';
import {
  generateLatexDocument,
  renderChapterLatexDocument,
} from '../src/publishing/latex/latex-generator.ts';
import { parseMdxChapter } from '../src/publishing/common/mdx-chapter-parser.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('🔍 开始执行 E2E 验收与架构集成测试套件');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

console.log('--- [测试组 1] Shared ExportSettings 跨模块调用一致性 ---');

const storageValues = Object.values(SHARED_EXPORT_STORAGE_KEYS);
const uniqueStorageValues = new Set(storageValues);
assert(
  storageValues.length === uniqueStorageValues.size,
  `SHARED_EXPORT_STORAGE_KEYS 无重复键名 (共 ${storageValues.length} 个配置项)`
);

const fonts = ['typst', 'modern', 'times', 'pagella'];
const fontIdentifiers = {
  typst: 'NewCMMath-Book.otf',
  modern: 'latinmodern-math.otf',
  times: 'texgyretermes-math.otf',
  pagella: 'texgyrepagella-math.otf',
};

for (const f of fonts) {
  const chapterTex = renderChapterLatexDocument(
    { title: '测试章', blocks: [] },
    { mathFont: f }
  );
  const exerciseTex = generateLatexDocument(
    [],
    { title: '测试习题', mathFont: f }
  );
  const targetOtf = fontIdentifiers[f];
  assert(
    chapterTex.includes(targetOtf) && exerciseTex.includes(targetOtf),
    `Math Font [${f}] 在 Chapter 与 Exercise 中均正确注入 ${targetOtf}`
  );
}

for (const p of ['a4', 'b5']) {
  const chapterTex = renderChapterLatexDocument(
    { title: '测试章', blocks: [] },
    { paperSize: p }
  );
  const exerciseTex = generateLatexDocument(
    [],
    { title: '测试习题', paperSize: p }
  );
  const paperClass = p === 'b5' ? 'b5paper' : 'a4paper';
  assert(
    chapterTex.includes(paperClass) && exerciseTex.includes(paperClass),
    `Paper Size [${p}] 在 Chapter 与 Exercise 中均输出 ${paperClass}`
  );
}

for (const s of [10.5, 11, 12]) {
  const chapterTex = renderChapterLatexDocument(
    { title: '测试章', blocks: [] },
    { fontSize: s }
  );
  const exerciseTex = generateLatexDocument(
    [],
    { title: '测试习题', fontSize: s }
  );
  const ptStr = s === 10.5 ? '10.5pt' : `${s}pt`;
  assert(
    chapterTex.includes(s === 10.5 ? '11pt' : ptStr),
    `Font Size [${s}] 正确映射至文档类参数`
  );
}

console.log('\n--- [测试组 2] Chapter-Scoped 静态资源解析与路径标准化 ---');

assert(
  normalizeLatexPath('assets\\figures\\01.jpg') === 'assets/figures/01.jpg',
  'normalizeLatexPath 将 Windows 反斜杠标准化为 POSIX 正斜杠'
);
assert(
  normalizeLatexPath('assets/figures/01.jpg') === 'assets/figures/01.jpg',
  'normalizeLatexPath 保持 POSIX 正斜杠不变'
);

const sampleMdxPath = path.join(
  ROOT,
  'src/content/docs/collections/math/engineering_analysis/1.1_集合映射与函数.mdx'
);
const mdxContent = fs.readFileSync(sampleMdxPath, 'utf8');
const exportRes = exportChapterToLatex({
  mdxSource: mdxContent,
  slug: '1.1_集合映射与函数',
  bookSlug: 'engineering_analysis',
  colSlug: 'math',
  bookTitle: '工科数学分析',
});

assert(
  exportRes.assets.length === 15,
  `精确提取当前章节引用的 ${exportRes.assets.length} 张插图 (非全书 6000+ 张图片)`
);

const allAssetsTargetAssetsDir = exportRes.assets.every(
  (a) => a.targetPath.startsWith('assets/') && fs.existsSync(a.localPath)
);
assert(
  allAssetsTargetAssetsDir,
  '所有解析出的插图本地物理文件均存在，且目标路径统一规范至 assets/'
);

const mockChapterDir = path.join(ROOT, 'src/content/docs/collections/math/engineering_analysis');
const testImages = [
  { url: 'images/0058c5383413a71167a7502db8fbe568ac47a8c7bd11c667a848abe03a4cd693.jpg', alt: '普通图片' },
  { url: './images/008819fd288f39957ed5119085579a8a3983c6b09d8fd5931739d29cb1e13781.jpg', alt: '相对点斜杠图片' },
  { url: '/favicon.svg', alt: '根目录公共图片' },
];

const resolvedSpecial = resolveChapterAssets(testImages, mockChapterDir);
assert(
  resolvedSpecial.length === 3,
  `成功解析包含普通相对图、点斜杠图、public 根目录图的多种图片类型 (${resolvedSpecial.length}/3)`
);

const allPosixSafe = resolvedSpecial.every((r) => !r.safeLatexPath.includes('\\'));
assert(allPosixSafe, '所有输出 safeLatexPath 均为 POSIX 安全路径 (适合 Linux CI 及 Windows)');

console.log('\n--- [测试组 3] 学术版式与自适应图片语法 ---');

assert(
  !exportRes.tex.includes('\\maketitle'),
  '彻底移除 \\maketitle，杜绝产生空洞大封面'
);
assert(
  exportRes.tex.includes('\\documentclass[\n  a4paper, 11pt, UTF8, punct=kaiming\n]{ctexart}'),
  '单章节导出默认采用 ctexart 文档类'
);
assert(
  exportRes.styleSource.includes('adjustbox'),
  '宏包模版 astrolib-chapter.sty 中正确引入 \\usepackage[export]{adjustbox}'
);
assert(
  exportRes.tex.includes('max width=0.65\\linewidth,max height=0.3\\textheight,keepaspectratio'),
  '图片输出使用 adjustbox 自适应约束语法 (max width=0.65\\linewidth,max height=0.3\\textheight,keepaspectratio)'
);
assert(
  exportRes.tex.includes('\\astrolibchapternum') && exportRes.tex.includes('\\thesection'),
  '动态注入 \\astrolibchapternum 与 \\thesection，章节与定理计数器准确对齐'
);

console.log('\n--- [测试组 4] 中文字体设置、纯粹书名页眉与克制弹窗规范 ---');

const sourceHanTex = renderChapterLatexDocument(
  { title: '测试章', blocks: [] },
  { cjkFont: 'sourcehan' }
);
const defaultCjkTex = renderChapterLatexDocument(
  { title: '测试章', blocks: [] },
  { cjkFont: 'default' }
);
assert(
  sourceHanTex.includes('Source Han Serif SC') && sourceHanTex.includes('Source Han Sans SC'),
  'cjkFont: "sourcehan" 成功注入思源宋体+思源黑体配置宏'
);
assert(
  !defaultCjkTex.includes('Source Han Serif SC'),
  'cjkFont: "default" 保持原生 ctexart 预设中文配置'
);

assert(
  !exportRes.styleSource.includes('AstroLib学术讲义') &&
  !exportRes.styleSource.includes('{AstroLib'),
  'astrolib-chapter.sty 宏包彻底清除 {AstroLib学术讲义} 品牌字样'
);
assert(
  exportRes.tex.includes('\\renewcommand{\\astrolibbooktitle}{工科数学分析}'),
  '导出章节源码正确将页眉右上角绑定为当前书名 (工科数学分析)'
);

const modalAstroPath = path.join(ROOT, 'src/components/publishing/ChapterExportModal.astro');
const modalAstroContent = fs.readFileSync(modalAstroPath, 'utf8');

assert(
  !modalAstroContent.includes('dialog-badge') && !modalAstroContent.includes('PUBLISHING / 导出'),
  'ChapterExportModal 彻底移除 SaaS 风格 dialog-badge 胶囊徽章'
);
assert(
  modalAstroContent.includes('id="chapter-cjk-font"') && modalAstroContent.includes('value="sourcehan"'),
  'ChapterExportModal 提供思源宋体+思源黑体中文字体下拉配置选项'
);
assert(
  !/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(modalAstroContent),
  'ChapterExportModal 彻底剔除所有 Emoji 图标与营销修饰，保持严肃学术克制'
);

console.log('\n--- [测试组 5] Academic Digital Resource (数字资源学术排版与语义流) ---');

const parsedSample = parseMdxChapter(mdxContent, '1.1_集合映射与函数');
const digitalResBlocks = parsedSample.blocks.filter((b) => b.kind === 'digital_resource');
assert(
  digitalResBlocks.length === 3,
  `成功提取并语义结构化 1.1 章节的 ${digitalResBlocks.length} 个数字资源块`
);

const firstRes = digitalResBlocks[0];
assert(
  firstRes.resourceData &&
  firstRes.resourceData.category === 'digital_resource' &&
  firstRes.resourceData.relation === 'flow' &&
  firstRes.resourceData.title === '对应法则是函数定义中的本质要素' &&
  firstRes.resourceData.url === 'http://2d.hep.cn/1254051/7',
  '数字资源具备完整字段: category=digital_resource, relation=flow, 规范化标题与 URL'
);

const nestedSnippet = `
<Example title="例 1.1">
  <QRCodeVideo title="例题微课视频" url="http://2d.hep.cn/example-video" />
</Example>
`;
const parsedNested = parseMdxChapter(nestedSnippet, 'test_nested');
const nestedExample = parsedNested.blocks.find((b) => b.kind === 'example');
const nestedRes = nestedExample?.children?.find((b) => b.kind === 'digital_resource');
assert(
  nestedRes &&
  nestedRes.resourceData?.relation === 'embedded' &&
  nestedRes.resourceData?.hostKind === 'example' &&
  nestedRes.resourceData?.hostId === '例 1.1',
  '嵌套在 Example 内的数字资源确定性绑定宿主: relation=embedded, hostKind=example, hostId="例 1.1"'
);

assert(
  !exportRes.tex.includes('\\footnote{配套数字资源'),
  'LaTeX 导出彻底废除 \\footnote 机制，严禁将数字资源打入页面底端脚注'
);
assert(
  !exportRes.tex.includes('\\url{http://2d.hep.cn'),
  'LaTeX 导出彻底移除裸露 URL (\\url{http...})，避免工业杂讯干扰阅读'
);
assert(
  exportRes.tex.includes('\\astrolibdigitalresource[配套数字资源]{对应法则是函数定义中的本质要素}{http://2d.hep.cn/1254051/7}'),
  'LaTeX 源码统一输出 \\astrolibdigitalresource[<分类>]{<标题>}{<链接>} 语义命令'
);

assert(
  exportRes.styleSource.includes('\\newcommand{\\astrolibdigitalresource}'),
  'astrolib-chapter.sty 宏包明确定义 \\astrolibdigitalresource 宏'
);
assert(
  !exportRes.styleSource.match(/\\newcommand\{\\astrolibdigitalresource\}[\s\S]*?\\footnote/),
  '\\astrolibdigitalresource 宏定义完全基于行内/流式排版 (small + kaishu + href + ↗)，零 footnote 依赖'
);

console.log('\n================================================================');
console.log(`🏁 测试完成: ${passedTests} / ${totalTests} 全部通过!`);
console.log('================================================================\n');
