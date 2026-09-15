/**
 * notices.config.mjs
 * ============================================================================
 * 全站提示框架（Notice Framework）配置、模板中心与通用插值引擎
 * 
 * 遵循架构规范：
 * 1. UI 不是数据模型，本文件是全站提示项的结构、模板与预设唯一声明源；
 * 2. 泛化模板架构：框架不硬编码业务字段，支持任意自定义占位符（如 {model}, {author}, {reviewer}）；
 * 3. 图书在 collections.config.mjs 或 MDX Frontmatter 中通过 notices 数组声明提示，支持跨层级级联与参数覆写。
 * ============================================================================
 */

/**
 * 系统保留控制属性（不作为普通业务参数插值传递）
 */
const RESERVED_NOTICE_KEYS = new Set([
  'id',
  'template',
  'preset',
  'variant',
  'severity',
  'icon',
  'message',
  'title',
  'subtitle', // 已废弃，向后兼容忽略
  'tags',
  'tagPosition',
  'items',
  'collapsible',
  'dismissible',
  'disabled',
  'defaults',
  'params',
]);

/**
 * 文本参数通用插值工具
 * 将目标字符串中的 {fieldName} 或 {fieldName|fallback} 置换为实际参数
 * 
 * @param {string} text 原始模板文本
 * @param {Record<string, any>} params 参数键值字典
 * @returns {string} 插值后的文本
 */
export function interpolateText(text, params = {}) {
  if (typeof text !== 'string' || !text.includes('{')) {
    return text;
  }
  return text.replace(/\{([a-zA-Z0-9_-]+)(?:\|([^}]+))?\}/g, (match, key, fallback) => {
    const val = params[key];
    if (val !== undefined && val !== null) {
      return String(val);
    }
    return fallback !== undefined ? fallback : match;
  });
}

/**
 * Wiki 提示通用模板库 (NOTICE_TEMPLATES)
 * 允许在 message、tags、items 中使用任意自定义占位符，并在 defaults 中声明回退默认值。
 */
export const NOTICE_TEMPLATES = {
  /**
   * AI 生成内容提示模板
   * 支持覆盖字段：model, visualModel, verifyStatus 等任意参数
   */
  aiGenerated: {
    id: 'ai-generated',
    variant: 'wiki',
    severity: 'info',
    icon: 'auto_awesome',
    tagPosition: 'lead',
    tags: ['AI生成', '{model}'],
    message: '本页面内容由 {model} 辅助生成，请注意甄别技术细节与推导准确性。',
    items: [
      '视觉推理模型：{visualModel}',
      '人工核对状态：{verifyStatus}'
    ],
    collapsible: true,
    defaults: {
      model: 'ChatGPT 5.6 Luna',
      visualModel: 'Gemini 3.5 Flash-Lite',
      verifyStatus: '公式与关键推导已抽检'
    }
  },

  /**
   * 视觉 OCR 自动化提取书目提示模板
   * 支持覆盖字段：engine, targetEngine 等任意参数
   */
  ocr: {
    id: 'mineru-ocr-notice',
    variant: 'wiki',
    severity: 'warning',
    icon: 'smart_toy',
    tags: ['自动数字化'],
    message: '此文章出自以 {engine} 为视觉模型的管线，存在排版与符号准确性问题，请谨慎鉴别。',
    items: [
      '我们在推进以 {targetEngine} 为视觉模型的管线使用，并人工审核这些工作。若您发现排版或公式勘误，可通过项目内通道提交或联系作者。'
    ],
    collapsible: true,
    defaults: {
      engine: 'MinerU OCR',
      targetEngine: 'Gemini 3.5 Flash-Lite'
    }
  },

  /**
   * 学术翻译与讲义引进模板
   * 支持覆盖字段：originalBook, author, status, reviewer, termVersion 等
   */
  translation: {
    id: 'translation-notice',
    variant: 'wiki',
    severity: 'info',
    icon: 'translate',
    tagPosition: 'lead',
    tags: ['中文翻译', '{status}'],
    message: '本篇译自《{originalBook}》（原作者：{author}），目前处于 {status} 阶段。',
    items: [
      '主审人：{reviewer}',
      '专业术语对照标准：{termVersion}'
    ],
    collapsible: true,
    defaults: {
      originalBook: '学术经典教材',
      author: '原作者',
      status: '校订中',
      reviewer: '教研团队',
      termVersion: '2026.03 版'
    }
  },

  /**
   * 同行审订与重校模板
   * 支持覆盖字段：institution, reviewer, grade, date 等
   */
  peerReview: {
    id: 'peer-review-notice',
    variant: 'wiki',
    severity: 'warning',
    icon: 'rate_review',
    tags: ['同行评议', '{grade}'],
    message: '本章节经 {institution} 的 {reviewer} 评审（{date}），评级推荐为：{grade}。',
    defaults: {
      institution: '专家组',
      reviewer: '特邀专家',
      date: '2026年',
      grade: '核心研读'
    }
  },

  /**
   * 实验性功能与探索性数学笔记模板
   */
  experimental: {
    id: 'experimental-notice',
    variant: 'wiki',
    severity: 'accent',
    icon: 'science',
    tags: ['实验性探讨'],
    message: '本篇包含实验性探讨或尚未定稿的推导，仅供学术交流与研讨参考。',
    defaults: {}
  }
};

/**
 * 动态注册新模板的辅助工具函数
 * @param {string} name 模板唯一标识名
 * @param {object} templateConfig 模板定义
 * @returns {object}
 */
export function defineNoticeTemplate(name, templateConfig) {
  if (!name || typeof name !== 'string') {
    throw new Error('[NoticeFramework] Template name must be a non-empty string');
  }
  NOTICE_TEMPLATES[name] = templateConfig;
  return templateConfig;
}

/**
 * 创建提示项声明的工厂函数（供 JS 配置文件使用）
 * @param {string | object} templateOrNotice 模板名称或即席提示对象
 * @param {object} [overrides] 覆写或附加的自定义参数
 * @returns {object}
 */
export function createNotice(templateOrNotice, overrides = {}) {
  if (typeof templateOrNotice === 'string') {
    return { template: templateOrNotice, ...overrides };
  }
  return { ...templateOrNotice, ...overrides };
}

/**
 * 既有预设向后兼容集合
 * 保持 collections.config.mjs 与历史代码无缝运行
 */
export const NOTICE_PRESETS = {
  get mineruOcr() {
    return createNotice('ocr');
  },
  get devDocsAi() {
    return createNotice('aiGenerated', { tags: ['AI生成'] });
  },
  // 模板库直接映射为预设
  ...NOTICE_TEMPLATES
};

/**
 * 路由规则与范围提示匹配表（按 URL 路径前缀或正则匹配批量附加提示）
 * @type {Array<{ pattern: string | RegExp, notices: Array<string | object> }>}
 */
export const ROUTE_NOTICES = [
  {
    // 全站所有开发文档路由 (/dev/* 或 /dev)
    pattern: /^\/dev(\/|$)/,
    notices: [
      createNotice('aiGenerated', {
        id: 'dev-docs-ai-notice',
        model: 'ChatGPT 5.6 Luna',
        tags: ['AI生成']
      })
    ],
  },
];

/**
 * 根据模板名称或别名查找匹配的模板
 */
function findTemplate(name) {
  if (!name || typeof name !== 'string') return null;
  if (NOTICE_TEMPLATES[name]) return NOTICE_TEMPLATES[name];

  // 驼峰与短横线兼容查找 (e.g. ai-generated -> aiGenerated)
  const camelName = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  if (NOTICE_TEMPLATES[camelName]) return NOTICE_TEMPLATES[camelName];

  // 常见历史别名兼容
  if (name === 'mineru-ocr' || name === 'mineruOcr') return NOTICE_TEMPLATES.ocr;
  if (name === 'dev-docs-ai' || name === 'devDocsAi' || name === 'chatgpt-luna' || name === 'chatgptLuna') {
    return NOTICE_TEMPLATES.aiGenerated;
  }
  return null;
}

/**
 * 派生提示项的稳定 ID
 */
function deriveNoticeId(notice, fallbackId) {
  if (notice.id) return String(notice.id);
  if (fallbackId) return String(fallbackId);

  const raw = notice.message || notice.title || '';
  if (raw) {
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    return `notice-${Math.abs(hash).toString(36)}`;
  }
  return `notice-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 规范化并插值 items 清单条目
 */
function normalizeItems(items, params) {
  if (!Array.isArray(items)) return [];
  return items.map(item => {
    if (typeof item === 'string') {
      return { text: interpolateText(item, params) };
    }
    if (item && typeof item === 'object') {
      return {
        ...item,
        text: interpolateText(item.text || '', params),
      };
    }
    return { text: String(item) };
  });
}

/**
 * 规范化并插值 tags 标签列表
 */
function normalizeTags(tags, params) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map(t => interpolateText(String(t), params))
    .filter(Boolean);
}

/**
 * 归一化单个提示声明项
 * 自动完成模板匹配、参数提取、文本插值与结构极净化
 */
function resolveSingleNotice(raw) {
  if (!raw) return null;

  let item = raw;
  if (typeof raw === 'string') {
    item = { template: raw };
  } else if (typeof raw !== 'object') {
    return null;
  }

  const templateKey = item.template || item.preset;
  const templateConfig = findTemplate(templateKey) || {};

  // 提取自定义用户参数（非保留字段自动作为参数）
  const customParams = {};
  for (const [key, value] of Object.entries(item)) {
    if (!RESERVED_NOTICE_KEYS.has(key)) {
      customParams[key] = value;
    }
  }

  // 参数合并优先级：template.defaults -> item.defaults -> item.params -> 自定义顶层参数
  const mergedParams = {
    ...(templateConfig.defaults || {}),
    ...(item.defaults || {}),
    ...(item.params || {}),
    ...customParams,
  };

  // 文案合一：message 优先，title 作为回退，完全忽略无用的 subtitle
  const rawMessage = item.message || item.title || templateConfig.message || templateConfig.title || '';
  const message = interpolateText(rawMessage, mergedParams);

  // 标签插值
  const rawTags = item.tags !== undefined ? item.tags : (templateConfig.tags || []);
  const tags = normalizeTags(rawTags, mergedParams);

  // 展开抽屉条目插值与规范化
  const rawItems = item.items !== undefined ? item.items : (templateConfig.items || []);
  const items = normalizeItems(rawItems, mergedParams);

  // 派生稳定唯一 ID
  const id = deriveNoticeId(item, templateConfig.id || templateKey);

  const collapsible = item.collapsible !== undefined 
    ? Boolean(item.collapsible) 
    : (templateConfig.collapsible !== undefined ? Boolean(templateConfig.collapsible) : items.length > 0);

  return {
    id,
    variant: item.variant || templateConfig.variant || 'wiki',
    severity: item.severity || templateConfig.severity || 'warning',
    icon: item.icon || templateConfig.icon || 'smart_toy',
    tagPosition: item.tagPosition || templateConfig.tagPosition || 'trail',
    message,
    tags,
    items,
    collapsible,
    dismissible: Boolean(item.dismissible !== undefined ? item.dismissible : templateConfig.dismissible),
    disabled: Boolean(item.disabled),
    params: mergedParams,
  };
}

/**
 * 将路由、合集、图书与章节 frontmatter 中的提示声明归一化为完整对象列表
 * 优先级（从低到高）：Route (路由规则) -> Collection (合集级) -> Book (图书级) -> Frontmatter (页面级)
 * 相同 id 的提示项，后声明者覆盖前者；若指定 disabled: true 则可单页静默屏蔽该提示。
 * 
 * @param {...Array<string | object>} noticeGroups 各层级提示数组
 * @returns {Array<object>}
 */
export function resolveNotices(...noticeGroups) {
  const combined = noticeGroups.flat().filter(Boolean);
  if (!combined.length) return [];

  const list = [];
  for (const raw of combined) {
    const resolved = resolveSingleNotice(raw);
    if (resolved) {
      list.push(resolved);
    }
  }

  // 按 ID 去重，后声明者覆盖前者（支持级联覆盖与单页 disabled 屏蔽）
  const map = new Map();
  for (const n of list) {
    map.set(n.id, n);
  }

  // 过滤已被显式禁用的条目 (disabled: true)
  return Array.from(map.values()).filter(n => !n.disabled);
}
