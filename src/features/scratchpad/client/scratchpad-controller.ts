/**
 * src/features/scratchpad/client/scratchpad-controller.ts
 * ============================================================================
 * 空白文档与学术工作台（Scratchpad）前端交互控制器
 * ============================================================================
 * 职责：
 * 1. 驱动 Markdown 编辑区输入、按键绑定（Tab 缩进、括号自动配对、防抖渲染）；
 * 2. 调度 KaTeX、Mermaid、AstroLib 学术卡片渲染管线与公式复制交互；
 * 3. 驱动三档视口模式切换（分屏对照 / 专注阅读 / 专注写作）；
 * 4. 驱动元数据表单与 YAML Frontmatter 的双向数据流同步；
 * 5. 顶栏浮动 Popup 目录（TOC Dropdown）与平滑滚动锚点联动；
 * 6. 原文返回与阅读会话保持；
 * 7. 桥接 SideloadManager 与 TranslationDockController，实现滑入式双语助读与行内助读；
 * 8. 驱动学术打印与 Markdown 文件导出。
 * ============================================================================
 */

import { sideloadManager } from '../../../components/sideload/sideload-manager.ts';
import { TranslationDockController } from '../../../services/translation/client/translation-dock-controller.ts';
import { initMermaid } from '../../../components/sidebar/mermaid-loader.ts';
import { initFormulaActions } from '../../../scripts/formula-actions.ts';
import {
  parseFrontmatter,
  serializeFrontmatter,
  renderDocument,
  combineDocument,
} from '../core/markdown-parser.ts';
import { ScratchpadStorage, TEMPLATE_PRESETS } from '../core/storage.ts';
import { loadFontPref, applyFontPref } from '../../../scripts/font-presets.ts';
import { loadFontSize, applyFontSize } from '../../../scripts/settings/typography-prefs.ts';
import type { DocumentMetadata, ScratchpadDraft, WorkspaceViewMode } from '../types.ts';

export class ScratchpadController {
  private static instance: ScratchpadController | null = null;
  private isInitialized = false;

  private currentViewMode: WorkspaceViewMode = 'split';
  private currentMetadata: DocumentMetadata = { title: '未命名草稿' };
  private currentBodyContent = '';
  private rawFrontmatterMode = false;

  // DOM 节点引用
  private rootEl: HTMLElement | null = null;
  private editorTextarea: HTMLTextAreaElement | null = null;
  private previewArticle: HTMLElement | null = null;
  private metaPanel: HTMLElement | null = null;
  private saveStatusEl: HTMLElement | null = null;
  private statsWordEl: HTMLElement | null = null;
  private statsCharEl: HTMLElement | null = null;
  private statsParaEl: HTMLElement | null = null;

  // 防抖计时器
  private renderDebounceTimer: number | null = null;
  private saveDebounceTimer: number | null = null;

  public static getInstance(): ScratchpadController {
    if (!this.instance) {
      this.instance = new ScratchpadController();
    }
    return this.instance;
  }

  public init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.rootEl = document.getElementById('scratchpad-root');
    if (!this.rootEl) return;

    this.isInitialized = true;
    this.editorTextarea = document.getElementById('scratchpad-textarea') as HTMLTextAreaElement | null;
    this.previewArticle = document.getElementById('blank-doc-article');
    this.metaPanel = document.getElementById('scratchpad-meta-panel');
    this.saveStatusEl = document.getElementById('scratchpad-save-status');
    this.statsWordEl = document.getElementById('scratchpad-stat-words');
    this.statsCharEl = document.getElementById('scratchpad-stat-chars');
    this.statsParaEl = document.getElementById('scratchpad-stat-paras');

    // 0. 同步全站学术阅读正文字体偏好与字阶
    this.syncTypographyPrefs();

    // 1. 初始化并同步返回原文章按钮
    this.syncBackButton();

    // 2. 恢复视口模式
    this.currentViewMode = ScratchpadStorage.getViewMode();
    this.applyViewMode(this.currentViewMode);

    // 3. 检查是否有来自阅读页的划选文段 (Snippet Import)
    const importedSnippet = ScratchpadStorage.consumeImportedSnippet();

    // 4. 加载草稿或默认文献翻译模板
    const savedDraft = ScratchpadStorage.loadDraft();
    if (importedSnippet) {
      // 读者选段唤起：载入选段作为新文献草稿
      this.currentMetadata = {
        title: '文献节选翻译与排版测试',
        description: '来自阅读时划选的学术文段',
        author: '外部文献',
        subject: '文献对照',
        tags: ['Snippet', 'Translation'],
      };
      this.currentBodyContent = `## 1. 选中文段\n\n${importedSnippet}\n`;
      this.saveCurrentDraft();
      this.showToast('已导入来自文章的划选文段');
    } else if (savedDraft) {
      this.currentMetadata = savedDraft.metadata || { title: '未命名草稿' };
      this.currentBodyContent = savedDraft.content || '';
    } else {
      // 默认加载文献翻译预设
      const defaultTpl = TEMPLATE_PRESETS[0];
      this.currentMetadata = { ...defaultTpl.draft.metadata };
      this.currentBodyContent = defaultTpl.draft.content;
    }

    // 5. 同步编辑器和元数据表单
    this.syncMetadataInputs();
    if (this.editorTextarea) {
      this.editorTextarea.value = this.currentBodyContent;
    }

    // 6. 初次编译渲染
    this.executeRender();

    // 7. 绑定全局事件委托与键盘快捷键
    this.bindEvents();
    this.bindEditorShortcuts();
    this.bindSideloadSync();
  }

  /**
   * 同步全站正文阅读字体（Latin + CJK 两栏体系）与字阶大小
   */
  private syncTypographyPrefs(): void {
    try {
      applyFontPref(loadFontPref());
      applyFontSize(loadFontSize());
    } catch (e) {
      console.warn('[ScratchpadController] 同步字体偏好失败:', e);
    }
  }

  /**
   * 同步返回原文章按钮状态
   */
  private syncBackButton(): void {
    const backBtn = document.getElementById('scratchpad-back-btn');
    if (!backBtn) return;

    try {
      const returnUrl = sessionStorage.getItem('astrolib_blank_return_url');
      if (returnUrl && !returnUrl.endsWith('/blank/') && !returnUrl.endsWith('/blank')) {
        backBtn.setAttribute('href', returnUrl);
        backBtn.setAttribute('title', '返回原文章');
        backBtn.setAttribute('aria-label', '返回原文章');
      }
    } catch {}
  }

  /**
   * 执行智能安全返回原文章逻辑
   */
  public handleNavigateBack(): void {
    try {
      const returnUrl = sessionStorage.getItem('astrolib_blank_return_url');
      if (returnUrl && !returnUrl.endsWith('/blank/') && !returnUrl.endsWith('/blank')) {
        window.location.href = returnUrl;
        return;
      }
    } catch {}

    if (document.referrer && document.referrer.startsWith(window.location.origin) && !document.referrer.includes('/blank')) {
      window.location.href = document.referrer;
      return;
    }

    if (window.opener && !window.opener.closed) {
      try {
        window.opener.focus();
        window.close();
        return;
      } catch {}
    }

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = '/';
  }

  /**
   * 应用视口布局模式（split / preview / edit）
   */
  public applyViewMode(mode: WorkspaceViewMode): void {
    this.currentViewMode = mode;
    ScratchpadStorage.setViewMode(mode);

    if (!this.rootEl) return;
    this.rootEl.classList.remove('view-split', 'view-preview', 'view-edit');
    this.rootEl.classList.add(`view-${mode}`);

    // 更新顶栏控制器状态
    const buttons = this.rootEl.querySelectorAll<HTMLButtonElement>('[data-view-mode]');
    buttons.forEach((btn) => {
      const btnMode = btn.getAttribute('data-view-mode');
      if (btnMode === mode) {
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('is-active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });

    // 触发图表重新自适应尺寸
    window.dispatchEvent(new Event('resize'));
  }

  /**
   * 执行 Markdown + KaTeX + 卡片渲染管线
   */
  private executeRender(): void {
    if (!this.previewArticle) return;

    const fullSource = combineDocument(this.currentMetadata, this.currentBodyContent);
    const parsed = renderDocument(fullSource);

    // 1. 写入正文 HTML
    this.previewArticle.innerHTML = parsed.html;

    // 2. 统计更新
    this.updateStats(this.currentBodyContent);

    // 3. 动态触发 Mermaid 图表编译
    try {
      initMermaid();
    } catch {}

    // 4. 绑定 KaTeX 公式一键复制
    try {
      initFormulaActions();
    } catch {}

    // 5. 动态同步顶栏浮动 Popup 目录 (TOC Dropdown)
    this.syncTocPopup(parsed.headings);
  }

  /**
   * 触发防抖实时渲染 (120ms)
   */
  public scheduleRender(): void {
    if (this.renderDebounceTimer) {
      window.clearTimeout(this.renderDebounceTimer);
    }
    this.renderDebounceTimer = window.setTimeout(() => {
      this.executeRender();
      this.scheduleSaveDraft();
    }, 120);
  }

  /**
   * 触发防抖草稿保存 (400ms)
   */
  private scheduleSaveDraft(): void {
    if (this.saveStatusEl) {
      this.saveStatusEl.textContent = '保存中...';
      this.saveStatusEl.classList.add('is-saving');
    }

    if (this.saveDebounceTimer) {
      window.clearTimeout(this.saveDebounceTimer);
    }

    this.saveDebounceTimer = window.setTimeout(() => {
      this.saveCurrentDraft();
      if (this.saveStatusEl) {
        this.saveStatusEl.textContent = '已自动保存在本地';
        this.saveStatusEl.classList.remove('is-saving');
      }
    }, 400);
  }

  /**
   * 持久化当前草稿
   */
  private saveCurrentDraft(): void {
    const draft: ScratchpadDraft = {
      metadata: this.currentMetadata,
      rawFrontmatter: serializeFrontmatter(this.currentMetadata),
      content: this.currentBodyContent,
      lastSaved: Date.now(),
    };
    ScratchpadStorage.saveDraft(draft);
  }

  /**
   * 同步更新顶栏浮动目录（TOC Dropdown）列表
   */
  private syncTocPopup(headings: Array<{ id: string; text: string; level: number }>): void {
    const tocList = document.getElementById('scratchpad-toc-list');
    const tocBadge = document.getElementById('scratchpad-toc-badge');

    if (tocBadge) {
      tocBadge.textContent = String(headings.length);
    }

    if (!tocList) return;

    if (headings.length === 0) {
      tocList.innerHTML = '<li class="scratchpad-toc-empty">暂无大纲（输入 # 标题即可生成）</li>';
      return;
    }

    const itemsHtml = headings
      .map((h) => {
        return `
          <li class="scratchpad-toc-popup-item level-${h.level}">
            <a href="#${h.id}" class="scratchpad-toc-popup-link" data-toc-target="${h.id}">
              ${h.text}
            </a>
          </li>
        `.trim();
      })
      .join('');

    tocList.innerHTML = itemsHtml;
  }

  /**
   * 切换顶栏浮动目录开合
   */
  public toggleTocPopup(open?: boolean): void {
    const popup = document.getElementById('scratchpad-toc-popup');
    const trigger = document.getElementById('scratchpad-toc-trigger');
    if (!popup) return;

    const shouldOpen = open !== undefined ? open : !popup.classList.contains('is-open');

    if (shouldOpen) {
      popup.classList.add('is-open');
      trigger?.classList.add('is-active');
      trigger?.setAttribute('aria-expanded', 'true');
    } else {
      popup.classList.remove('is-open');
      trigger?.classList.remove('is-active');
      trigger?.setAttribute('aria-expanded', 'false');
    }
  }

  /**
   * 打开模板选择对话框
   */
  public openTemplateModal(): void {
    const modal = document.getElementById('scratchpad-template-modal');
    if (modal) {
      modal.classList.add('is-open');
      const firstBtn = modal.querySelector<HTMLElement>('.scratchpad-tpl-card');
      firstBtn?.focus();
    }
  }

  /**
   * 关闭模板选择对话框
   */
  public closeTemplateModal(): void {
    const modal = document.getElementById('scratchpad-template-modal');
    modal?.classList.remove('is-open');
  }

  /**
   * 打开双语助读抽屉
   */
  public openTranslationDrawer(): void {
    // 1. 若当前处在仅编辑模式，自动切换到分屏模式以便看见对照预览
    if (this.currentViewMode === 'edit') {
      this.applyViewMode('split');
    }

    const drawer = document.getElementById('scratchpad-trans-drawer');
    drawer?.classList.add('is-open');
    document.getElementById('scratchpad-translate-btn')?.classList.add('is-active');

    // 激活侧载单例状态机
    sideloadManager.open('translate');

    // 启动段落翻译对齐引擎
    setTimeout(() => {
      try {
        const transController = TranslationDockController.getInstance();
        transController.startTranslation(true);
      } catch (err) {
        console.warn('[ScratchpadController] 启动双语助读失败:', err);
      }
    }, 80);
  }

  /**
   * 关闭双语助读抽屉
   */
  public closeTranslationDrawer(): void {
    const drawer = document.getElementById('scratchpad-trans-drawer');
    drawer?.classList.remove('is-open');
    document.getElementById('scratchpad-translate-btn')?.classList.remove('is-active');
    sideloadManager.open('none');
  }

  /**
   * 切换双语助读开合 (Alt+Y)
   */
  public toggleBilingualReading(): void {
    const transController = TranslationDockController.getInstance();

    if (transController.getDisplayMode() === 'inline') {
      // 行内段落下方对照模式
      if (this.currentViewMode === 'edit') {
        this.applyViewMode('split');
      }
      transController.toggleInlineTranslation();
      return;
    }

    // 侧滑抽屉对照模式
    const drawer = document.getElementById('scratchpad-trans-drawer');
    if (drawer?.classList.contains('is-open')) {
      this.closeTranslationDrawer();
    } else {
      this.openTranslationDrawer();
    }
  }

  /**
   * 监听侧载与抽屉联动
   */
  private bindSideloadSync(): void {
    window.addEventListener('astrolib:sideload-change', (e: any) => {
      const activeId = e?.detail?.activePanelId;
      const drawer = document.getElementById('scratchpad-trans-drawer');
      const translateBtn = document.getElementById('scratchpad-translate-btn');

      if (activeId === 'translate') {
        drawer?.classList.add('is-open');
        translateBtn?.classList.add('is-active');
      } else {
        drawer?.classList.remove('is-open');
        translateBtn?.classList.remove('is-active');
      }
    });
  }

  /**
   * 计算字符、字数与段落统计
   */
  private updateStats(text: string): void {
    const clean = text.trim();
    const chars = clean.length;
    // 简易中英文混合字数估算
    const words = (clean.match(/[\u4e00-\u9fa5]|[a-zA-Z0-9_\-]+/g) || []).length;
    const paras = clean ? clean.split(/\n\s*\n/).filter(Boolean).length : 0;

    if (this.statsCharEl) this.statsCharEl.textContent = `${chars} 字符`;
    if (this.statsWordEl) this.statsWordEl.textContent = `${words} 词`;
    if (this.statsParaEl) this.statsParaEl.textContent = `${paras} 段落`;
  }

  /**
   * 同步元数据输入框表单
   */
  private syncMetadataInputs(): void {
    const titleInput = document.getElementById('meta-field-title') as HTMLInputElement | null;
    const descInput = document.getElementById('meta-field-desc') as HTMLInputElement | null;
    const authorInput = document.getElementById('meta-field-author') as HTMLInputElement | null;
    const subjectInput = document.getElementById('meta-field-subject') as HTMLInputElement | null;
    const tagsInput = document.getElementById('meta-field-tags') as HTMLInputElement | null;
    const rawYamlTextarea = document.getElementById('meta-field-raw-yaml') as HTMLTextAreaElement | null;
    const docTitleHeader = document.getElementById('scratchpad-doc-title-header');

    if (titleInput) titleInput.value = this.currentMetadata.title || '';
    if (descInput) descInput.value = this.currentMetadata.description || '';
    if (authorInput) authorInput.value = this.currentMetadata.author || '';
    if (subjectInput) subjectInput.value = this.currentMetadata.subject || '';
    if (tagsInput) tagsInput.value = (this.currentMetadata.tags || []).join(', ');
    if (rawYamlTextarea) rawYamlTextarea.value = serializeFrontmatter(this.currentMetadata);
    if (docTitleHeader) docTitleHeader.textContent = this.currentMetadata.title || '空白文档';
  }

  /**
   * 从表单控件读取元数据
   */
  private readMetadataFromInputs(): void {
    const titleInput = document.getElementById('meta-field-title') as HTMLInputElement | null;
    const descInput = document.getElementById('meta-field-desc') as HTMLInputElement | null;
    const authorInput = document.getElementById('meta-field-author') as HTMLInputElement | null;
    const subjectInput = document.getElementById('meta-field-subject') as HTMLInputElement | null;
    const tagsInput = document.getElementById('meta-field-tags') as HTMLInputElement | null;
    const docTitleHeader = document.getElementById('scratchpad-doc-title-header');

    this.currentMetadata = {
      ...this.currentMetadata,
      title: titleInput?.value.trim() || '未命名草稿',
      description: descInput?.value.trim() || undefined,
      author: authorInput?.value.trim() || undefined,
      subject: subjectInput?.value.trim() || undefined,
      tags: tagsInput?.value
        ? tagsInput.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
        : undefined,
    };

    if (docTitleHeader) {
      docTitleHeader.textContent = this.currentMetadata.title;
    }

    const rawYamlTextarea = document.getElementById('meta-field-raw-yaml') as HTMLTextAreaElement | null;
    if (rawYamlTextarea && !this.rawFrontmatterMode) {
      rawYamlTextarea.value = serializeFrontmatter(this.currentMetadata);
    }

    this.scheduleRender();
  }

  /**
   * 在编辑器光标处插入内容
   */
  public insertSnippet(prefix: string, suffix: string = '', defaultPlaceholder: string = ''): void {
    const ta = this.editorTextarea;
    if (!ta) return;

    ta.focus();
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.substring(start, end);
    const contentToInsert = selected || defaultPlaceholder;
    const replacement = `${prefix}${contentToInsert}${suffix}`;

    ta.setRangeText(replacement, start, end, 'end');

    // 选中占位符或移到后缀前
    if (!selected && defaultPlaceholder) {
      ta.setSelectionRange(start + prefix.length, start + prefix.length + defaultPlaceholder.length);
    }

    this.currentBodyContent = ta.value;
    this.scheduleRender();
  }

  /**
   * 载入预设模板
   */
  public loadTemplate(templateId: string): void {
    const preset = ScratchpadStorage.getTemplate(templateId);
    this.currentMetadata = { ...preset.draft.metadata };
    this.currentBodyContent = preset.draft.content;

    if (this.editorTextarea) {
      this.editorTextarea.value = this.currentBodyContent;
    }

    this.syncMetadataInputs();
    this.executeRender();
    this.scheduleSaveDraft();
    this.showToast(`已载入模板: ${preset.title}`);
  }

  /**
   * 重置清空当前文档
   */
  public resetDraft(): void {
    ScratchpadStorage.clearDraft();
    const cleanTpl = TEMPLATE_PRESETS.find((t) => t.id === 'clean-blank') || TEMPLATE_PRESETS[0];
    this.loadTemplate(cleanTpl.id);
    this.showToast('已重置草稿');
  }

  /**
   * 导出为 Markdown 文件
   */
  public exportMarkdownFile(): void {
    const full = combineDocument(this.currentMetadata, this.currentBodyContent);
    const titleSlug = (this.currentMetadata.title || 'document').replace(/[^\w\u4e00-\u9fa5]/g, '_');
    const filename = `${titleSlug}.md`;

    const blob = new Blob([full], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast('Markdown 文档导出成功');
  }

  /**
   * 导出 / 打印 PDF (仅打印预览正文部分)
   */
  public exportPrintPdf(): void {
    // 1. 关闭任何打开中的弹窗与侧抽屉
    this.closeTemplateModal();
    this.toggleTocPopup(false);
    this.closeTranslationDrawer();

    // 2. 打印前切至预览或分屏状态
    if (this.currentViewMode === 'edit') {
      this.applyViewMode('preview');
    }

    setTimeout(() => {
      window.print();
    }, 150);
  }

  /**
   * 轻量气泡提示
   */
  private showToast(msg: string): void {
    let toast = document.getElementById('scratchpad-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'scratchpad-toast';
      toast.className = 'scratchpad-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('is-visible');
    setTimeout(() => {
      toast?.classList.remove('is-visible');
    }, 2400);
  }

  /**
   * 绑定事件委托
   */
  private bindEvents(): void {
    // 1. 文本域输入监听
    this.editorTextarea?.addEventListener('input', () => {
      if (this.editorTextarea) {
        this.currentBodyContent = this.editorTextarea.value;
        this.scheduleRender();
      }
    });

    // 2. 元数据面板字段变更
    const metaInputs = [
      'meta-field-title',
      'meta-field-desc',
      'meta-field-author',
      'meta-field-subject',
      'meta-field-tags',
    ];
    metaInputs.forEach((id) => {
      document.getElementById(id)?.addEventListener('input', () => {
        this.readMetadataFromInputs();
      });
    });

    // 3. 元数据 YAML 原始模式切换
    const yamlToggleBtn = document.getElementById('meta-toggle-raw-yaml');
    yamlToggleBtn?.addEventListener('click', () => {
      this.rawFrontmatterMode = !this.rawFrontmatterMode;
      const formFields = document.getElementById('meta-form-fields');
      const rawField = document.getElementById('meta-raw-yaml-field');

      if (this.rawFrontmatterMode) {
        formFields?.setAttribute('hidden', '');
        rawField?.removeAttribute('hidden');
        if (yamlToggleBtn) yamlToggleBtn.textContent = '切换至表单模式';
      } else {
        formFields?.removeAttribute('hidden');
        rawField?.setAttribute('hidden', '');
        if (yamlToggleBtn) yamlToggleBtn.textContent = '切换至 YAML 源码';
      }
    });

    // 4. YAML 原始输入实时反解析
    const rawYamlTextarea = document.getElementById('meta-field-raw-yaml') as HTMLTextAreaElement | null;
    rawYamlTextarea?.addEventListener('input', () => {
      if (rawYamlTextarea) {
        const parsed = parseFrontmatter(`---\n${rawYamlTextarea.value}\n---\n`);
        this.currentMetadata = parsed.metadata;
        this.syncMetadataInputs();
        this.scheduleRender();
      }
    });

    // 5. 元数据面板展开/收起切换
    const metaToggleBtn = document.getElementById('scratchpad-meta-toggle');
    metaToggleBtn?.addEventListener('click', () => {
      if (!this.metaPanel) return;
      const isExpanded = this.metaPanel.classList.toggle('is-open');
      metaToggleBtn.setAttribute('aria-expanded', String(isExpanded));
      metaToggleBtn.classList.toggle('is-active', isExpanded);
    });

    // 6. 全局操作委托
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // 返回原文章
      if (target.closest('#scratchpad-back-btn')) {
        e.preventDefault();
        this.handleNavigateBack();
        return;
      }

      // 视口模式切换
      const viewModeBtn = target.closest<HTMLButtonElement>('[data-view-mode]');
      if (viewModeBtn) {
        e.preventDefault();
        const mode = viewModeBtn.getAttribute('data-view-mode') as WorkspaceViewMode | null;
        if (mode) this.applyViewMode(mode);
        return;
      }

      // 切换顶栏浮动目录
      if (target.closest('#scratchpad-toc-trigger')) {
        e.preventDefault();
        this.toggleTocPopup();
        return;
      }

      // 关闭顶栏浮动目录
      if (target.closest('#scratchpad-toc-popup-close')) {
        e.preventDefault();
        this.toggleTocPopup(false);
        return;
      }

      // 点击目录项平滑滚动至对应标题
      const tocLink = target.closest<HTMLAnchorElement>('[data-toc-target]');
      if (tocLink) {
        e.preventDefault();
        const targetId = tocLink.getAttribute('data-toc-target');
        if (targetId) {
          const headingEl = document.getElementById(targetId);
          if (headingEl) {
            headingEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
        this.toggleTocPopup(false);
        return;
      }

      // 点击空白处关闭顶栏浮动目录
      const tocDropdownWrap = target.closest('.scratchpad-toc-dropdown-wrap');
      if (!tocDropdownWrap) {
        this.toggleTocPopup(false);
      }

      // 双语助读触发
      if (target.closest('[data-scratchpad-translate]')) {
        e.preventDefault();
        this.toggleBilingualReading();
        return;
      }

      // 关闭双语助读侧抽屉
      if (target.closest('#trans-back-to-toc') || target.closest('#trans-sidebar-close')) {
        e.preventDefault();
        this.closeTranslationDrawer();
        return;
      }

      // 导出 PDF 打印
      if (target.closest('[data-scratchpad-print]')) {
        e.preventDefault();
        this.exportPrintPdf();
        return;
      }

      // 导出 Markdown 文件
      if (target.closest('[data-scratchpad-export-md]')) {
        e.preventDefault();
        this.exportMarkdownFile();
        return;
      }

      // 打开模板选择对话框
      if (target.closest('[data-scratchpad-open-templates]')) {
        e.preventDefault();
        this.openTemplateModal();
        return;
      }

      // 关闭模板选择对话框
      if (target.closest('#scratchpad-template-close-btn') || target.id === 'scratchpad-template-modal') {
        e.preventDefault();
        this.closeTemplateModal();
        return;
      }

      // 选中某个模板
      const tplCard = target.closest<HTMLElement>('[data-template-id]');
      if (tplCard) {
        e.preventDefault();
        const tplId = tplCard.getAttribute('data-template-id');
        if (tplId) {
          this.loadTemplate(tplId);
          this.closeTemplateModal();
        }
        return;
      }

      // 重置清空草稿
      if (target.closest('[data-scratchpad-reset]')) {
        e.preventDefault();
        if (window.confirm('确定要清空当前草稿并重置为初始空白状态吗？未保存的内容将无法找回。')) {
          this.resetDraft();
        }
        return;
      }

      // 快捷插入工具栏按钮
      const insertBtn = target.closest<HTMLButtonElement>('[data-insert-action]');
      if (insertBtn) {
        e.preventDefault();
        const action = insertBtn.getAttribute('data-insert-action');
        this.handleToolbarInsert(action);
        return;
      }
    });

    // 7. 监听全站字体与字阶变更事件联动
    window.addEventListener('astrolib:font-change', (e: any) => {
      if (e?.detail) {
        applyFontPref(e.detail);
      }
    });

    window.addEventListener('storage', (e) => {
      if (e.key === 'starlight-font') {
        applyFontPref(loadFontPref());
      } else if (e.key === 'astrolib_font_size') {
        applyFontSize(loadFontSize());
      }
    });
  }

  /**
   * 处理工具栏快捷插入
   */
  private handleToolbarInsert(action: string | null): void {
    if (!action) return;
    switch (action) {
      case 'h2':
        this.insertSnippet('\n## ', '\n', '二级标题');
        break;
      case 'h3':
        this.insertSnippet('\n### ', '\n', '三级标题');
        break;
      case 'bold':
        this.insertSnippet('**', '**', '加粗文本');
        break;
      case 'math-inline':
        this.insertSnippet('$', '$', 'x^2 + y^2 = r^2');
        break;
      case 'math-block':
        this.insertSnippet('\n$$\n', '\n$$\n', '\\int_0^1 f(x) \\, dx = F(1) - F(0)');
        break;
      case 'theorem':
        this.insertSnippet('\n<Theorem title="定理 1.1 (名称)">\n', '\n</Theorem>\n', '在此输入定理陈述。');
        break;
      case 'definition':
        this.insertSnippet('\n<Definition title="定义 1.1 (概念)">\n', '\n</Definition>\n', '在此输入定义说明。');
        break;
      case 'example':
        this.insertSnippet('\n<Example title="例题 1.1">\n', '\n</Example>\n', '在此输入题目条件与求解目标。');
        break;
      case 'note':
        this.insertSnippet('\n<Note title="注意事项">\n', '\n</Note>\n', '在此输入注解与易错点分析。');
        break;
      case 'solution':
        this.insertSnippet('\n<Solution title="查看步骤解析">\n', '\n</Solution>\n', '在此输入详尽解答与推导。');
        break;
      case 'algorithm':
        this.insertSnippet('\n<Algorithm title="算法 1 (名称)">\n', '\n</Algorithm>\n', '1. 初始化参数；\n2. 迭代求解。');
        break;
      case 'mermaid':
        this.insertSnippet('\n```mermaid\nflowchart TD\n    A[输入] --> B(处理模块)\n    B --> C[输出结果]\n```\n');
        break;
      case 'table':
        this.insertSnippet('\n| 列 1 | 列 2 | 列 3 |\n| :--- | :---: | ---: |\n| 内容 A | 内容 B | 内容 C |\n');
        break;
      case 'quote':
        this.insertSnippet('\n> ', '\n', '引用文字');
        break;
      case 'code':
        this.insertSnippet('\n```ts\n', '\n```\n', '// 代码块');
        break;
    }
  }

  /**
   * 绑定编辑器键盘操作（Tab、自动括号成对、Alt+快捷键、Esc关闭弹窗）
   */
  private bindEditorShortcuts(): void {
    const ta = this.editorTextarea;

    if (ta) {
      ta.addEventListener('keydown', (e) => {
        // 1. Tab 缩进 (2 个空格)
        if (e.key === 'Tab') {
          e.preventDefault();
          const start = ta.selectionStart;
          const end = ta.selectionEnd;

          if (e.shiftKey) {
            // Shift + Tab 反缩进
            const before = ta.value.substring(0, start);
            if (before.endsWith('  ')) {
              ta.setRangeText('', start - 2, start, 'end');
            }
          } else {
            // Tab 插入 2 空格
            ta.setRangeText('  ', start, end, 'end');
          }

          this.currentBodyContent = ta.value;
          this.scheduleRender();
          return;
        }

        // 2. 符号成对自动闭合
        const pairs: Record<string, string> = {
          '(': ')',
          '[': ']',
          '{': '}',
          '"': '"',
          "'": "'",
          '`': '`',
          '$': '$',
        };

        if (pairs[e.key] && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const start = ta.selectionStart;
          const end = ta.selectionEnd;
          if (start !== end) {
            // 选中文字时包围文字
            e.preventDefault();
            const selected = ta.value.substring(start, end);
            const closed = `${e.key}${selected}${pairs[e.key]}`;
            ta.setRangeText(closed, start, end, 'end');
            this.currentBodyContent = ta.value;
            this.scheduleRender();
            return;
          }
        }
      });
    }

    // 3. 全局按键：Esc 关闭弹窗/目录/抽屉；Alt+Y 助读；Alt+P 打印；Alt+O 目录；Ctrl+S 保存
    window.addEventListener('keydown', (e) => {
      // Escape 一键退出所有浮层
      if (e.key === 'Escape') {
        const modal = document.getElementById('scratchpad-template-modal');
        if (modal?.classList.contains('is-open')) {
          this.closeTemplateModal();
          return;
        }
        const popup = document.getElementById('scratchpad-toc-popup');
        if (popup?.classList.contains('is-open')) {
          this.toggleTocPopup(false);
          return;
        }
        const drawer = document.getElementById('scratchpad-trans-drawer');
        if (drawer?.classList.contains('is-open')) {
          this.closeTranslationDrawer();
          return;
        }
      }

      if (e.altKey && e.key.toLowerCase() === 'y' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        this.toggleBilingualReading();
      } else if (e.altKey && e.key.toLowerCase() === 'o' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        this.toggleTocPopup();
      } else if (e.altKey && e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        this.exportPrintPdf();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        this.saveCurrentDraft();
        this.showToast('草稿已立即保存');
      }
    });
  }
}
