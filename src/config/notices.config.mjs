export const NOTICE_PRESETS = {

  mineruOcr: {
    id: 'mineru-ocr-notice',
    variant: 'wiki',
    severity: 'warning',
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

export function resolveNotices(bookNotices = [], pageNotices = []) {
  const combined = [...(bookNotices || []), ...(pageNotices || [])];
  if (!combined.length) return [];

  const list = [];
  for (const item of combined) {
    if (!item) continue;
    if (typeof item === 'string') {

      if (item === 'mineru-ocr' || item === 'mineruOcr') {
        list.push({ ...NOTICE_PRESETS.mineruOcr });
      }
    } else if (typeof item === 'object') {

      if (item.preset && NOTICE_PRESETS[item.preset]) {
        list.push({ ...NOTICE_PRESETS[item.preset], ...item });
      } else {
        list.push(item);
      }
    }
  }

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
