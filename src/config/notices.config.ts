/**
 * notices.config.ts
 * ============================================================================
 * 全站提示框架（Notice Framework）配置、模板中心与通用插值引擎
 * 
 * 遵循架构规范：
 * 1. UI 不是数据模型，本文件是全站提示项的结构、模板与预设唯一声明源；
 * 2. 泛化模板架构：框架不硬编码业务字段，支持任意自定义占位符（如 {model}, {author}, {reviewer}）；
 * 3. 图书在 collections.config.ts 或 MDX Frontmatter 中通过 notices 数组声明提示，支持跨层级级联与参数覆写。
 * ============================================================================
 */

import type { NoticeConfig, NoticeTemplate, NoticeItem } from '../types/notices.ts';

const RESERVED_NOTICE_KEYS = new Set([
  'id',
  'template',
  'preset',
  'variant',
  'severity',
  'icon',
  'message',
  'title',
  'subtitle',
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
 */
export function interpolateText(text: string, params: Record<string, any> = {}): string {
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
 */
export const NOTICE_TEMPLATES: Record<string, NoticeTemplate> = {
  aiGenerated: {
    id: 'ai-generated',
    variant: 'wiki',
    severity: 'info',
    icon: 'auto_awesome',
    tagPosition: 'inline',
    tags: ['AI生成', '{model}'],
    message: '本页面内容由 {model} 辅助生成，请注意甄别技术细节与推导准确性。',
    items: [
      { text: '视觉推理模型：{visualModel}' },
      { text: '人工核对状态：{verifyStatus}' },
    ],
    collapsible: true,
    defaults: {
      model: 'ChatGPT 5.6 Luna',
      visualModel: 'Gemini 3.5 Flash-Lite',
      verifyStatus: '公式与关键推导已抽检',
    },
  },

  ocr: {
    id: 'mineru-ocr-notice',
    variant: 'wiki',
    severity: 'warning',
    icon: 'smart_toy',
    tags: ['自动数字化'],
    message: '此文章出自以 {engine} 为视觉模型的管线，存在排版与符号准确性问题，请谨慎鉴别。',
    items: [
      {
        text: '我们在推进以 {targetEngine} 为视觉模型的管线使用，并人工审核这些工作。若您发现排版或公式勘误，可通过项目内通道提交或联系作者。',
      },
    ],
    collapsible: true,
    defaults: {
      engine: 'MinerU OCR',
      targetEngine: 'Gemini 3.5 Flash-Lite',
    },
  },

  translation: {
    id: 'translation-notice',
    variant: 'wiki',
    severity: 'info',
    icon: 'translate',
    tagPosition: 'inline',
    tags: ['中文翻译', '{status}'],
    message: '本篇译自《{originalBook}》（原作者：{author}），目前处于 {status} 阶段。',
    items: [
      { text: '主审人：{reviewer}' },
      { text: '专业术语对照标准：{termVersion}' },
    ],
    collapsible: true,
    defaults: {
      originalBook: '学术经典教材',
      author: '原作者',
      status: '校订中',
      reviewer: '教研团队',
      termVersion: '2026.03 版',
    },
  },

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
      grade: '核心研读',
    },
  },

  experimental: {
    id: 'experimental-notice',
    variant: 'wiki',
    severity: 'neutral',
    icon: 'science',
    tags: ['实验性探讨'],
    message: '本篇包含实验性探讨或尚未定稿的推导，仅供学术交流与研讨参考。',
    defaults: {},
  },
};

export function defineNoticeTemplate(name: string, templateConfig: NoticeTemplate): NoticeTemplate {
  if (!name || typeof name !== 'string') {
    throw new Error('[NoticeFramework] Template name must be a non-empty string');
  }
  NOTICE_TEMPLATES[name] = templateConfig;
  return templateConfig;
}

export function createNotice(templateOrNotice: string | NoticeConfig, overrides: Record<string, any> = {}): NoticeConfig {
  if (typeof templateOrNotice === 'string') {
    return { template: templateOrNotice, ...overrides };
  }
  return { ...templateOrNotice, ...overrides };
}

export const NOTICE_PRESETS: Record<string, any> = {
  get mineruOcr() {
    return createNotice('ocr');
  },
  get devDocsAi() {
    return createNotice('aiGenerated', { tags: ['AI生成'] });
  },
  ...NOTICE_TEMPLATES,
};

export const ROUTE_NOTICES = [
  {
    pattern: /^\/dev(\/|$)/,
    notices: [
      createNotice('aiGenerated', {
        id: 'dev-docs-ai-notice',
        model: 'ChatGPT 5.6 Luna',
        tags: ['AI生成'],
      }),
    ],
  },
];

function findTemplate(name?: string): NoticeTemplate | null {
  if (!name || typeof name !== 'string') return null;
  if (NOTICE_TEMPLATES[name]) return NOTICE_TEMPLATES[name];

  const camelName = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  if (NOTICE_TEMPLATES[camelName]) return NOTICE_TEMPLATES[camelName];

  if (name === 'mineru-ocr' || name === 'mineruOcr') return NOTICE_TEMPLATES.ocr;
  if (name === 'dev-docs-ai' || name === 'devDocsAi' || name === 'chatgpt-luna' || name === 'chatgptLuna') {
    return NOTICE_TEMPLATES.aiGenerated;
  }
  return null;
}

function deriveNoticeId(notice: Record<string, any>, fallbackId?: string): string {
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

function normalizeItems(items: any, params: Record<string, any>): NoticeItem[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
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

function normalizeTags(tags: any, params: Record<string, any>): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((t) => interpolateText(String(t), params))
    .filter(Boolean);
}

function resolveSingleNotice(raw: any): any {
  if (!raw) return null;

  let item = raw;
  if (typeof raw === 'string') {
    item = { template: raw };
  } else if (typeof raw !== 'object') {
    return null;
  }

  const templateKey = item.template || item.preset;
  const templateConfig = findTemplate(templateKey) || ({} as Partial<NoticeTemplate>);

  const customParams: Record<string, any> = {};
  for (const [key, value] of Object.entries(item)) {
    if (!RESERVED_NOTICE_KEYS.has(key)) {
      customParams[key] = value;
    }
  }

  const mergedParams = {
    ...(templateConfig.defaults || {}),
    ...(item.defaults || {}),
    ...(item.params || {}),
    ...customParams,
  };

  const rawMessage = item.message || item.title || templateConfig.message || templateConfig.title || '';
  const message = interpolateText(rawMessage, mergedParams);

  const rawTags = item.tags !== undefined ? item.tags : (templateConfig.tags || []);
  const tags = normalizeTags(rawTags, mergedParams);

  const rawItems = item.items !== undefined ? item.items : (templateConfig.items || []);
  const items = normalizeItems(rawItems, mergedParams);

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

export function resolveNotices(...noticeGroups: any[]): any[] {
  const combined = noticeGroups.flat().filter(Boolean);
  if (!combined.length) return [];

  const list: any[] = [];
  for (const raw of combined) {
    const resolved = resolveSingleNotice(raw);
    if (resolved) {
      list.push(resolved);
    }
  }

  const map = new Map<string, any>();
  for (const n of list) {
    map.set(n.id, n);
  }

  return Array.from(map.values()).filter((n) => !n.disabled);
}
