# AstroLib: 统一教材章节与习题 LaTeX/PDF 导出架构审查 (ARCHITECTURE_REVIEW)

**日期**：2026-09-07 (Phase 2 Final Correction)
**审查目的**：消除章节导出与习题导出各自为政的潜在分裂风险，将二者收敛入统一的 Publishing / Export 管道，共享配置模型、排版基础设施、资源解析器与云端编译引擎。

---

## 1. 核心架构修正说明 (Final Architectural Clarifications)

### 1.1 Chapter Metadata 的严格架构归属
- **硬性约束**：Publishing 绝对不拥有 Content / Catalog 的领域语义。推导章节归属、解析目录树、确定大章编号与节名称，属于 **Domain / Catalog Layer (`src/core/catalog/`)** 的职责。
- **架构数据流**：
  ```text
  src/core/catalog/chapter-metadata.ts (Domain 层权威元数据)
          ↓
  ChapterCanonicalMetadata (纯领域数据契约)
          ↓
  src/publishing/common/mdx-chapter-parser.ts (注入 ChapterDocument)
          ↓
  src/publishing/latex/latex-generator.ts (纯排版渲染，无逻辑推断)
          ↓
  Canonical `.tex`
  ```
- Publishing 仅作为该元数据的消费者，绝不负责反向推断章节知识。

### 1.2 动态章节与定理编号（零硬编码原则）
- 严禁在 LaTeX Generator 或模板中硬编码任何章号（如 `2`、`2.1`、`2.2`、`定理 2.1`）。
- Generator 必须从 `ChapterCanonicalMetadata` 中动态获取 `numberingPrefix`（例如第 1 章为 `1.`，第 2 章为 `2.`，第 7 章为 `7.`，第 12 章为 `12.`）。
- 动态注入 LaTeX 计数器宏：
  ```latex
  \providecommand{\astrolibchapternum}{<numberingPrefix>}
  \renewcommand{\thesection}{<numberingPrefix>\arabic{section}}
  \renewcommand{\thetcb@cnt@theorem}{<numberingPrefix>\arabic{tcb@cnt@theorem}}
  ```
- 支持任意章节无缝编译，计数器自然递增。

### 1.3 tcolorbox 定理计数器实测验证
- 在本地 XeLaTeX (TeX Live 2026) 环境中进行了实际物理编译断言（`.tmp/test-counter/test.tex`）。
- 验证确认：
  - `\newtcbtheorem` 生成的内部计数器为 `tcb@cnt@<name>`；
  - 重定义 `\thetcb@cnt@theorem` 后，`test.aux` 生成标准标号：
    - `\numberline {2.1}函数和、差、积、商的求导法则`
    - `\newlabel{thm:thm:2-1}{{2.1}{1}{导数的有理运算法则}...}`
    - `\newlabel{def:def:2-2}{{2.2}{1}{导函数}...}`
    - `\numberline {2.2}复合函数的求导法则`
    - `\newlabel{thm:thm:2-3}{{2.3}{1}{复合函数求导法则}...}`
  - 定理与定义完全连续编号，完全对齐原书，无任何多余的 `.1.1` 冗余后缀；
  - 习题导出基于独立的 `homework.cls`，不引用 `astrolib-chapter.sty`，两者完全物理隔离，互不干扰。

### 1.4 章节资源解析与云端资产工程折中
- **领域设计 (Chapter-scoped)**：
  `chapter-exporter.ts` 与 `ResourceResolver` 严格按照当前章节解析依赖（`exportResult.assets`），本地输出和离线 ZIP 只包含当前章节引用的图片。
- **云端工程折中 (CI Asset Pool)**：
  由于 GitHub Actions `workflow_dispatch` 的单字段限制无法直接携带多文件二进制数据包，GitHub Actions 利用已经 `actions/checkout` 的代码仓库作为共享资产池，在 `workspace/` 中自动搜寻并软链接/复制插图，确保云端 XeLaTeX 无缝解析图片。
- **路径规范化**：全平台（Windows 与 Linux）在 LaTeX 源码中统一使用正斜杠 `/` 与相对路径 `assets/<filename>` / `images/<filename>`，由 `\graphicspath{{assets/}{images/}{./}}` 兜底。

---

## 2. 目标统一发布管道架构

```text
                             ┌────────────────────────┐
                             │    Canonical Content   │
                             │                        │
                             │  Chapter / Section MDX │
                             │  Exercise Repository   │
                             └───────────┬────────────┘
                                         │
                                         ▼
                             ┌────────────────────────┐
                             │   Core Catalog Domain  │
                             │                        │
                             │ chapter-metadata.ts    │
                             │ ChapterCanonicalMeta   │
                             └───────────┬────────────┘
                                         │
                                         ▼
                             ┌────────────────────────┐
                             │   Publishing Domain    │
                             │                        │
                             │  ExportSettings (共享)  │
                             │  ImageSizingPolicy     │
                             │  ResourceResolver      │
                             └───────────┬────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
           Chapter Export Target                     Exercise Export Target
                    │                                         │
                    └────────────────────┬────────────────────┘
                                         ▼
                             ┌────────────────────────┐
                             │ LaTeX Generator Layer  │
                             │                        │
                             │  shared font preamble  │
                             │  shared image emitter  │
                             │  clean math / formulas │
                             └───────────┬────────────┘
                                         ▼
                                  Canonical `.tex`
                                         │
                                         ▼
                             ┌────────────────────────┐
                             │ Compiler Backend Pool  │
                             │                        │
                             │ ├── Local XeLaTeX      │
                             │ └── GitHub Actions CI  │
                             └───────────┬────────────┘
                                         ▼
                                   Standard `.pdf`
```

---

## 3. 文件变更范围划分

### 明确新增文件：
1. `src/core/catalog/chapter-metadata.ts`：Domain 层章节规范元数据抽取（包含大章名、节号、动态 numberingPrefix）。
2. `src/publishing/common/export-settings.ts`：统一全站导出配置、字体规格、自适应图片策略 `ImageSizingPolicy` 及 `localStorage` 缓存同步。
3. `src/publishing/common/resource-resolver.ts`：统一本地与编译环境的资源路径解析（样式宏包、插图与字体）。

### 明确修改文件：
1. `src/types/chapter-semantic.ts`：定义 `ChapterCanonicalMetadata` 与扩充 `ChapterDocument`。
2. `src/publishing/latex/templates/astrolib-chapter.sty`：引入参数化计数器宏，定理与例题编号与原书对齐。
3. `src/publishing/latex/latex-generator.ts`：移除 `\maketitle`，生成学术卷头，接入统一字体 preamble 与 `ImageSizingPolicy`，基于 metadata 动态设置计数器。
4. `src/publishing/latex/chapter-exporter.ts`：串联 Domain 层的 `chapter-metadata` 与 Publishing 渲染器。
5. `.github/workflows/compile-latex.yml`：CI 准备阶段挂载全书插图资产。
6. `src/server/plugins/chapter-export/dev-server-plugin.mjs` & `scripts/export-chapter-latex.mjs`：透传统一配置参数。
7. `src/components/publishing/ChapterExportModal.astro`：Portal 挂载到 `document.body`，彻底修复穿透，统一极简学术设置面板。

### 明确【不应该】修改的文件：
- ❌ `src/content/docs/**/*.mdx`（严禁修改任何 MDX 原文内容，保持数据源纯粹性）；
- ❌ `src/config/collections.config.mjs`（书库核心配置保持只读）；
- ❌ `src/components/PageSidebarOverride.astro`（右侧大纲原有逻辑不变）；
- ❌ `src/components/exercises/exercise-controller.ts` 的核心刷题业务逻辑（既有 1511 题导出行为严格保护）。
