import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// 导入多合集配置和我们的自然排序侧边栏生成器
import { collections, siteConfig } from './src/config/collections.config.mjs';
import { generateBookSidebar } from './src/utils/sidebar.mjs';
// 公式源码回填插件：让每个 KaTeX 公式携带 data-latex 原始源码（供前端一键复制）
import { rehypeKatexAnnotate, rehypeKatexPromote } from './src/utils/rehype-katex-source.mjs';
// 构建期引用徽章下沉插件（方案 B）：把“例题 1.74 / 图 3-48 → badge”的匹配逻辑
// 从客户端 SPA 切换时扫描下沉到构建期，客户端切换零扫描（详见 docs/文章切换性能优化交接文档）
import { rehypeCrossRef } from './src/utils/rehype-cross-ref.mjs';

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
      // output: 'html' 去掉 MathML 重复标记，公式页 HTML 体积约减半；
      // strict/throwOnError 关闭保证 OCR 出的部分不严谨 LaTeX 不阻断构建。
      // rehypeKatexAnnotate / rehypeKatexPromote 夹在 rehype-katex 前后，
      // 把原始 LaTeX 源码写进成品公式的 data-latex 属性（供前端复制）。
      rehypePlugins: [
        rehypeKatexAnnotate,
        [rehypeKatex, { output: 'html', strict: false, throwOnError: false }],
        rehypeKatexPromote,
        // 方案 B：构建期徽章下沉，须在 KaTeX 相关插件之后执行（依赖公式结构已定型）。
        // refs 传 siteConfig.refs：'static' 时强制全部静态 chip（关闭同页联动）
        [rehypeCrossRef, { collections, refs: siteConfig.refs }],
      ],
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
        PageSidebar: './src/components/PageSidebarOverride.astro', // 右侧多合集自适应大纲与卡片修补
        ThemeSelect: './src/components/ThemeSelectOverride.astro', // VitePress 纯图标主题切换按钮
        Pagination: './src/components/PaginationOverride.astro', // 文章底部翻页 → VitePress pager 结构
      },
      sidebar: dynamicSidebar,
      customCss: [
        // KaTeX 基础样式必须先于 custom.css 加载：custom.css 里的
        // “.katex-display > .katex > .katex-html > .tag { position: static }”
        // 需要覆盖 KaTeX 默认的绝对定位（right:0），而两者同特异性、同层，
        // 谁后加载谁生效。若 katex.min.css 意外晚于 custom.css（历史上曾因
        // 移动端样式调整导致），公式末尾编号 (\tag) 会压回公式正文上。
        // 两个入口放同一 customCss 数组即保证打包顺序恒定：katex 先、custom 后。
        'katex/dist/katex.min.css',
        './src/styles/custom.css',
        // VitePress 风格覆盖层：把 Starlight 变量映射为 VitePress 色板。
        // 必须位于 custom.css 之后（优先级最高），删除即可整体回退。
        './src/styles/vitepress-theme.css',
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
