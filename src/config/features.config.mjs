export const IS_DEV = typeof process !== 'undefined' && !!process.argv?.includes('dev');

const CATS = new Set(['reader', 'extra', 'dev']);

const REFS = new Set(['interactive', 'static']);

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

const featureDefs = {

  katex: defineFeature({
    id: 'katex',
    cat: 'reader',
    label: 'KaTeX 公式',
    desc: '公式排版与源码回填（data-latex）',
    enabled: true,
    devOnly: false,
    ui: false,
  }),

  theme: defineFeature({
    id: 'theme',
    cat: 'reader',
    label: '主题切换',
    desc: '亮/暗模式与 UI 风格主题切换（VitePress / Starlight）',
    enabled: true,
    devOnly: false,
    ui: true,
  }),

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

  imageBlur: defineFeature({
    id: 'imageBlur',
    cat: 'reader',
    label: '图像模糊占位',
    desc: '正文图片构建期生成 LQIP 高斯模糊占位并平滑渐变加载',
    enabled: false,
    devOnly: false,
    ui: false,
  }),

  relationGraph: defineFeature({
    id: 'relationGraph',
    cat: 'extra',
    label: '章节关系图谱',
    desc: '全书章节内联引用拓扑图与知识导图（ECharts 可视化）',
    enabled: true,
    devOnly: false,
    ui: true,
  }),

  mermaid: defineFeature({
    id: 'mermaid',
    cat: 'extra',
    label: 'Mermaid 图表',
    desc: 'MDX 代码块及 `<Mermaid>` 组件渲染 Sequence/Flowchart 流程图',
    enabled: true,
    devOnly: false,
    ui: true,
  }),

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

  editor: defineFeature({
    id: 'editor',
    cat: 'dev',
    label: '在线精修工具',
    desc: 'dev 下点渲染页改 MDX 并写回（dev-only）',
    enabled: true,
    devOnly: true,
    ui: false,
  }),

  inspector: defineFeature({
    id: 'inspector',
    cat: 'extra',
    label: '模块索引与速查',
    desc: '全书卡片模块索引速查、分类筛选与跨章检索定位（同章冲突与结构审查仅开发期可见）',
    enabled: true,
    devOnly: false,
    ui: true,
  }),

  aiAsk: defineFeature({
    id: 'aiAsk',
    cat: 'extra',
    label: 'AI 智能问答',
    desc: '基于当前书籍知识库的检索式提问（RAG，构建期索引 + 客户端 BYOK 生成）',
    enabled: true,
    devOnly: false,
    ui: true,
    config: {
      provider: 'openai',
      retrieval: 'keyword',
      topK: 8,
      maxContextChars: 6000,
      maxAnswerTokens: 1200,
      defaultModel: 'deepseek-v4-flash',
      endpoint: 'https://api.deepseek.com/v1/chat/completions',
      models: [
        { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', endpoint: 'https://api.deepseek.com/v1/chat/completions' },
        { id: 'gpt-4o-mini', label: 'GPT-4o mini', endpoint: 'https://api.openai.com/v1/chat/completions' },
      ],
    },
  }),
};

export const features = featureDefs;

export const FEATURE_IDS = Object.keys(features);

export function isEffective(id) {
  const f = features[id];
  if (!f) return false;
  return f.enabled && (!f.devOnly || IS_DEV);
}

export function crossRefRefs() {
  return features.crossRef?.config?.refs ?? 'interactive';
}
