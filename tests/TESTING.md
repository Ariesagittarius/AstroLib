# AstroLib 自动化测试套件与类型守卫架构规范 (Testing Architecture & Invariants)

## 1. 架构定位与四层测试金字塔 (The 4-Tier Test Pyramid)

本项目全面采用 **Vitest** 作为统一测试运行器，结合 **TypeScript 严格类型检查**（`tsc --noEmit`），彻底取代散落的临时脚本（`scripts/test-*.mjs`）。

```
        ▲
       / \         Tier 4: System Tests (物理排版与多端集成)
      /   \        tests/system/*.test.ts (~5~10s)
     /     \
    /       \      Tier 3: Acceptance Tests (端到端验收与真实章节解析)
   /         \     tests/acceptance/*.test.ts (~1.5s)
  /           \
 /             \   Tier 2: Contract Tests (架构契约、公有目录卫生、设计令牌守卫)
/               \  tests/contract/*.test.ts (~300ms)
-----------------
  Tier 1: Unit     tests/unit/*.test.ts (纯函数、状态机、错误处理器，~200ms)
```

---

## 2. 目录布局与职责分工

```
tests/
├── helpers/                   # 跨层级测试辅助工具库
│   ├── env-detector.ts        # 编译器与宿主环境探测 (XeLaTeX / Chromium)
│   ├── latex-validators.ts    # LaTeX 源码语法平衡与环境栈检测
│   └── fs-helpers.ts          # 目录递归遍历与跨平台路径标准器
│
├── unit/                      # Tier 1: 纯逻辑单元测试 (毫秒级)
│   ├── comment-stripper.test.ts # AST 智能注释剥离安全验证
│   ├── slug.test.ts           # 路由 cleanSlug 鲁棒性
│   ├── natural-sort.test.ts   # 章节标题自然排序算法
│   ├── notice-engine.test.ts  # 全站通知状态机计算
│   ├── ai-error.test.ts       # AI Provider 统一错误包装
│   └── ai-gemini-tools.test.ts# Gemini 工具与元数据解析
│
├── contract/                  # Tier 2: 架构契约测试
│   ├── public-hygiene.test.ts # AGENTS.md Rule 5: 严格守护 public/ 零编译残留
│   ├── window-layers.test.ts  # 视窗层级令牌契约: 严禁散落 >= 50 的 z-index 魔数
│   ├── katex-metrics.test.ts  # KaTeX 官方度量偏移补丁完整性
│   ├── features-schema.test.ts# Feature Registry 唯一数据源契约
│   ├── collections-schema.test.ts # 图书合集注册表 Schema 契约
│   └── typography-presets.test.ts # 学术排版预设 4 套严格收敛与无 Variable Font 契约
│
├── acceptance/                # Tier 3: 业务验收测试 (业务全链路)
│   ├── export-acceptance.test.ts  # 章节与习题导出设置联动、资产解析、数字资源流
│   ├── latex-export.test.ts   # Jinwen-XU/homework 试卷与练习册生成、语法闭合
│   ├── typst-export.test.ts   # Typst 原生语法转换与题库零占位符残留
│   ├── crossref-ast.test.ts   # Remark/Rehype 构建期交叉引用 AST 下沉
│   └── exercises-dataset.test.ts  # 题库全量 JSON 格式完备性校验
│
├── system/                    # Tier 4: 系统级集成测试 (环境自适应)
│   ├── typst-full-generation.test.ts # Typst 原生引擎内存多页 PDF 生成验证
│   ├── typography-specimen.test.ts  # 本地 XeLaTeX 双通物理编译与字体嵌入验证 (有环境则跑，无则跳过)
│   └── ui-stacking.test.ts    # CSS 视窗分层单调递增性与 Chromium 运行环境
│
└── TESTING.md                 # 本架构说明文档
```

---

## 3. 核心守则与架构不变量 (Invariants)

1. **Zero Side-Effects (零磁盘污染原则)**：
   - 严禁任何测试向 `public/` 写入测试 PDF、TEX、TYP 或中间产物（违背 `AGENTS.md` Rule 5）。
   - 物理编译（如 XeLaTeX）必须在系统临时目录（`os.tmpdir()`）中执行，且必须在 `afterAll` 钩子中完全清理。
   - Typst 编译优先采用内存编译（`compiler.pdf({ mainFileContent })`）。
2. **Environment Defensive (环境自适应优雅降级)**：
   - 依赖宿主外部物理工具（XeLaTeX / Chromium）的系统测试，统一使用 `tests/helpers/env-detector.ts` 进行探测。未安装对应工具时必须通过 `it.skip()` 优雅跳过，保证在标准 CI 容器（纯 Node.js）下零误报。
3. **100% Strict TypeScript Type Coverage**：
   - 全套测试代码严格在 `tsconfig.json` 的 `strict` 约束下编写，执行 `npm run check:types` 必须保持 **0 errors**。
4. **Fast Feedback Loop**：
   - 核心日常测试（Tier 1 + Tier 2 + Tier 3）控制在 2 秒内跑完。

---

## 4. 常用运行指令

```bash
# 1. 运行核心自动化测试套件 (Unit + Contract + Acceptance)
npm test

# 2. 单独运行各层级测试
npm run test:unit        # 仅运行 Tier 1 单元测试 (~200ms)
npm run test:contract    # 仅运行 Tier 2 契约测试 (~300ms)
npm run test:acceptance  # 仅运行 Tier 3 验收测试 (~1.5s)
npm run test:system      # 运行 Tier 4 系统集成测试 (含 XeLaTeX / Typst PDF 渲染)
npm run test:all         # 运行全量所有测试

# 3. 监听模式 (日常 TDD 开发)
npm run test:watch

# 4. 严格类型检查 (无编译输出，纯校验类型)
npm run check:types

# 5. 全站质量门禁 (提交前必跑: 类型检查 + 自动化测试)
npm run check:all
```
