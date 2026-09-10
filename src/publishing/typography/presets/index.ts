/**
 * src/publishing/typography/presets/index.ts
 * AstroLib 学术排版预设注册表 (Academic Typography Preset Registry)
 *
 * 核心设计准则：
 * 1. Single Source of Truth: 唯一收敛 4 套官方经过真实验证的学术排版预设。
 * 2. 彻底剔除 international，杜绝任何隐藏生产路径与未经验证的预设。
 * 3. 严格分类：Core (核心学术教材/专著) vs Specialized (专门场景讲义)。
 * 4. 零 UI / 零 AST 依赖，纯粹 Publishing Domain 层基础设施。
 */

import type { TypographyPreset, TypographyPresetId } from '../types.ts';
import { PRESET_SCHOLARLY } from './scholarly.ts';
import { PRESET_CLASSIC } from './classic.ts';
import { PRESET_MATHEMATICAL } from './mathematical.ts';
import { PRESET_LECTURE } from './lecture.ts';

export { PRESET_SCHOLARLY } from './scholarly.ts';
export { PRESET_CLASSIC } from './classic.ts';
export { PRESET_MATHEMATICAL } from './mathematical.ts';
export { PRESET_LECTURE } from './lecture.ts';

/**
 * 默认学术排版预设 ID 与预设对象
 */
export const DEFAULT_TYPOGRAPHY_PRESET_ID: TypographyPresetId = 'scholarly';
export const DEFAULT_TYPOGRAPHY_PRESET: TypographyPreset = PRESET_SCHOLARLY;

/**
 * 官方学术排版预设只读注册表 (单例只读字典)
 */
export const PRESET_REGISTRY: Readonly<Record<TypographyPresetId, TypographyPreset>> = Object.freeze({
  scholarly: PRESET_SCHOLARLY,
  classic: PRESET_CLASSIC,
  mathematical: PRESET_MATHEMATICAL,
  lecture: PRESET_LECTURE,
});

/**
 * 类型收窄守卫：判断输入值是否为官方支持的有效 TypographyPresetId
 */
export function isTypographyPresetId(val: unknown): val is TypographyPresetId {
  return typeof val === 'string' && Object.prototype.hasOwnProperty.call(PRESET_REGISTRY, val);
}

/**
 * 获取官方学术预设
 * @param id 预设标识符
 * @param fallbackToDefault 若未找到是否自动回退至默认预设 (默认为 true；若设为 false，未知 ID 会显式抛出异常)
 */
export function getTypographyPreset(id: unknown, fallbackToDefault: boolean = true): TypographyPreset {
  if (isTypographyPresetId(id)) {
    return PRESET_REGISTRY[id];
  }
  if (fallbackToDefault) {
    return DEFAULT_TYPOGRAPHY_PRESET;
  }
  const validIds = Object.keys(PRESET_REGISTRY).join(', ');
  throw new Error(`[Typography Preset Registry] 未知预设 ID: "${String(id)}"。官方合法预设包含: [${validIds}]`);
}

/**
 * 列出所有已注册的官方学术排版预设 (保持稳健的拓扑顺序: Core -> Specialized)
 */
export function listTypographyPresets(): TypographyPreset[] {
  return [
    PRESET_SCHOLARLY,
    PRESET_CLASSIC,
    PRESET_MATHEMATICAL,
    PRESET_LECTURE,
  ];
}
