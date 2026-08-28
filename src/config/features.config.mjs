/**
 * ============================================================================
 * 特性模块（Feature Modules）注册表 —— 全站功能的唯一声明源
 * ============================================================================
 *
 * 背景：本项目把「自定义功能」散落在 astro.config.mjs、组件、配置与脚本里，
 * 开关判断（IS_DEV、refs、是否渲染组件、是否引入 webfont）没有统一入口，
 * 想「只保留某几个功能、干掉其余的」要改多处，也无法保证「未启用功能零打包」。
 *
 * 本文件把全站功能收敛成一张表：每个功能是一个 manifest（见 defineFeature）。
 *   · astro.config.mjs 读取它，按启用状态【动态组装】Starlight 配置
 *     （customCss / components / rehype 插件 / vite 插件 / 生成脚本）；
 *   · .astro 组件在 frontmatter 读取它，按启用状态决定是否渲染对应控件；
 *   · scripts/generate-epub.mjs 读取它，未启用 EPUB 则跳过生成。
 *
 * 由此实现两个层面的「按需选择」：
 *   · 【构建层（开发者）】改 enabled 即可启停功能；未启用功能不挂载插件、
 *     不引入 CSS、不渲染组件、不生成产物 → 性能最大化；
 *   · 【UI 层（读者）】ui:true 的功能由现有控件随开关呈现（字体下拉/主题按钮/
 *     EPUB 入口），读者按需使用，未选中的档位零下载（见 fonts.css）。
 *
 * 后期开发个人插件：新增一个功能只需在此追加一个 defineFeature({...})，
 * 并把它的「构建挂载点 + UI 渲染点」接到对应装配处（see docs/特性模块与插件系统.md）。
 *
 * 注意：本模块被 astro.config.mjs（Node 构建期）、.astro 组件（Astro 构建期）
 * 与 Node 脚本共同 import，必须是【纯 ESM、无 Node API 之外副作用】的模块；
 * 对 process 的访问需用 typeof 守卫（见 IS_DEV）。
 * ============================================================================
 */

/** 是否 dev 模式（astro dev）：决定 devOnly 功能的真正启用 */
export const IS_DEV = typeof process !== 'undefined' && !!process.argv?.includes('dev');

/** 允许的功能分类：reader（读者偏好）/ extra（附加内容）/ dev（开发工具） */
const CATS = new Set(['reader', 'extra', 'dev']);

/** refs 允许值：interactive（可点/跨页联动）| static（统一静态 chip，页面更小） */
const REFS = new Set(['interactive', 'static']);

/**
 * defineFeature：定义并校验一个功能 manifest，返回带默认值的读准备对象。
 *
 * schema：
 *   id        string   功能唯一 id（与表中键一致）
 *   cat       'reader'|'extra'|'dev'   分类
 *   label     string   显示名
 *   desc      string   一句话说明
 *   enabled   boolean  构建层默认开关（false → 该功能零打包/零注入）
 *   devOnly   boolean  是否仅 dev 生效（如在线精修工具）：有效启用 = enabled && IS_DEV
 *   ui        boolean  是否在 UI 层向读者暴露（决定控件是否渲染）
 *   requires? string[] 依赖的其他功能 id（元信息；级联由装配处/组件条件渲染体现）
 *   config?   object   该功能的构建参数（如 crossRef 的 refs）
 *
 * 仅做读取期校验：抛出清晰错误便于开发者定位，不承载运行逻辑。
 */
export function defineFeature(def) {
  const d = def || {};
  if (!d.id || typeof d.id !== 'string') throw new Error('[features] 缺少 string 类型的 id');
  if (!CATS.has(d.cat)) throw new Error(`[features] ${d.id} 的 cat 非法：${d.cat}（允许 reader/extra/dev）`);
  if (typeof d.enabled !== 'boolean') throw new Error(`[features] ${d.id} 缺少 boolean 类型的 enabled`);
  if (typeof d.devOnly !== 'boolean') throw new Error(`[features] ${d.id} 缺少 boolean 类型的 devOnly`);
  if (typeof d.ui !== 'boolean') throw new Error(`[features] ${d.id} 缺少 boolean 类型的 ui`);
  if (d.config?.refs && !REFS.has(d.config.refs)) {
    throw new Error(`[features] ${d.id} 的 refs 非法：${d.config.refs}（允许 interactive/static）`);
  }
  return {
    id: d.id,
    cat: d.cat,
    label: d.label || d.id,
    desc: d.desc || '',
    enabled: d.enabled,
    devOnly: d.devOnly,
    ui: d.ui,
    ...(d.requires ? { requires: d.requires } : {}),
    ...(d.config ? { config: d.config } : {}),
  };
}

/* ---------------------------------------------------------------------------
 * 功能定义表 —— 全站功能的唯一声明源
 * ---------------------------------------------------------------------------
 * 修改某功能的 enabled 即可在【构建层】启停它；对照各功能的「装配处」：
 *   katex     → astro.config.mjs markdown 插件 + customCss(katex.css)
 *   theme     → astro.config.mjs components.ThemeSelect + vitepress-theme.css
 *   fonts     → astro.config.mjs customCss(@fontsource + fonts.css)；组件内条件渲染
 *   crossRef  → astro.config.mjs rehypeCrossRef 插件 + PageSidebarOverride 读 refs
 *   epub      → scripts/generate-epub.mjs 生成 + SidebarOverride/index 下载入口
 *   editor    → astro.config.mjs rehype-editor + vite 插件（devOnly）；FooterOverride 渲染壳
 * ------------------------------------------------------------------------- */
const featureDefs = {
  // KaTeX 公式：基础能力（排版 + data-latex 源码回填）；几乎恒开
  katex: defineFeature({
    id: 'katex',
    cat: 'reader',
    label: 'KaTeX 公式',
    desc: '公式排版与源码回填（data-latex）',
    enabled: true,
    devOnly: false,
    ui: false,
  }),

  // 公式操作与导出：正文公式快捷复制 LaTeX 源码与导出高清 SVG/PNG 图片
  formulaActions: defineFeature({
    id: 'formulaActions',
    cat: 'reader',
    label: '公式操作与导出',
    desc: '正文公式快捷复制 LaTeX 源码与一键导出高清 SVG/PNG 图片',
    enabled: true,
    devOnly: false,
    ui: true,
    requires: ['katex'],
  }),

  // 主题切换：亮/暗主题切换 + UI 风格主题切换（VitePress / Starlight）
  theme: defineFeature({
    id: 'theme',
    cat: 'reader',
    label: '主题切换',
    desc: '亮/暗模式与 UI 风格主题切换（VitePress / Starlight）',
    enabled: true,
    devOnly: false,
    ui: true,
  }),

  // 字体系统：读者可选字体档位 + 自托管思源 webfont；依赖主题（按钮嵌在主题旁）
  fonts: defineFeature({
    id: 'fonts',
    cat: 'reader',
    label: '字体系统',
    desc: '读者可选字体档位 + 自托管思源 webfont',
    enabled: true,
    devOnly: false,
    ui: true,
    requires: ['theme'],
  }),

  // 引用联动：正文「例题 1.74 / 图 3-48」徽章；开启可点击跨页/同页联动
  crossRef: defineFeature({
    id: 'crossRef',
    cat: 'reader',
    label: '引用联动',
    desc: '正文引用徽章（interactive 联动 | static 纯静态 chip）',
    enabled: true,
    devOnly: false,
    ui: true,
    config: { refs: 'interactive' },
  }),

  // 图像高斯模糊占位：正文相对路径图片构建期生成 LQIP 占位（构建消耗大，生产默认关闭）
  imageBlur: defineFeature({
    id: 'imageBlur',
    cat: 'reader',
    label: '图像模糊占位',
    desc: '正文图片构建期生成 LQIP 高斯模糊占位并平滑渐变加载',
    enabled: false,
    devOnly: false,
    ui: false,
  }),

  // 章节内联关系图谱：全书章节/模块间引用关系拓扑与思维导图可视化（基于 ECharts）
  relationGraph: defineFeature({
    id: 'relationGraph',
    cat: 'extra',
    label: '章节关系图谱',
    desc: '全书章节内联引用拓扑图与知识导图（ECharts 可视化）',
    enabled: true,
    devOnly: false,
    ui: true,
  }),

  // Mermaid 图表：MDX 代码块及 <Mermaid> 组件渲染 Sequence/Flowchart 流程图
  mermaid: defineFeature({
    id: 'mermaid',
    cat: 'extra',
    label: 'Mermaid 图表',
    desc: 'MDX 代码块及 `<Mermaid>` 组件渲染 Sequence/Flowchart 流程图',
    enabled: true,
    devOnly: false,
    ui: true,
  }),

  // EPUB 下载：构建期探测本地 public/epub/<slug>.epub，或回退至 GitHub Release 远程下载
  epub: defineFeature({
    id: 'epub',
    cat: 'extra',
    label: 'EPUB 下载',
    desc: '全书离线 EPUB 下载（支持本地生成与 GitHub Releases 托管）',
    enabled: true,
    devOnly: false,
    ui: true,
    config: {
      releaseBaseUrl: 'https://github.com/Ariesagittarius/AstroLib/releases/latest/download',
    },
  }),

  // 在线精修工具：dev 下点击渲染页可视化改 MDX 并写回；生产零污染
  editor: defineFeature({
    id: 'editor',
    cat: 'dev',
    label: '在线精修工具',
    desc: 'dev 下点渲染页改 MDX 并写回（dev-only）',
    enabled: true,
    devOnly: true,
    ui: false,
  }),

  // 书籍模块巡检与速查工具：查看/搜索全书卡片模块、全书重名聚合与定位（同章冲突与结构审查仅开发期可见）
  inspector: defineFeature({
    id: 'inspector',
    cat: 'extra',
    label: '模块索引与速查',
    desc: '全书卡片模块索引速查、分类筛选与跨章检索定位（同章冲突与结构审查仅开发期可见）',
    enabled: true,
    devOnly: false,
    ui: true,
  }),

  // AI 书内智能问答：以“当前书”为知识库的检索 + 提问（RAG）。
  //   · 构建期：scripts/build-ai-index.mjs 把每本书的内容切成语义片段（卡片/标题），
  //     写成 public/ai-index/<col>-<book>.json（懒加载、按书隔离）。
  //   · 运行期：客户端对该书索引做 keyword/hybrid 检索，只取 topK 片段送入生成层，
  //     绝不把整本书喂给模型（成本约束，见 config.maxContextChars/maxAnswerTokens）。
  //   · 生成层：纯客户端直连 OpenAI 兼容流式接口（BYOK，key 存 localStorage，
  //     不落地、不离开浏览器）；未配 key 时自动降级为“仅检索 + 跳转原文”。
  //   · MCP 工具：src/ai/mcp/ 暴露一组“无明确检索渠道下的切片/模糊查找”工具，
  //     复用现有 cleanSlug / 卡片识别 / collections 配置，不重复造轮子。
  aiAsk: defineFeature({
    id: 'aiAsk',
    cat: 'extra',
    label: 'AI 智能问答',
    desc: '基于当前书籍知识库的检索式提问（RAG，构建期索引 + 客户端 BYOK 生成）',
    enabled: true, // 当前站点已开启（关闭则索引不生成、控件不渲染）
    devOnly: false,
    ui: true,
    config: {
      provider: 'openai',              // OpenAI 兼容协议（BYOK 直连）
      retrieval: 'keyword',            // 'keyword' | 'hybrid'（预留向量增强）
      topK: 8,                         // 每次送入生成的片段上限（成本控制）
      maxContextChars: 6000,           // 上下文总字符上限（成本硬约束）
      maxAnswerTokens: 4096,           // 回答最大 token（默认 4096，保障长公式与矩阵推导不截断）
      defaultModel: 'deepseek-v4-flash',            // 默认模型（对应 models[i].id）
      endpoint: 'https://api.deepseek.com/v1/chat/completions', // 无专属端点的兜底
      models: [                        // 可选模型：id 会作为 API 的 model 字段，endpoint 可覆盖
        { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', endpoint: 'https://api.deepseek.com/v1/chat/completions' },
        { id: 'gpt-4o-mini', label: 'GPT-4o mini', endpoint: 'https://api.openai.com/v1/chat/completions' },
      ],
    },
  }),

  // 读者勘误反馈系统：按 Alt+F 选段发起 GitHub 勘误 Issue（支持 Serverless Bot 静默代发与 URL 预填直达）
  feedback: defineFeature({
    id: 'feedback',
    cat: 'reader',
    label: '读者勘误反馈',
    desc: '读者按 Alt+F 或点击按钮选段提交结构化 GitHub 勘误 Issue',
    enabled: true,
    devOnly: false,
    ui: true,
    config: {
      githubRepo: 'Ariesagittarius/AstroLib',
      issueLabels: ['errata', 'community-feedback'],
      shortcutKey: 'Alt+f',
      botEndpoint: 'https://astrolib-feedback-bot.2477252192.workers.dev', // Serverless Bot API 端点
    },
  }),

  // Vercel Analytics 数据统计分析：全站访客量与高质量行为统计（带配额智能优化与防抖过滤）
  analytics: defineFeature({
    id: 'analytics',
    cat: 'extra',
    label: 'Vercel Analytics',
    desc: '全站访客量与高质量行为统计（带配额智能优化与防抖过滤）',
    enabled: true,
    devOnly: false,
    ui: false,
    config: {
      productionOnly: true,     // 仅在正式生产域名上报（过滤 localhost 与本地调试隧道）
      filterBots: true,         // 过滤自动化无头浏览器与常见扫描爬虫
      excludePaths: ['/dev/', '/print'], // 排除内部开发文档与全书打印页，配额留给读者正文
      minDwellMs: 2500,         // 章节快刷防抖：停留 >= 2.5 秒才计为一次有效阅读
      trackHighValueEvents: true, // 开启关键高价值动作监听（EPUB 下载等）
    },
  }),
};

/** 全站功能表（id → manifest） */
export const features = featureDefs;

/** 所有功能 id（便于遍历/校验） */
export const FEATURE_IDS = Object.keys(features);

/**
 * 有效启用：enabled && (非 devOnly || 处于 dev)。
 * 供 astro.config.mjs 在构建期决定是否挂载插件/CSS/组件；组件请直接读
 * features.<id>.enabled 布尔值（避免在组件里计算 devOnly，见文件头说明）。
 */
export function isEffective(id) {
  const f = features[id];
  if (!f) return false;
  return f.enabled && (!f.devOnly || IS_DEV);
}

/** 关联读取：取其构建参数 refs（跨引用联动模式），供 rehypeCrossRef / PageSidebar 使用 */
export function crossRefRefs() {
  return features.crossRef?.config?.refs ?? 'interactive';
}
