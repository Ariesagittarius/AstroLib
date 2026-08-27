import { defineConfig, passthroughImageService } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// 导入多合集配置和我们的自然排序侧边栏生成器
import { collections } from './src/config/collections.config.mjs';
import { generateBookSidebar } from './src/utils/sidebar.mjs';
// 全站功能注册表：统一声明各功能 enabled/devOnly/ui，并动态装配下方配置。
// 关闭某功能即从构建产物中彻底移除（插件/CSS/组件/生成脚本），实现性能最大化。
import { features, isEffective, crossRefRefs } from './src/config/features.config.mjs';
// 公式源码回填插件：让每个 KaTeX 公式携带 data-latex 原始源码（供前端一键复制）
import { rehypeKatexAnnotate, rehypeKatexPromote } from './src/utils/rehype-katex-source.mjs';
// 构建期引用徽章下沉插件（方案 B）：把“例题 1.74 / 图 3-48 → badge”的匹配逻辑
// 从客户端 SPA 切换时扫描下沉到构建期，客户端切换零扫描（详见 docs/文章切换性能优化交接文档）
import { rehypeCrossRef } from './src/utils/rehype-cross-ref.mjs';
// 在线可视化精修工具：源码位置注入（仅 dev 启用，见 M1 设计）
import rehypeEditorAnnotate from './src/utils/rehype-editor-annotate.mjs';
// 在线可视化精修工具：/__edit__/* 写回端点（Vite dev server 插件，仅 dev 启用）。
// 不用 Astro middleware：dev 下 /__edit__/* 会匹配到 prerendered 路由，Astro 构造
// Request 时清空 query、丢弃 body（见 dev-server-plugin.mjs 头部说明）。
import devEditServerPlugin from './src/utils/mdx-editor/dev-server-plugin.mjs';
// 书籍模块巡检与查重工具：/__inspector__/* 扫描端点（Vite dev server 插件，仅 dev 启用）
import devInspectorServerPlugin from './src/utils/module-inspector/dev-server-plugin.mjs';
// 章节内联关系图谱：/__relation_graph__/* 实时端点（Vite dev server 插件，仅 dev 启用）
import devRelationGraphServerPlugin from './src/utils/relation-graph/dev-server-plugin.mjs';
// Mermaid 图表拦截插件：将 ```mermaid 代码块转化为 .mermaid-container DOM
import rehypeMermaid from './src/utils/rehype-mermaid.mjs';
// 图像高斯模糊占位插件：为正文图片在构建期生成微型 LQIP Base64 占位并平滑渐显
import rehypeImageBlur from './src/utils/rehype-image-blur.mjs';

// 项目开发文档侧边栏
const devDocsSidebarGroup = {
  label: '项目开发文档',
  collapsed: false,
  items: [
    { label: '开发文档首页', link: '/dev/' },
    {
      label: '快速入门',
      collapsed: false,
      items: [
        { label: '项目总览', link: '/dev/getting-started/overview/' },
        { label: '环境准备与命令', link: '/dev/getting-started/setup/' },
        { label: '目录结构说明', link: '/dev/getting-started/layout/' },
      ]
    },
    {
      label: '核心架构与配置',
      collapsed: false,
      items: [
        { label: '中央图书配置', link: '/dev/architecture/collections-config/' },
        { label: '全站功能开关 (Registry)', link: '/dev/architecture/feature-registry/' },
        { label: 'VitePress 主题与 CSS', link: '/dev/architecture/theme-system/' },
      ]
    },
    {
      label: '内容撰写与组件规范',
      collapsed: false,
      items: [
        { label: 'MDX 与 KaTeX 规范', link: '/dev/authoring/mdx-guide/' },
        { label: '教辅结构化卡片组件库', link: '/dev/authoring/card-components/' },
      ]
    },
    {
      label: '导入与导出流程',
      collapsed: false,
      items: [
        { label: 'MinerU OCR 到 MDX 导入', link: '/dev/workflow/import-book/' },
        { label: 'EPUB 导出管线', link: '/dev/workflow/epub-export/' },
      ]
    },
    {
      label: '开发者工具与 AI 系统',
      collapsed: false,
      items: [
        { label: '可视化精修与巡检工具', link: '/dev/tools/editor-inspector/' },
        { label: 'AI 书内问答 (RAG)', link: '/dev/tools/ai-rag/' },
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
      items: generateBookSidebar(`src/content/docs/collections/${col.slug}/${book.slug}`)
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
  rehypePlugins.push(
    rehypeKatexAnnotate,
    [rehypeKatex, { output: 'html', strict: false, throwOnError: false }],
    rehypeKatexPromote,
  );
}
if (features.crossRef.enabled) {
  // 方案 B：构建期徽章下沉，须在 KaTeX 相关插件之后执行（依赖公式结构已定型）。
  // refs 取 features.crossRef.config.refs：'static' 时强制全部静态 chip（关闭同页联动）
  rehypePlugins.push([rehypeCrossRef, { collections, refs: crossRefRefs() }]);
}
if (isEffective('editor') || isEffective('feedback')) {
  // 源码位置注入（用于在线精修与读者段落级勘误定位）
  rehypePlugins.push(rehypeEditorAnnotate);
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
customCss.push('./src/styles/custom.css');
if (features.theme.enabled) customCss.push('./src/styles/vitepress-theme.css');
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
  Header: './src/components/HeaderOverride.astro',        // VitePress 风格紧凑顶栏（Logo/Search/Links/VPSwitch/Dividers）
  Sidebar: './src/components/SidebarOverride.astro',      // 左侧 LaTeX 公式渲染
  PageSidebar: './src/components/PageSidebarOverride.astro', // 右侧多合集自适应大纲与卡片修补
  Pagination: './src/components/PaginationOverride.astro', // 文章底部翻页 → VitePress pager 结构
  Footer: './src/components/FooterOverride.astro', // 底部：原翻页/编辑链接 + 在线精修工具壳（仅 dev）
};
if (features.theme.enabled) {
  componentOverrides.ThemeSelect = './src/components/ThemeSelectOverride.astro'; // VitePress 纯图标主题切换按钮
}

export default defineConfig({
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
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/withastro/starlight'
        }
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
