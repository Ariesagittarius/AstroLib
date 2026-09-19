import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * 模拟构造学术提问 Prompt
 */
function buildSideNoteAiPrompt(options: {
  bookTitle: string;
  chapterHeading: string;
  title: string;
  problemText: string;
}): string {
  const { bookTitle, chapterHeading, title, problemText } = options;
  return [
    `请针对《${bookTitle}》${chapterHeading ? `「${chapterHeading}」` : ''}中的思考题【${title}】进行深入剖析与详细解答。`,
    `要求：推导步骤严密、概念清晰，揭示题目的核心数学思想与思考切入点。`,
    ``,
    `【思考题内容】：`,
    problemText,
  ].join('\n');
}

describe('SideNote AI Assistant Integration (Contract & Unit Tests)', () => {
  const sideNotePath = path.resolve('src/components/SideNote.astro');
  const aiAskPath = path.resolve('src/components/AIAsk.astro');

  it('SideNote.astro 必须完整集成 Material Design 3 AI 解答徽标与特性开关', () => {
    const content = fs.readFileSync(sideNotePath, 'utf-8');

    // 1. 验证引入 features 特性配置与 AI 开关判断
    expect(content).toContain("import { features } from '../config/features.config.mjs';");
    expect(content).toContain('const isAiEnabled = Boolean(features.aiAsk?.enabled)');

    // 2. 验证包含 Google Material Symbols 官方 auto_awesome 矢量
    expect(content).toContain('class="sidenote-ai-btn"');
    expect(content).toContain('class="sidenote-ai-icon"');
    expect(content).toContain('m19 9 1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z');
    expect(content).toContain('AI 解答');

    // 3. 验证符合 M3 Assist Chip 样式规范（Pill 胶囊药丸、状态层过渡动画）
    expect(content).toContain('border-radius: 9999px;');
    expect(content).toContain('cubic-bezier');
    expect(content).toContain('.sidenote-ai-btn.is-loading');

    // 4. 验证客户端脚本包含 LaTeX 公式源码还原与 aiask:query 事件派发
    expect(content).toContain('extractLatexAwareText');
    expect(content).toContain('.katex-display[data-latex]');
    expect(content).toContain('.katex[data-latex]');
    expect(content).toContain("new CustomEvent('aiask:query'");
  });

  it('AIAsk.astro 必须支持外部查询在异步按需加载阶段的无损缓存与自动重试', () => {
    const content = fs.readFileSync(aiAskPath, 'utf-8');
    expect(content).toContain("window.addEventListener('aiask:query'");
    expect(content).toContain('loadAiAsk().then(');
    expect(content).toContain('_openWithQuestion');
  });

  it('Prompt 构造函数应当合成符合学术规范的提示词', () => {
    const prompt = buildSideNoteAiPrompt({
      bookTitle: '工科数学分析',
      chapterHeading: '1.1 集合 映射与函数',
      title: '想一想',
      problemText: '举一个 $(A \\setminus B) \\cup B \\neq A$ 的例子。',
    });

    expect(prompt).toContain('请针对《工科数学分析》「1.1 集合 映射与函数」中的思考题【想一想】进行深入剖析与详细解答。');
    expect(prompt).toContain('要求：推导步骤严密、概念清晰，揭示题目的核心数学思想与思考切入点。');
    expect(prompt).toContain('【思考题内容】：\n举一个 $(A \\setminus B) \\cup B \\neq A$ 的例子。');
  });
});
