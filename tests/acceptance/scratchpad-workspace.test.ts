/**
 * tests/acceptance/scratchpad-workspace.test.ts
 * ============================================================================
 * 空白文档与学术工作台 验收测试与双语助读集成契约
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { TEMPLATE_PRESETS, ScratchpadStorage } from '../../src/features/scratchpad/core/storage.ts';
import { renderDocument, renderMarkdown } from '../../src/features/scratchpad/core/markdown-parser.ts';
import { ParagraphAligner } from '../../src/services/translation/paragraph-aligner.ts';

describe('Scratchpad Workspace Acceptance Suite', () => {
  describe('Preset Templates Integrity', () => {
    it('内置的 5 套学术预设模板必须全部合法且均能成功通过渲染管线', () => {
      expect(TEMPLATE_PRESETS).toHaveLength(5);

      for (const tpl of TEMPLATE_PRESETS) {
        expect(tpl.id).toBeTruthy();
        expect(tpl.title).toBeTruthy();
        expect(tpl.draft.metadata.title).toBeTruthy();
        expect(tpl.draft.content).toBeTruthy();

        const rendered = renderDocument(tpl.draft.content);
        expect(rendered.html).toBeTruthy();
        expect(rendered.html).not.toContain('katex-error');
      }
    });

    it('文献双语翻译预设 (literature-translation) 必须包含定理卡片与数学公式', () => {
      const tpl = ScratchpadStorage.getTemplate('literature-translation');
      expect(tpl.id).toBe('literature-translation');

      const rendered = renderDocument(tpl.draft.content);
      expect(rendered.html).toContain('class="knowledge-card');
      expect(rendered.html).toContain('data-icon-kind="theorem"');
      expect(rendered.html).toContain('class="katex"');
      expect(rendered.html).toContain('<table>');
    });

    it('数学边界测试预设 (math-boundary-test) 必须包含复杂矩阵与高斯对齐公式', () => {
      const tpl = ScratchpadStorage.getTemplate('math-boundary-test');
      const rendered = renderDocument(tpl.draft.content);

      expect(rendered.html).toContain('class="katex-display"');
      const latexMatches = Array.from(rendered.html.matchAll(/data-latex="([^"]*)"/g))
        .map((m) => decodeURIComponent(m[1]))
        .join('\n');
      expect(latexMatches).toContain('pmatrix');
      expect(latexMatches).toContain('Gauss-Int');
    });

    it('Mermaid 图表测试预设 (mermaid-diagrams) 必须包含 flowchart 与 sequenceDiagram 容器', () => {
      const tpl = ScratchpadStorage.getTemplate('mermaid-diagrams');
      const rendered = renderDocument(tpl.draft.content);

      expect(rendered.html).toContain('class="mermaid-container"');
      expect(rendered.html).toContain('data-feature="mermaid"');
    });

    it('全量学术卡片预设 (astrolib-academic-cards) 必须包含全部关键卡片类名', () => {
      const tpl = ScratchpadStorage.getTemplate('astrolib-academic-cards');
      const rendered = renderDocument(tpl.draft.content);

      expect(rendered.html).toContain('class="knowledge-card');
      expect(rendered.html).toContain('class="example-card');
      expect(rendered.html).toContain('class="note-block');
      expect(rendered.html).toContain('class="solution-details');
      expect(rendered.html).toContain('class="algorithm-card');
    });
  });

  describe('Bilingual Translation Compatibility (双语助读集成契约)', () => {
    it('工作台文献草稿必须能够被 ParagraphAligner 完整提取离散段落单元与类型', () => {
      // 提取文献模板内容
      const tpl = ScratchpadStorage.getTemplate('literature-translation');

      // 执行双语助读段落扫描切分提取
      const paragraphs = ParagraphAligner.extractFromMarkdown(tpl.draft.content);

      // 验证提取到了有效段落
      expect(paragraphs.length).toBeGreaterThan(4);

      // 验证包含标题、段落、数学公式与卡片等各种类型
      const types = paragraphs.map((p) => p.type);
      expect(types).toContain('heading');
      expect(types).toContain('paragraph');
      expect(types).toContain('math');
      expect(types).toContain('card');

      // 验证段落单元的唯一 ID 赋值
      paragraphs.forEach((p, idx) => {
        expect(p.id).toBe(`p-${idx}`);
        expect(p.sourceText).toBeTruthy();
      });
    });
  });

  describe('CSS Layer Tokens Invariant Contract', () => {
    it('scratchpad.css 必须使用语义化层叠令牌 var(--layer-*)，严禁硬编码 >= 50 的 z-index 魔数', () => {
      const cssPath = path.resolve(process.cwd(), 'src/styles/components/scratchpad.css');
      const content = fs.readFileSync(cssPath, 'utf-8');

      // 查找 z-index: 数字 的硬编码模式
      const hardcodedZIndexMatches = content.match(/z-index\s*:\s*([0-9]+)\s*;/g) || [];

      const violatingMatches: string[] = [];
      for (const m of hardcodedZIndexMatches) {
        const num = parseInt(m.replace(/[^0-9]/g, ''), 10);
        if (num >= 50) {
          violatingMatches.push(m);
        }
      }

      expect(violatingMatches).toEqual([]);
    });
  });

  describe('UI & Interaction Invariant Suite (5 项体验改进契约)', () => {
    it('ScratchpadWorkspace 必须包含顶栏浮动目录与模态弹窗，严禁暴露未注册的原生 md-dialog', () => {
      const workspacePath = path.resolve(process.cwd(), 'src/features/scratchpad/ui/ScratchpadWorkspace.astro');
      const content = fs.readFileSync(workspacePath, 'utf-8');

      // 1. 模板选择采用纯净 modal overlay，严禁未包装的 bare md-dialog 裸露
      expect(content).not.toContain('<md-dialog');
      expect(content).toContain('id="scratchpad-template-modal"');

      // 2. 必须具备顶栏浮动目录触发器与 Popup 下拉结构
      expect(content).toContain('id="scratchpad-toc-trigger"');
      expect(content).toContain('id="scratchpad-toc-popup"');
      expect(content).toContain('id="scratchpad-toc-list"');

      // 3. 返回按钮必须带有专属 id 便于安全跳转原文章
      expect(content).toContain('id="scratchpad-back-btn"');

      // 4. 双语助读按钮与滑入式抽屉完整挂载
      expect(content).toContain('data-scratchpad-translate');
      expect(content).toContain('data-translation-trigger');
      expect(content).toContain('ScratchpadTranslationDrawer');
    });

    it('blank.astro 页面严禁常驻右侧静态大纲边栏，工作台必须 100% 撑满剩余空间', () => {
      const pagePath = path.resolve(process.cwd(), 'src/pages/blank.astro');
      const content = fs.readFileSync(pagePath, 'utf-8');

      // 严禁引入产生右侧固定大纲宽度的 PageSidebarOverride
      expect(content).not.toContain('PageSidebarOverride');
      expect(content).not.toContain('blank-page-sideload-aside');
      expect(content).toContain('class="blank-page-main"');
    });

    it('打印 PDF 样式必须彻底隐藏编辑区与导航，仅保留渲染预览正文', () => {
      const cssPath = path.resolve(process.cwd(), 'src/styles/components/scratchpad.css');
      const content = fs.readFileSync(cssPath, 'utf-8');

      expect(content).toContain('@media print');
      expect(content).toContain('.scratchpad-editor-pane');
      expect(content).toContain('.scratchpad-topbar');
      expect(content).toContain('#blank-doc-article');
    });
  });

  describe('Typography & Font Stack Invariant Suite (界面与正文字体一致性契约)', () => {
    it('界面字体必须统一为 Google 字体 + 思源黑体，应用于工作台容器与各级操作组件', () => {
      const cssPath = path.resolve(process.cwd(), 'src/styles/components/scratchpad.css');
      const content = fs.readFileSync(cssPath, 'utf-8');

      // 验证界面字体变量定义包含 Google 字体 (Plus Jakarta Sans) 与思源黑体 (Noto Sans SC)
      expect(content).toContain('--scratchpad-font-ui');
      expect(content).toContain('Plus Jakarta Sans');
      expect(content).toContain('Noto Sans SC');

      // 验证主容器与顶栏显式应用统一界面字体
      expect(content).toContain('font-family: var(--scratchpad-font-ui);');
    });

    it('预览区字体必须与全站学术阅读正文字体栈严格一致，并绑定 var(--font-reading)', () => {
      const cssPath = path.resolve(process.cwd(), 'src/styles/components/scratchpad.css');
      const content = fs.readFileSync(cssPath, 'utf-8');

      expect(content).toContain('#blank-doc-article');
      expect(content).toContain('var(--font-reading');
      expect(content).toContain('var(--font-heading');
    });

    it('blank.astro 必须在首屏执行脚本中自动读取并恢复 starlight-font 与 astrolib_font_size', () => {
      const pagePath = path.resolve(process.cwd(), 'src/pages/blank.astro');
      const content = fs.readFileSync(pagePath, 'utf-8');

      expect(content).toContain('starlight-font');
      expect(content).toContain('fontLatin');
      expect(content).toContain('fontCjk');
      expect(content).toContain('astrolib_font_size');
      expect(content).toContain('--academic-font-size-body');
    });
  });
});

