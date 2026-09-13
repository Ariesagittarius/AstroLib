/**
 * notices.config.mjs
 * ============================================================================
 * 全站提示框架（Notice Framework）配置与中央预设
 * 
 * 遵循架构规范：
 * 1. UI 不是数据模型，本文件是全站提示项的结构与预设唯一声明源；
 * 2. 支持 Wiki 风格（通栏/左强调色条）与 Chrome 风格（M3 Tonal 表面卡片/条目清单）；
 * 3. 图书在 collections.config.mjs 中通过 notices 数组声明提示，支持未来叠加多个提示。
 * ============================================================================
 */

/**
 * 提示预设集合
 */
export const NOTICE_PRESETS = {
  /**
   * MinerU OCR 自动化提取书目统一提示预设
   */
  mineruOcr: {
    id: 'mineru-ocr-notice',
    variant: 'wiki', // 'wiki' (Media 3 ambox 风格) | 'chrome' (Media 1 带有标题和清单的 M3 卡片)
    severity: 'warning', // 'warning' (橙黄微警示) | 'info' | 'neutral' | 'accent'
    icon: 'smart_toy',
    title: '自动化 OCR 数字化版本说明',
    subtitle: '注意事项',
    message: '本书正文由 MinerU OCR 算法与模型自动化提取转换，可能存在排版与符号准确性问题，公式推导请注意甄别并以官方纸质教材为准。',
    tags: ['涉及部分：公式排版与段落分块'],
    items: [
      {
        icon: 'smart_toy',
        text: '本书正文由 MinerU OCR 视觉模型与排版流水线自动化解析生成，公式与结构分块可能存在局部偏差。'
      },
      {
        icon: 'menu_book',
        text: '数学符号、公式推导及定理编号如与实体教材微差，请以官方纸质教材原书为最终依据。'
      },
      {
        icon: 'rate_review',
        text: '本站正逐步推进高精度人工校订与纯视觉推倒重建，读者若发现排版或公式勘误可通过下方通道提交。'
      }
    ],
    collapsible: true,
    dismissible: false
  }
};

/**
 * 将图书配置与章节 frontmatter 中的提示声明归一化为完整对象列表
 * @param {Array<string | object>} [bookNotices] 图书级提示列表
 * @param {Array<string | object>} [pageNotices] 页面/章节级提示列表
 * @returns {Array<object>}
 */
export function resolveNotices(bookNotices = [], pageNotices = []) {
  const combined = [...(bookNotices || []), ...(pageNotices || [])];
  if (!combined.length) return [];

  const list = [];
  for (const item of combined) {
    if (!item) continue;
    if (typeof item === 'string') {
      // 字符串别名映射到预设
      if (item === 'mineru-ocr' || item === 'mineruOcr') {
        list.push({ ...NOTICE_PRESETS.mineruOcr });
      }
    } else if (typeof item === 'object') {
      // 允许基于预设局部覆盖，或传入全新定义
      if (item.preset && NOTICE_PRESETS[item.preset]) {
        list.push({ ...NOTICE_PRESETS[item.preset], ...item });
      } else {
        list.push(item);
      }
    }
  }

  // 按 ID 去重，后声明者覆盖前者
  const map = new Map();
  for (const n of list) {
    if (n.id) {
      map.set(n.id, n);
    } else {
      map.set(Math.random().toString(36).slice(2), n);
    }
  }
  return Array.from(map.values());
}
