# 贡献新书：AI 数据清洗

本文档介绍如何为 AstroLib 录入新教材，并使用多模态视觉模型进行高精度的版面理解、公式复原与 MDX 重构。

---

## 1. 核心理念：以物理扫描图为唯一真实源

传统基于 MinerU 等本地 OCR 提取的线性 Markdown 文本，在面对大学理工科复杂双栏教材时存在难以克服的结构性问题：
- **双栏交织断句**：边栏批注（“想一想”、“注”）硬插在正文推导的一句话中间，破坏逻辑连贯性；
- **公式符号退化**：极限下标错识、西文字符漏包 `$...$`；
- **插图与课后题混杂**：插图索引丢失，课后习题平铺在正文尾部破坏排版呼吸感。

AstroLib 确立了**全视觉推倒重建准则**：
- **唯一真实源（Ground Truth）**：直接以原书 150 DPI 高清扫描原图为输入；
- **多模态端到端直出**：由具备大上下文与视觉推理能力的大模型统揽整页视觉版面，一步到位输出符合 AstroLib 规范的纯净 MDX。

---

## 2. 模型选型与工程参数约束

### 2.1 Google Gemma 4 26B (`gemma-4-26b-a4b-it`)
- **模型定位**：全功能多模态视觉模型，支持原生多图并行输入，具备优异的数理推导与版面还原能力。
- ⚠️ **严禁选用 `gemma-4-31b-it`**：该版本为纯文本模型，传入图片 Base64 会直接触发 HTTP 500 错误。
- **通信协议**：必须使用带有 `alt=sse` 的 Server-Sent Events 流式端点，避免 1MB+ 图像 Base64 请求在长程推理中因非流式等待而超时断开。
- **思考预算硬约束（Anti-Runaway）**：
  Gemma 4 拥有长思维链（CoT）推理机制。在面对密集公式时，若不加约束，思考链可能会耗尽全部 Token 配额导致正文输出为空（0 字节），并引发后续批次内容串位。
  **应对策略**：在 Prompt 顶端强制注入约束指令：
  ```text
  【核心指令】：思考过程请保持极简（不超过 80 字简要大纲），把全部输出配额用于生成完整的 MDX 正文！
  ```
- **黄金批次划分**：推荐每次请求输入 **2 至 3 个物理页码**（对应原书 1~1.5 个跨页展开面），单次推理耗时约 50~80 秒，上下文连贯且稳定性最高。

### 2.2 Google Gemini 3.5 Flash Lite (`gemini-3.5-flash-lite`)
- **模型定位**：超轻量、高并发、输出配额充裕（原生支持 64K 输出）。
- **适用场景**：全书大批量快速初稿生成，以及针对附录、长公式速查表的快速重构。

---

## 3. AstroLib 六大排版重构契约

在执行数据重构时，生成的 MDX 必须 100% 遵守以下契约：

1. **边栏批注彻底抽离为 `<SideNote>`**：
   原书双栏版面中印在侧边的“想一想”、“注”、“注意”、“思路分析”、“几何解释”等，必须从主文段落中剥离出来，封装为：
   ```mdx
   <SideNote title="想一想">
   举例说明用与曲线只有一个交点的直线来定义该曲线在此点切线是不恰当的。
   </SideNote>
   ```
   主文证明与概念叙述必须保持前后主谓完整，严禁断句。
2. **AST 语义卡片闭合与大纲层级规范**：
   - 核心定义与定理使用 `<Knowledge title="...">...</Knowledge>`；
   - 例题使用 `<Example title="...">...</Example>`，解析使用 `<Solution title="解">...</Solution>`；
   - 正文开头严禁书写一级标题（`#`），各概念板块统一从二级标题（`##`）开始。
3. **KaTeX 规范与独立块级公式**：
   - 变量符号统一用 `$...$`；
   - 所有带编号的公式（如 `\tag{2.1}`）必须作为独立块级 `$$...$$`，前后各留一行空行。
4. **插图实体化与子图组织**：
   原书中的几何图形统一导出到章节 `images/` 目录，多子图使用标准 HTML/CSS 排版或清晰图题标注。
5. **课后习题切断解耦**：
   正文末尾严禁堆砌纸质书练习题，正文以最后一节理论收尾，并在末尾引入 `<ExerciseTrigger>`。
6. **扩展资源组件化**：
   原书印刷的二维码视频等资源统一转换为 `<QRCodeVideo>` 组件。

---

## 4. 附件一：生产级多模态视觉处理脚本

以下为经过验证的 Node.js 处理脚本，位于仓库 `scripts/vision_reconstruct/gemma_vision_client.mjs`：

```javascript
import fs from 'node:fs';

const DEFAULT_MODEL = 'gemma-4-26b-a4b-it';

/**
 * 基于 SSE 流式端点的 Gemma 4 多模态视觉客户端
 */
export async function streamGemmaVision(prompt, imagePaths, options = {}) {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('缺少 GEMINI_API_KEY 环境变量');

  const model = options.model || DEFAULT_MODEL;
  const retries = options.retries ?? 3;
  const maxOutputTokens = options.maxOutputTokens ?? 16384;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

  // 构造请求体：文本 Prompt + 图片 Base64
  const parts = [{ text: prompt }];
  for (const imgPath of imagePaths) {
    const b64 = fs.readFileSync(imgPath).toString('base64');
    parts.push({
      inlineData: { mimeType: 'image/jpeg', data: b64 }
    });
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: { maxOutputTokens, temperature: 0.1 }
        })
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`HTTP ${res.status}: ${err.slice(0, 200)}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);
          if (jsonStr === '[DONE]') continue;

          try {
            const data = JSON.parse(jsonStr);
            const cand = data.candidates?.[0];
            if (cand?.content?.parts) {
              for (const part of cand.content.parts) {
                if (part.text && !part.thought) {
                  fullText += part.text;
                }
              }
            }
          } catch {}
        }
      }

      return fullText;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 5000 * attempt));
    }
  }
}
```

---

## 5. 附件二：生产级重构 Prompt 模版

```text
【核心指令】：思考过程请保持极简（不超过 80 字简要大纲），把全部输出配额用于生成完整的 MDX 正文！

你是一名大学理工科教材数字化出版专家与 AstroLib MDX 结构化工程师。
你正在对教材第 {{SECTION_NUM}} 节《{{SECTION_TITLE}}》进行全视觉推倒重建。
输入图片为原书 150 DPI 高清扫描原版物理页码。

请阅读图片中的版面布局、数学推导与定理，直接输出符合 AstroLib 规范的纯净 MDX 正文。

必须严格遵守以下六大约束：
1. 边栏批注抽离为 <SideNote>：
   原书侧边的“想一想”、“注”、“注意”、“思路分析”等批注，必须从主栏叙述中剥离，封装为 <SideNote title="...">内容</SideNote>；主栏推导句子必须前后连贯，严禁被切断。
2. 语义卡片规范：
   - 核心定理/定义使用 <Knowledge title="...">...</Knowledge>；
   - 例题使用 <Example title="...">...</Example>，题解使用 <Solution title="解">...</Solution>；
   - 正文禁止一级标题（#），统一从二级标题（##）开始，细分小模块使用三级标题（###）。
3. KaTeX 公式排版规范：
   - 行内公式使用单个 $...$；
   - 所有带编号公式（如 \tag{X.Y}）必须独立成段并使用 $$...$$ 包裹，前后必须各保留一行空行；
   - 严禁输出任何 \[、\]、\(、\) 界定符。
4. 正文与课后题切断：
   纸质书末尾印刷的课后练习题请直接舍弃，不要输出在正文最后。
5. 纯净输出：
   请直接输出 MDX 正文，不要包裹额外的全局 ```mdx 代码块外框。
```
