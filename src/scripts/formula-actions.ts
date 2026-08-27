/**
 * 文章正文公式操作（formula-actions）统一入口门面
 *
 * 架构重构说明：
 *   - 导出核心引擎：见 src/scripts/formula/exporter.ts（纯净 DOM 转 SVG/PNG 矢量与栅格化引擎）
 *   - 交互 UI 与生命周期：见 src/scripts/formula/ui.ts（悬浮工具条、触屏适配、按需动态 import、零开销启停）
 *
 * 本文件作为对外门面（Facade），完整重导出所有 API，保障与既有代码的向前兼容性。
 */

export * from './formula/exporter';
export * from './formula/ui';
