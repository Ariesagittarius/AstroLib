import { defineConfig, passthroughImageService } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// 导入多合集配置和我们的自然排序侧边栏生成器
import { collections } from './src/config/collections.config.mjs';
import { generateStarlightBookSidebar } from './src/server/adapters/starlight-sidebar.mjs';

import { features, isEffective, crossRefRefs, IS_DEV } from './src/config/features.config.mjs';

// 公式源码回填插件：让每个 KaTeX 公式携带 data-latex 原始源码（供前端一键复制）
import { rehypeKatexAnnotate, rehypeKatexPromote } from './src/plugins/rehype/rehype-katex-source.mjs';
// 数学变量智能提升插件：构建期提升正文漏网单字母变量与简式为 KaTeX 公式
import rehypeMathPromote from './src/plugins/rehype/rehype-math-promote.mjs';
// 构建期引用徽章下沉插件（方案 B）：把“例题 1.74 / 图 3-48 → badge”的匹配逻辑
// 从客户端 SPA 切换时扫描下沉到构建期，客户端切换零扫描（详见 docs/文章切换性能优化交接文档）
import { rehypeCrossRef } from './src/plugins/rehype/rehype-cross-ref.mjs';
// 在线可视化精修工具：源码位置注入（仅 dev 启用，见 M1 设计）
import rehypeEditorAnnotate from './src/plugins/rehype/rehype-editor-annotate.mjs';
// 在线可视化精修工具：/__edit__/* 写回端点（Vite dev server 插件，仅 dev 启用）。
// 不用 Astro middleware：dev 下 /__edit__/* 会匹配到 prerendered 路由，Astro 构造
// Request 时清空 query、丢弃 body（见 dev-server-plugin.mjs 头部说明）。
import devEditServerPlugin from './src/features/mdx-editor/server/dev-server-plugin.mjs';
// 书籍模块巡检与查重工具：/__inspector__/* 扫描端点（Vite dev server 插件，仅 dev 启用）
import devInspectorServerPlugin from './src/server/plugins/module-inspector/dev-server-plugin.mjs';
// 章节内联关系图谱：/__relation_graph__/* 实时端点（Vite dev server 插件，仅 dev 启用）
import devRelationGraphServerPlugin from './src/server/plugins/relation-graph/dev-server-plugin.mjs';
// 章节 LaTeX / PDF 导出：/__chapter_export__/* 实时端点（Vite dev server 插件，仅 dev 启用）
import devChapterExportServerPlugin from './src/server/plugins/chapter-export/dev-server-plugin.mjs';
// 习题模块：/api/exercise/* 源码热保存、读者反馈与社区题解端点（Vite dev server 插件，仅 dev 启用）
import { exerciseDevServerPlugin } from './src/server/plugins/exercise-editor/dev-server-plugin.mjs';
// Gemini AI 中继模块：/api/proxy/gemini/* 本地 Node.js 进程全双工反代端点（Vite dev server 插件，仅 dev 启用）
import { geminiProxyDevServerPlugin } from './src/server/plugins/gemini-proxy/dev-server-plugin.mjs';
// Mermaid 图表拦截插件：将 ```mermaid 代码块转化为 .mermaid-container DOM
import rehypeMermaid from './src/plugins/rehype/rehype-mermaid.mjs';
// 图像高斯模糊占位插件：为正文图片在构建期生成微型 LQIP Base64 占位并平滑渐显
import rehypeImageBlur from './src/plugins/rehype/rehype-image-blur.mjs';
// 中文学术标点规范化与呼吸间距自愈插件：智能修复 MinerU 识别的半角标点与句间间距
import rehypeCjkPunctuation from './src/plugins/rehype/rehype-cjk-punctuation.mjs';

// 项目开发文档侧边栏
const devDocsSidebarGroup = {
  label: '项目开发文档',
  collapsed: false,
  items: [
    { label: '开发文档首页', link: '/dev/' },
    {
      label: '概览',
      collapsed: false,
      items: [
        { label: '项目架构与能力', link: '/dev/overview/' },
      ]
    },
    {
      label: '快速入门',
      collapsed: false,
      items: [
        { label: '部署、运行与环境变量', link: '/dev/getting-started/setup/' },
        { label: '脚本索引与常用命令', link: '/dev/getting-started/scripts/' },
        { label: '添加一本新书', link: '/dev/getting-started/add-book/' },
        { label: '加入一本习题册', link: '/dev/getting-started/add-exercises/' },
      ]
    },
    {
      label: '贡献',
      collapsed: false,
      items: [
        { label: '贡献新的书籍', link: '/dev/contributing/book/' },
        { label: '提交勘误', link: '/dev/contributing/errata/' },
        { label: '贡献 AI 答案', link: '/dev/contributing/ai-answer/' },
      ]
    },
    {
      label: '附加文档',
      collapsed: false,
      items: [
        { label: '配置 AI 问答 API Key', link: '/dev/appendix/ai-api-key/' },
        { label: '文章提示条与 Wiki 标签', link: '/dev/appendix/wiki-notices/' },
        { label: '内容、版权与故障排查', link: '/dev/appendix/notes/' },
      ]
    }
  ]
};

// 根据中央图书配置，全自动生成自然排序的树状侧边栏
const dynamicSidebar = [
  devDocsSidebarGroup,
  ...collections.map(col => ({
    label: col.title,
    collapsed: true,
    items: col.books.map(book => ({
      label: book.title,
      collapsed: true,
      // 调用生成器，就地读取目录并进行 1.1 -> 10.1 排序，取代鸡肋的默认 autogenerate
      items: generateStarlightBookSidebar(`src/content/docs/collections/${col.slug}/${book.slug}`)
    }))
  }))
];

/* ---------------------------------------------------------------------------
 * 通用装配辅助：按功能开关拼装 Starlight 配置
 *   · 功能关闭（features.<id>.enabled = false）→ 对应插件/CSS/组件不进入产物
 *   · 关键注释保留，避免后续改回（性能约束见 astro-project-guide / 交接文档）
 * ------------------------------------------------------------------------- */

// remark 插件（KaTeX）：关闭则 $..$ 不做数学处理
const remarkPlugins = [];
if (features.katex.enabled) remarkPlugins.push(remarkMath);

// rehype 插件（顺序至关重要）：katex 相关需“前后夹住” rehype-katex
const rehypePlugins = [];
if (features.katex.enabled) {
  // output: 'html' 去掉 MathML 重复标记，公式页 HTML 体积约减半；
  // strict/throwOnError 关闭保证 OCR 出的部分不严谨 LaTeX 不阻断构建。
  // rehypeKatexAnnotate / rehypeKatexPromote 夹在 rehype-katex 前后，
  // 把原始 LaTeX 源码写进成品公式的 data-latex 属性（供前端复制）。
  const katexGroup = [];
  if (features.mathPromote?.enabled) {
    katexGroup.push(rehypeMathPromote);
  }
  katexGroup.push(
    rehypeKatexAnnotate,
    [rehypeKatex, { output: 'html', strict: false, throwOnError: false }],
    rehypeKatexPromote,
  );
  rehypePlugins.push(...katexGroup);
}
if (features.cjkPunctuation?.enabled) {
  // 学术出版标点与呼吸间距自愈（在 KaTeX 完成公式渲染后执行，确保精准跳过公式内部与代码块）
  rehypePlugins.push(rehypeCjkPunctuation);
}
if (features.crossRef.enabled) {
  // 方案 B：构建期徽章下沉，须在 KaTeX 相关插件之后执行（依赖公式结构已定型）。
  // refs 取 features.crossRef.config.refs：'static' 时强制全部静态 chip（关闭同页联动）
  rehypePlugins.push([rehypeCrossRef, { collections, refs: crossRefRefs() }]);
}
if (isEffective('editor') || isEffective('feedback')) {
  // 源码位置注入（用于在线精修与读者段落级勘误定位；生产环境轻量化注入）
  rehypePlugins.push([rehypeEditorAnnotate, { isDev: IS_DEV }]);
}

if (features.mermaid.enabled) {
  // Mermaid 图表代码块拦截
  rehypePlugins.push(rehypeMermaid);
}
if (features.imageBlur.enabled) {
  // 正文图像高斯模糊占位与尺寸防抖动
  rehypePlugins.push(rehypeImageBlur);
}

// customCss 顺序很重要（同特异性、同层，后加载者生效）：
//   katex 基础样式必须先于 custom.css（后者覆盖 .katex .tag 定位）；
//   vitepress-theme 色板须在 custom.css 之后（优先级最高），删除即整体回退；
//   fonts.css 必须最后加载，才能覆盖 vitepress-theme 里对 --sl-font 的默认定义；
//   关闭某功能即不引入对应 CSS（如关闭 fonts 则不打包 @fontsource 与 fonts.css）。
const customCss = [];
if (features.katex.enabled) customCss.push('katex/dist/katex.min.css');
customCss.push('./src/styles/tokens/layers.css');
customCss.push('./src/styles/custom.css');
if (features.theme.enabled) {
  customCss.push('./src/styles/vitepress-theme.css');
  customCss.push('./src/themes/material-you/theme.css');
}
if (features.fonts.enabled) {
  // 自托管思源 webfont 与 Plus Jakarta Sans 品牌英文字体由 registry 引入（index.css 含全部 unicode-range 切片）。
  // 默认系统档位浏览器不会下载任何 woff2（未 use 的 @font-face 不请求），零下载。
  customCss.push('@fontsource-variable/noto-sans-sc/index.css');
  customCss.push('@fontsource-variable/noto-serif-sc/index.css');
  customCss.push('@fontsource-variable/plus-jakarta-sans/index.css');
  customCss.push('./src/styles/fonts.css');
}

// 组件覆盖：仅主题切换按开关装配（其余为自定义骨架/性能优化，恒用）
const componentOverrides = {
  Header: './src/components/HeaderOverride.astro',        // 紧凑学术顶栏（Logo/Search/Links/ThemeSelect/Dividers）
  Sidebar: './src/components/SidebarOverride.astro',      // 左侧 LaTeX 公式渲染
  PageSidebar: './src/components/PageSidebarOverride.astro', // 右侧多合集自适应大纲与卡片修补
  Pagination: './src/components/PaginationOverride.astro', // 文章底部翻页卡片（M3 Filled Tonal Pagers）
  Footer: './src/components/FooterOverride.astro', // 底部：原翻页/编辑链接 + 在线精修工具壳（仅 dev）
  PageFrame: './src/components/PageFrameOverride.astro', // 顶层骨架覆盖：注入全站统一视窗挂载容器 (#astro-overlay-root)
  PageTitle: './src/components/PageTitleOverride.astro', // 页面大标题 H1 构建期数学公式转译（零客户端 KaTeX）
  SocialIcons: './src/components/SocialIconsOverride.astro', // 顶栏 GitHub 社交入口：覆盖默认黑底硬币圆盘，使用官方净标
  TwoColumnContent: './src/components/TwoColumnContentOverride.astro', // 正文两栏布局覆盖：在正文卡片上方挂载 NoticeFramework
  Head: './src/components/HeadOverride.astro', // 全站 SEO 增强：智能 Title 补齐书名、Description 自动合成、Schema.org 与站长验证
  MarkdownContent: './src/components/MarkdownContentOverride.astro', // 正文语义增强：包裹为 <article role="article"> 赋能 Chrome 朗读/阅读模式
};
if (features.theme.enabled) {
  componentOverrides.ThemeSelect = './src/components/ThemeSelectOverride.astro'; // 顶栏外观与主题切换按钮
}

export default defineConfig({
  // 规范站点根域名：供 Canonical 链接、Sitemap 与 OpenGraph 绝对路径生成
  site: features.seo?.config?.siteUrl || 'https://astrolib.cloud',
  // 彻底关闭 Starlight/Astro 默认隐式启用的全量链接悬停预取
  // 页面预取与内存缓存完全由 AstroLib 自研 SPA 路由引擎与用户偏好设置精准接管
  prefetch: false,
  image: {
    service: passthroughImageService(),
  },
  markdown: {
    processor: unified({
      remarkPlugins,
      rehypePlugins,
    }),
  },
  integrations: [
    starlight({
      title: 'AstroLib',
      description: features.seo?.config?.defaultDescription || '大学理工科教材与学术资料数字化阅读与自测系统',
      defaultLocale: 'root',
      locales: {
        root: {
          label: '简体中文',
          lang: 'zh-CN',
        },
      },
      favicon: '/favicon.png',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/Ariesagittarius/AstroLib',
        },
      ],
      components: componentOverrides,
      sidebar: dynamicSidebar,
      customCss,
    }),
  ],
  vite: {
    plugins: [
      // 精修工具写回端点：仅 dev + editor 启用时注册（生产构建不加载，零污染）
      ...(isEffective('editor') ? [devEditServerPlugin()] : []),
      // 模块巡检与查重端点：仅 dev + inspector 启用时注册（生产构建不加载，零污染）
      ...(isEffective('inspector') ? [devInspectorServerPlugin()] : []),
      // 章节内联关系图谱端点：仅 dev + relationGraph 启用时注册（生产构建不加载，零污染）
      ...(isEffective('relationGraph') ? [devRelationGraphServerPlugin()] : []),
      // 章节 LaTeX / PDF 导出端点：仅 dev + chapterExport 启用时注册（生产构建不加载，零污染）
      ...(isEffective('chapterExport') ? [devChapterExportServerPlugin()] : []),
      // 习题模块本地 API 与源码持久化端点（仅 dev 启用）
      exerciseDevServerPlugin(),
      // Gemini AI 本地 Node.js 进程全双工中继反代端点（仅 dev 启用）
      geminiProxyDevServerPlugin(),
    ],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    optimizeDeps: {
      include: ['mermaid'],
    },
    ssr: {
      noExternal: ['mermaid'],
    },
    server: {
      allowedHosts: [
        '.trycloudflare.com',
        '.vaiwan.com',
        '.localtunnel.me'
      ]
    }
  },
});
