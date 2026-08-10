import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// 导入多合集配置和我们的自然排序侧边栏生成器
import { collections } from './src/config/collections.config.mjs';
import { generateBookSidebar } from './src/utils/sidebar.mjs';

// 根据中央图书配置，全自动生成自然排序的树状侧边栏
const dynamicSidebar = collections.map(col => ({
  label: col.title,
  collapsed: true,
  items: col.books.map(book => ({
    label: book.title,
    collapsed: true,
    // 调用生成器，就地读取目录并进行 1.1 -> 10.1 排序，取代鸡肋的默认 autogenerate
    items: generateBookSidebar(`src/content/docs/collections/${col.slug}/${book.slug}`)
  }))
}));

export default defineConfig({
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
  },
  integrations: [
    starlight({
      title: '教辅数字化智能智库',
      social: [
        { 
          icon: 'github', 
          label: 'GitHub', 
          href: 'https://github.com/withastro/starlight' 
        }
      ],
      components: {
        Sidebar: './src/components/SidebarOverride.astro',      // 左侧 LaTeX 公式渲染
        PageSidebar: './src/components/PageSidebarOverride.astro' // 右侧多合集自适应大纲与卡片修补
      },
      sidebar: dynamicSidebar,
      customCss: [
        './src/styles/custom.css',
      ],
    }),
  ],
  vite: {
    resolve: {
      alias: {
        '@': '/src',
      },
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