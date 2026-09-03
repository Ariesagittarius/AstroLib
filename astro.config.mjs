import { defineConfig, passthroughImageService } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import { collections } from './src/config/collections.config.mjs';
import { generateBookSidebar } from './src/utils/sidebar.mjs';

import { features, isEffective, crossRefRefs } from './src/config/features.config.mjs';

import { rehypeKatexAnnotate, rehypeKatexPromote } from './src/utils/rehype-katex-source.mjs';

import rehypeMathPromote from './src/utils/rehype-math-promote.mjs';

import { rehypeCrossRef } from './src/utils/rehype-cross-ref.mjs';

import rehypeEditorAnnotate from './src/utils/rehype-editor-annotate.mjs';

import devEditServerPlugin from './src/utils/mdx-editor/dev-server-plugin.mjs';

import devInspectorServerPlugin from './src/utils/module-inspector/dev-server-plugin.mjs';

import devRelationGraphServerPlugin from './src/utils/relation-graph/dev-server-plugin.mjs';

import { exerciseDevServerPlugin } from './src/utils/exercise-editor/dev-server-plugin.mjs';

import rehypeMermaid from './src/utils/rehype-mermaid.mjs';

import rehypeImageBlur from './src/utils/rehype-image-blur.mjs';

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

const dynamicSidebar = [
  devDocsSidebarGroup,
  ...collections.map(col => ({
    label: col.title,
    collapsed: true,
    items: col.books.map(book => ({
      label: book.title,
      collapsed: true,

      items: generateBookSidebar(`src/content/docs/collections/${col.slug}/${book.slug}`)
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
customCss.push('./src/styles/custom.css');
if (features.theme.enabled) customCss.push('./src/styles/vitepress-theme.css');
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
};
if (features.theme.enabled) {
  componentOverrides.ThemeSelect = './src/components/ThemeSelectOverride.astro';
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

      ...(isEffective('editor') ? [devEditServerPlugin()] : []),

      ...(isEffective('inspector') ? [devInspectorServerPlugin()] : []),

      ...(isEffective('relationGraph') ? [devRelationGraphServerPlugin()] : []),

      exerciseDevServerPlugin(),
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
