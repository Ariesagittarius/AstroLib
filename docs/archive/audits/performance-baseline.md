# AstroLib 性能优化基线报告 (Phase 0 Baseline)

> 记录时间：2026-09-06
> 环境：Node.js v24.20.0 | Astro 7.2.8 | Starlight 0.41.3 | Vite 8.2.2 | 纯 SSG 架构
> 测量基准：生产构建产物（`npm run build`）及目标典型页面

---

## 1. 生产构建产物宏观基线 (Build Output Baseline)

| 产物维度 | 数量 / 规模 | 详细数据 | 关键特征 / 风险分析 |
| :--- | :--- | :--- | :--- |
| **构建耗时** | 1 次完整构建 | **233.8 秒 (3m 54s)** | 包含 4 个预构建脚本 + Astro 595 页 SSG + Pagefind 索引 |
| **HTML 页面总量** | **595 个** | **441.86 MB** (平均 **760.4 KB** / 页) | 包含 576 篇教材正文、开发文档、检索页、打印页 |
| **最大单页 HTML** | 1 页 | `print/index.html`: **15,535.6 KB (15.5 MB)** | 全书打印排版合并单页 |
| **最大正文 HTML** | 1 页 | 《工科数学分析》第 53 节: **3,271.8 KB (3.27 MB)** | 64,332 个 DOM 节点，1,246 个 KaTeX 公式 |
| **JavaScript Chunks** | **115 个** | **3.64 MB** (未压缩总和) | 最大 Chunk: `chunk-FOHPRMQF.js` (646.6 KB), `auto-render.js` (255.5 KB) |
| **CSS 产物** | **8 个** | **518.9 KB** (未压缩总和) | 最大 CSS: `common.css` (298.5 KB), `plus-jakarta-sans.css` (109.0 KB) |
| **WebFont 字体切片** | **260 个** | **11.12 MB** | Noto Sans SC, Noto Serif SC, Plus Jakarta Sans 全量 unicode 切片 |
| **正文图片总量** | **6,072 张** | **48.96 MB** | 均为 MinerU 公式配图与几何图，均自带宽高比与 lazy 占位 |

---

## 2. 目标典型页面性能基线矩阵

| 维度 / 指标 | 首页 (`/`) | 检索书库 (`/library/`) | 普通/短章节 (数分 01 简介) | 长/密集数学章节 (工科数分 53 节) |
| :--- | :--- | :--- | :--- | :--- |
| **HTML 文件大小** | 38.1 KB | 30.2 KB | 572.2 KB | **3,271.8 KB (3.27 MB)** |
| **DOM 节点总数** | 368 | 244 | 1,746 | **64,332** |
| **KaTeX 公式数量** | 0 | 0 | 0 | **1,246 个** (生成 60,481 个 span) |
| **`data-global-index` 体积** | 0 KB | 0 KB | **355.5 KB** (占 HTML 62%) | **219.6 KB** |
| **首屏 Script 标签数** | 4 (含 inline) | 5 (含 inline) | 25 (11 module + 14 inline) | 25 (11 module + 14 inline) |
| **初始 JS 依赖 Chunks 数** | 1 | 2 | **19 个模块** | **19 个模块** |
| **首屏初始 JS 总体积** | 2.4 KB | 8.3 KB | **585.2 KB** | **585.2 KB** |
| **首屏阻塞 CSS 链接数** | 3 | 2 | 4 | 4 |
| **首屏阻塞 CSS 总体积** | 131.5 KB | 16.4 KB | **469.7 KB** | **469.7 KB** |
| **首屏外部 API 请求数** | 0 | 0 | 0 | 0 |
| **移动端 Layout 读写重排** | 0 次 | 0 次 | 0 次 | **>50,000 次** (`visibleContentRight` 遍历) |

---

## 3. 首屏初始 JS 依赖分解 (阅读页 585.2 KB)

```
┌─────────────────────────────────────────────────────────────┬───────────┬─────────────┐
│ 模块名称 / 归属功能                                         │ 体积 (KB) │ 占初始 JS 比│
├─────────────────────────────────────────────────────────────┼───────────┼─────────────┤
│ auto-render.C-gMRVHU.js (客户端 KaTeX Auto-render 动态引擎) │ 255.5 KB  │ 43.6%       │
│ ExerciseModal...Ch5CJRYM.js (习题自测做题完整控制器)        │ 98.4 KB   │ 16.8%       │
│ src.DrnECATM.js (Vite 抽取的通用公共运行依赖)               │ 45.3 KB   │ 7.7%        │
│ AIAsk...Cm-Bd7Te.js (AI 伴读问答对话控制器)                 │ 41.1 KB   │ 7.0%        │
│ PageSidebarOverride...Ck7-IT7X.js (右侧大纲/导航控制器)     │ 34.7 KB   │ 5.9%        │
│ ModuleInspector...DM9bKWc1.js (模块速查与结构巡检)          │ 25.9 KB   │ 4.4%        │
│ BookRelationGraph...PKQObj6b.js (章节关系图谱控制器)        │ 14.7 KB   │ 2.5%        │
│ FeedbackMode...phy4Ln-p.js (勘误反馈控制器)                 │ 14.2 KB   │ 2.4%        │
│ FeatureToggles...BQcKIg-3.js (全站功能与偏好设置开关)       │ 14.0 KB   │ 2.4%        │
│ SidebarOverride...mCfP3wFB.js (SPA 路由引擎)                │ 14.0 KB   │ 2.4%        │
│ 其余 9 个间接小模块汇总                                     │ 27.4 KB   │ 4.9%        │
├─────────────────────────────────────────────────────────────┼───────────┼─────────────┤
│ 页面加载初始 JS 成本合计 (Total Initial JS)                 │ 585.2 KB  │ 100.0%      │
└─────────────────────────────────────────────────────────────┴───────────┴─────────────┘
```

---

## 4. 优化目标与验收标准 (Target Goals)

1. **Phase 1 (Layout Thrashing)**:
   - 彻底移除 `tameOverflowingInlineMath()` 几何循环检测与 `visibleContentRight()`。
   - 移动端 4x CPU Throttling 下，长章节初始渲染的长任务（Long Tasks）大幅降低，消除因 DOM 类名写入引发的重复同步重排。
2. **Phase 2 (KaTeX Auto-render 剔除)**:
   - 侧边栏和 H1 标题数学公式下沉到构建期静态 HTML 转译。
   - `auto-render...js` (255.5 KB) 从首屏依赖图中彻底消失，普通阅读页首屏初始 JS 直降 **~255 KB**。
3. **Phase 3 (交互模态框 Dynamic Import)**:
   - `ExerciseModal`、`AIAsk`、`ModuleInspector`、`FeedbackMode`、`BookRelationGraph` 改造为按需动态 `import()`。
   - 首屏初始 JS 再降 **~180 KB**，阅读页初始 JS 降至 **60 KB 目标区间**。
4. **Phase 4 (HTML 巨型内联数据解耦)**:
   - 彻底移除 HTML 标签中的 `data-global-index`（219 KB ~ 355 KB 重复 JSON）。
   - 改为构建期输出 `public/data/cross-ref/<book>.json` 静态文件并按需异步加载。
   - 单页 HTML 体积立减 **200~355 KB**。
5. **Phase 5 (CSS & 字体分流)**:
   - 弹窗样式按需加载，默认字体栈优化为系统字体优先，解决中文字体切片无序并行下载。
6. **Phase 6 (TOC 构建期生成)**:
   - 消除客户端大纲全 DOM 扫描与 `toc-loading` 闪烁，大纲构建期注入静态 HTML。
7. **Phase 7 (SPA 缓存瘦身)**:
   - 限制预加载窗口为单向相邻 1 页，消除巨型活体 DOM 树内存驻留。
