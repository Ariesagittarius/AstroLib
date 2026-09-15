import { defineConfig, passthroughImageService } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import { collections } from './src/config/collections.config.mjs';
import { generateStarlightBookSidebar } from './src/server/adapters/starlight-sidebar.mjs';

import { features, isEffective, crossRefRefs } from './src/config/features.config.mjs';

import { rehypeKatexAnnotate, rehypeKatexPromote } from './src/plugins/rehype/rehype-katex-source.mjs';

import rehypeMathPromote from './src/plugins/rehype/rehype-math-promote.mjs';

import { rehypeCrossRef } from './src/plugins/rehype/rehype-cross-ref.mjs';

import rehypeEditorAnnotate from './src/plugins/rehype/rehype-editor-annotate.mjs';

import devEditServerPlugin from './src/features/mdx-editor/server/dev-server-plugin.mjs';

import devInspectorServerPlugin from './src/server/plugins/module-inspector/dev-server-plugin.mjs';

import devRelationGraphServerPlugin from './src/server/plugins/relation-graph/dev-server-plugin.mjs';

import devChapterExportServerPlugin from './src/server/plugins/chapter-export/dev-server-plugin.mjs';

import { exerciseDevServerPlugin } from './src/server/plugins/exercise-editor/dev-server-plugin.mjs';

import { geminiProxyDevServerPlugin } from './src/server/plugins/gemini-proxy/dev-server-plugin.mjs';

import rehypeMermaid from './src/plugins/rehype/rehype-mermaid.mjs';

import rehypeImageBlur from './src/plugins/rehype/rehype-image-blur.mjs';

import rehypeCjkPunctuation from './src/plugins/rehype/rehype-cjk-punctuation.mjs';

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

const dynamicSidebar = [
  devDocsSidebarGroup,
  ...collections.map(col => ({
    label: col.title,
    collapsed: true,
    items: col.books.map(book => ({
      label: book.title,
      collapsed: true,

      items: generateStarlightBookSidebar(`src/content/docs/collections/${col.slug}/${book.slug}`)
    }))
  }))
];

const remarkPlugins = [];
if (features.katex.enabled) remarkPlugins.push(remarkMath);

const rehypePlugins = [];
if (features.katex.enabled) {

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

  rehypePlugins.push(rehypeCjkPunctuation);
}
if (features.crossRef.enabled) {

  rehypePlugins.push([rehypeCrossRef, { collections, refs: crossRefRefs() }]);
}
if (isEffective('editor') || isEffective('feedback')) {

  rehypePlugins.push(rehypeEditorAnnotate);
}
if (features.mermaid.enabled) {

  rehypePlugins.push(rehypeMermaid);
}
if (features.imageBlur.enabled) {

  rehypePlugins.push(rehypeImageBlur);
}

const customCss = [];
if (features.katex.enabled) customCss.push('katex/dist/katex.min.css');
customCss.push('./src/styles/tokens/layers.css');
customCss.push('./src/styles/custom.css');
if (features.theme.enabled) {
  customCss.push('./src/styles/vitepress-theme.css');
  customCss.push('./src/themes/material-you/theme.css');
}
if (features.fonts.enabled) {

  customCss.push('@fontsource-variable/noto-sans-sc/index.css');
  customCss.push('@fontsource-variable/noto-serif-sc/index.css');
  customCss.push('@fontsource-variable/plus-jakarta-sans/index.css');
  customCss.push('./src/styles/fonts.css');
}

const componentOverrides = {
  Header: './src/components/HeaderOverride.astro',
  Sidebar: './src/components/SidebarOverride.astro',
  PageSidebar: './src/components/PageSidebarOverride.astro',
  Pagination: './src/components/PaginationOverride.astro',
  Footer: './src/components/FooterOverride.astro',
  PageFrame: './src/components/PageFrameOverride.astro',
  PageTitle: './src/components/PageTitleOverride.astro',
  SocialIcons: './src/components/SocialIconsOverride.astro',
  TwoColumnContent: './src/components/TwoColumnContentOverride.astro',
  Head: './src/components/HeadOverride.astro',
};
if (features.theme.enabled) {
  componentOverrides.ThemeSelect = './src/components/ThemeSelectOverride.astro';
}

export default defineConfig({

  site: features.seo?.config?.siteUrl || 'https://astrolib.cloud',

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

      ...(isEffective('editor') ? [devEditServerPlugin()] : []),

      ...(isEffective('inspector') ? [devInspectorServerPlugin()] : []),

      ...(isEffective('relationGraph') ? [devRelationGraphServerPlugin()] : []),

      ...(isEffective('chapterExport') ? [devChapterExportServerPlugin()] : []),

      exerciseDevServerPlugin(),

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
