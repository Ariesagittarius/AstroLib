# 公式末尾编号（\tag）与正文重叠问题 —— 完整修复记录

> 日期：2026-08　|　项目：my-astro-site（Astro + Starlight + KaTeX）
> 现象文件：`task/formula-xifracdetAiboldsymbolbdetAi12dotsnta.svg`（修复前）/ `… (1).svg`（修复后）
> 涉及文件：`src/scripts/formula-actions.ts`、`astro.config.mjs`、`src/components/SidebarOverride.astro`

---

## 1. 问题现象

行间公式带末尾序号（`\tag{1}`，KaTeX 渲染为 `.tag` 元素）时，导出 SVG/PNG 中序号 `(1)` 与公式末尾字符（如 `…, n`）叠在一起。

以 `x_i = \frac{\det A_i(\boldsymbol{b})}{\det A}, i=1,2,\ldots,n \tag{1}` 为例（从导出文件名 slug 反推的 LaTeX，无 `\quad`），修复前的 SVG 坐标：

| 元素 | 文本 | x 坐标 |
|---|---|---|
| 公式末尾 | `…` | 200.34 |
| 公式末尾 | `, n` | 226.26 / 234.88 |
| 编号 | `(1)` | **221.74 / 229.28 / 238.96** ← 压在正文上 |

编号 `(1)` 的右边缘 ≈244，恰好等于公式内容右边缘 ≈246.5——编号整个压在公式尾部字符上。

---

## 2. 根因分析（重点：不打开浏览器也能定位）

### 2.1 关键前提：导出图的本质

`buildFormulaSvg`（`src/scripts/formula-actions.ts`）**不是把 LaTeX 重新排版成图**，而是把页面上**已渲染好的公式 DOM 的几何**（每个文本节点的 `getBoundingClientRect()` 位置、字体、字号）"搬运"进一个纯 SVG。

> 推论：**导出的 SVG 坐标 = 页面实时 DOM 的几何快照**。因此 SVG 里的坐标可以直接反推页面当时处于什么 CSS 状态——这是整个诊断的突破口。

### 2.2 从坐标反推 DOM 状态

KaTeX 对带 `\tag` 的公式，默认 CSS 是：

```css
.katex-display > .katex > .katex-html > .tag {
  position: absolute;   /* 绝对定位 */
  right: 0;             /* 贴住 .katex-html 右缘 */
}
```

而 custom.css 里其实**早已存在**覆盖规则（commit `56133b7` 加的）：

```css
.katex-display > .katex > .katex-html > .tag {
  position: static;     /* 改为流内定位 */
  margin-left: 0.75em;  /* 编号前留 0.75em 间距 */
}
```

坐标证据链：

1. **编号右缘 ≈ 公式右缘**（244 ≈ 246.5）→ 编号处于 `position: absolute; right: 0`，即 **custom.css 的 `position: static` 没有生效**；
2. **但 `.katex` 盒子是 `max-content` 宽**（246.5 = 公式自身宽度，而非容器宽度）→ custom.css 里另一条规则 `.katex-display > .katex { width: max-content }` **生效了**；
3. **同一份 custom.css 里两条规则，一条生效一条失效** → 不可能是文件没加载，只可能是**级联（cascade）顺序/层的问题**：与 katex.min.css 里的同名规则打架，谁后加载谁赢。

### 2.3 级联三要素排查

两条 `.tag` 规则**同特异性（都是 4 个类选择器）、同层（都未分层）**，因此唯一决定胜负的是**加载顺序**。

排查发现：katex.min.css 是从 `src/components/SidebarOverride.astro` 的 `<script>` 里 `import 'katex/dist/katex.min.css'` 引入的，而 custom.css 走 Starlight 的 `customCss` 配置——**两者分属不同的打包路径，最终 `<link>` 顺序不由源码显式控制**。一旦某次样式/导入调整（本案例用户怀疑是移动端排版调整，git 历史显示 `56133b7` 的修复恰好是在一系列移动端改动之后才补的）改变了打包顺序，katex 默认规则就反超了 custom.css 的覆盖，编号立刻叠回正文。这类 bug **极难用肉眼发现**：页面渲染偶尔正确、偶尔叠字，取决于构建产物顺序。

---

## 3. 修复方案（双层防御）

### 3.1 导出侧（核心）：测量前强制 `.tag` 流内定位

`buildFormulaSvg` 在测量前，用**内联样式**（优先级最高，不依赖任何样式表级联）把 `.tag` 临时强制为流内定位，测量完立即还原：

```ts
// 测量前
for (const tag of tagEls) {
  tag.style.position = 'static';
  tag.style.marginLeft = '0.75em';
  tag.style.whiteSpace = 'nowrap';
  tag.style.right = 'auto';
  tag.style.left = 'auto';
}
// … 同步测量（getBoundingClientRect 会强制同步重排）…
// 测量后立即还原（含提前 return 的路径，用 restoreTagStyles() 兜底）
```

同时把画布宽度从"`.katex` 盒子宽度"改为"盒子宽度 ∪ 全部内容右缘"：

```ts
const W = Math.max(width, contentRight) + padX * 2;
```

（`contentRight` 在文本/边框/内嵌 svg 三趟扫描中累计，顺带修掉了"超宽公式导出右侧被裁"的隐性缺陷。）

> 为什么用内联样式而不是再改一条 CSS？因为**导出不应依赖页面 CSS 的最终状态**——页面样式今天对、明天可能又因为某种顺序变化而失效。内联样式是唯一"永远赢"的手段，且测量是同步的（`getBoundingClientRect` 强制同步重排），页面不会出现可见闪动。

### 3.2 浏览器侧：让加载顺序显式且恒定

把 katex.min.css 挪进 Starlight `customCss` 数组**首位**、先于 custom.css：

```js
customCss: [
  'katex/dist/katex.min.css',   // 必须先于 custom.css
  './src/styles/custom.css',
],
```

同一数组内的条目按声明顺序打包，顺序从此**由源码显式保证**，不再依赖跨模块的打包顺序。同时删掉 `SidebarOverride.astro` 脚本里冗余的 `import 'katex/dist/katex.min.css'`，消除第二个不确定的加载点。

> 补充知识：Starlight 只把自己的样式包进 `@layer starlight.*`，用户 customCss 与第三方 CSS 都是**未分层**的——未分层样式之间按加载顺序决胜，`@layer` 在这里帮不上忙（未分层 > 任意层）。

---

## 4. 验证（修复后 SVG 坐标对比）

| 对比项 | 修复前 | 修复后 | 预期 |
|---|---|---|---|
| 画布宽度 | 258.50 | 297.78 | 扩展到覆盖编号 |
| 编号 `(1)` 起始 x | 221.74 | 267.01 | 在公式末尾之后 |
| 编号与正文间距 | 0（重叠） | ≈14px | 0.75em × 19.36px ≈ 14.5px |
| 正文全部字形坐标 | — | 逐字不变 | 不影响公式本身 |

---

## 5. 经验教训（供日后参考）

1. **导出/截图类功能 = 页面 DOM 几何的快照**。产物坐标是反推页面状态的"物证"，即使没有浏览器、没有构建环境，也能从产物精确还原根因（本项目沙箱无法运行浏览器/构建，全靠这份坐标反推完成诊断）。
2. **同文件两条规则一成一败 → 必是级联问题**。级联三要素：特异性、顺序、层。三方样式（KaTeX）与自定义覆盖同特异性时，**顺序是唯一变量，必须显式保证**。
3. **覆盖第三方默认样式，加载顺序要"显式声明"而不是"碰运气"**。放在同一个 `customCss` 数组里按序声明，比"组件 `<script>` 里 import"可控得多。
4. **修复要落在不依赖脆弱前提的地方**。CSS 级联顺序是脆弱前提（今天对、改个导入就错）；导出代码用内联样式兜底后，即使页面样式再乱，导出图也永远正确——"双保险"里至少有一层是铁打的。
5. **"某次改动后出现的 bug"往往是隐性回归**：`56133b7` 的 CSS 修复本身没问题，问题是它的生效依赖未受控的顺序。排查时不要只盯"最近改了哪行"，要问"这行代码生效需要哪些前提，前提是否被保证"。

---

## 6. 改动摘要

| 文件 | 改动 |
|---|---|
| `src/scripts/formula-actions.ts` | `buildFormulaSvg`：测量前内联强制 `.tag` 流内定位 + 测量后还原（含提前 return 兜底）；画布宽度覆盖内容右缘；文件头 v2 注释补充第 4 条 |
| `astro.config.mjs` | `customCss` 首位加入 `'katex/dist/katex.min.css'`（先于 custom.css），并注释说明原因 |
| `src/components/SidebarOverride.astro` | 删除脚本中冗余的 katex.min.css 引入 |

> 建议提交信息：`fix: 修复公式末尾编号(\tag)在导出图与页面渲染中与公式重叠`
