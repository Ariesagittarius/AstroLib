import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// 引入我们的中央多图书合集配置文件
import { collections } from './src/config/collections.config.mjs';

// 动态构建两级深度嵌套侧边栏 (合集 -> 图书)
const dynamicSidebar = collections.map(col => ({
  label: col.title,
  collapsed: true, // 初始折叠合集
  items: col.books.map(book => ({
    label: book.title,
    collapsed: true, // 初始折叠该合集下的图书
    items: [
      { autogenerate: { directory: `collections/${col.slug}/${book.slug}` } } // 解析对应物理嵌套目录
    ]
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
      title: 'MinerU + Astro',
      social: [
        { 
          icon: 'github', 
          label: 'GitHub', 
          href: 'https://github.com/withastro/starlight' 
        }
      ],
      components: {
        Sidebar: './src/components/SidebarOverride.astro',      // 左侧 LaTeX 公式渲染
        PageSidebar: './src/components/PageSidebarOverride.astro' // 右侧多合集自适应大纲
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
    // 核心新增：配置 Vite 6 开发服务器放行白名单，彻底解决穿透被 Block 的问题
    server: {
      allowedHosts: [
        '.trycloudflare.com', // 放行 Cloudflare 穿透
        '.vaiwan.com',        // 放行 钉钉穿透
        '.localtunnel.me'     // 放行 Localtunnel 穿透
      ]
    }
  },
});