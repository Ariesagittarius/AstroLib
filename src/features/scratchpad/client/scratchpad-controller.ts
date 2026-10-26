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

  private rootEl: HTMLElement | null = null;
  private editorTextarea: HTMLTextAreaElement | null = null;
  private previewArticle: HTMLElement | null = null;
  private metaPanel: HTMLElement | null = null;
  private saveStatusEl: HTMLElement | null = null;
  private statsWordEl: HTMLElement | null = null;
  private statsCharEl: HTMLElement | null = null;
  private statsParaEl: HTMLElement | null = null;

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

    this.syncTypographyPrefs();

    this.syncBackButton();

    this.currentViewMode = ScratchpadStorage.getViewMode();
    this.applyViewMode(this.currentViewMode);

    const importedSnippet = ScratchpadStorage.consumeImportedSnippet();

    const savedDraft = ScratchpadStorage.loadDraft();
    if (importedSnippet) {

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

      const defaultTpl = TEMPLATE_PRESETS[0];
      this.currentMetadata = { ...defaultTpl.draft.metadata };
      this.currentBodyContent = defaultTpl.draft.content;
    }

    this.syncMetadataInputs();
    if (this.editorTextarea) {
      this.editorTextarea.value = this.currentBodyContent;
    }

    this.executeRender();

    this.bindEvents();
    this.bindEditorShortcuts();
    this.bindSideloadSync();
  }

  private syncTypographyPrefs(): void {
    try {
      applyFontPref(loadFontPref());
      applyFontSize(loadFontSize());
    } catch (e) {
      console.warn('[ScratchpadController] 同步字体偏好失败:', e);
    }
  }

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

  public applyViewMode(mode: WorkspaceViewMode): void {
    this.currentViewMode = mode;
    ScratchpadStorage.setViewMode(mode);

    if (!this.rootEl) return;
    this.rootEl.classList.remove('view-split', 'view-preview', 'view-edit');
    this.rootEl.classList.add(`view-${mode}`);

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

    window.dispatchEvent(new Event('resize'));
  }

  private executeRender(): void {
    if (!this.previewArticle) return;

    const fullSource = combineDocument(this.currentMetadata, this.currentBodyContent);
    const parsed = renderDocument(fullSource);

    this.previewArticle.innerHTML = parsed.html;

    this.updateStats(this.currentBodyContent);

    try {
      initMermaid();
    } catch {}

    try {
      initFormulaActions();
    } catch {}

    this.syncTocPopup(parsed.headings);
  }

  public scheduleRender(): void {
    if (this.renderDebounceTimer) {
      window.clearTimeout(this.renderDebounceTimer);
    }
    this.renderDebounceTimer = window.setTimeout(() => {
      this.executeRender();
      this.scheduleSaveDraft();
    }, 120);
  }

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

  private saveCurrentDraft(): void {
    const draft: ScratchpadDraft = {
      metadata: this.currentMetadata,
      rawFrontmatter: serializeFrontmatter(this.currentMetadata),
      content: this.currentBodyContent,
      lastSaved: Date.now(),
    };
    ScratchpadStorage.saveDraft(draft);
  }

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

  public openTemplateModal(): void {
    const modal = document.getElementById('scratchpad-template-modal');
    if (modal) {
      modal.classList.add('is-open');
      const firstBtn = modal.querySelector<HTMLElement>('.scratchpad-tpl-card');
      firstBtn?.focus();
    }
  }

  public closeTemplateModal(): void {
    const modal = document.getElementById('scratchpad-template-modal');
    modal?.classList.remove('is-open');
  }

  public openTranslationDrawer(): void {

    if (this.currentViewMode === 'edit') {
      this.applyViewMode('split');
    }

    const drawer = document.getElementById('scratchpad-trans-drawer');
    drawer?.classList.add('is-open');
    document.getElementById('scratchpad-translate-btn')?.classList.add('is-active');

    sideloadManager.open('translate');

    setTimeout(() => {
      try {
        const transController = TranslationDockController.getInstance();
        transController.startTranslation(true);
      } catch (err) {
        console.warn('[ScratchpadController] 启动双语助读失败:', err);
      }
    }, 80);
  }

  public closeTranslationDrawer(): void {
    const drawer = document.getElementById('scratchpad-trans-drawer');
    drawer?.classList.remove('is-open');
    document.getElementById('scratchpad-translate-btn')?.classList.remove('is-active');
    sideloadManager.open('none');
  }

  public toggleBilingualReading(): void {
    const transController = TranslationDockController.getInstance();

    if (transController.getDisplayMode() === 'inline') {

      if (this.currentViewMode === 'edit') {
        this.applyViewMode('split');
      }
      transController.toggleInlineTranslation();
      return;
    }

    const drawer = document.getElementById('scratchpad-trans-drawer');
    if (drawer?.classList.contains('is-open')) {
      this.closeTranslationDrawer();
    } else {
      this.openTranslationDrawer();
    }
  }

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

  private updateStats(text: string): void {
    const clean = text.trim();
    const chars = clean.length;

    const words = (clean.match(/[\u4e00-\u9fa5]|[a-zA-Z0-9_\-]+/g) || []).length;
    const paras = clean ? clean.split(/\n\s*\n/).filter(Boolean).length : 0;

    if (this.statsCharEl) this.statsCharEl.textContent = `${chars} 字符`;
    if (this.statsWordEl) this.statsWordEl.textContent = `${words} 词`;
    if (this.statsParaEl) this.statsParaEl.textContent = `${paras} 段落`;
  }

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

    if (!selected && defaultPlaceholder) {
      ta.setSelectionRange(start + prefix.length, start + prefix.length + defaultPlaceholder.length);
    }

    this.currentBodyContent = ta.value;
    this.scheduleRender();
  }

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

  public resetDraft(): void {
    ScratchpadStorage.clearDraft();
    const cleanTpl = TEMPLATE_PRESETS.find((t) => t.id === 'clean-blank') || TEMPLATE_PRESETS[0];
    this.loadTemplate(cleanTpl.id);
    this.showToast('已重置草稿');
  }

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

  public exportPrintPdf(): void {

    this.closeTemplateModal();
    this.toggleTocPopup(false);
    this.closeTranslationDrawer();

    if (this.currentViewMode === 'edit') {
      this.applyViewMode('preview');
    }

    setTimeout(() => {
      window.print();
    }, 150);
  }

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

  private bindEvents(): void {

    this.editorTextarea?.addEventListener('input', () => {
      if (this.editorTextarea) {
        this.currentBodyContent = this.editorTextarea.value;
        this.scheduleRender();
      }
    });

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

    const rawYamlTextarea = document.getElementById('meta-field-raw-yaml') as HTMLTextAreaElement | null;
    rawYamlTextarea?.addEventListener('input', () => {
      if (rawYamlTextarea) {
        const parsed = parseFrontmatter(`---\n${rawYamlTextarea.value}\n---\n`);
        this.currentMetadata = parsed.metadata;
        this.syncMetadataInputs();
        this.scheduleRender();
      }
    });

    const metaToggleBtn = document.getElementById('scratchpad-meta-toggle');
    metaToggleBtn?.addEventListener('click', () => {
      if (!this.metaPanel) return;
      const isExpanded = this.metaPanel.classList.toggle('is-open');
      metaToggleBtn.setAttribute('aria-expanded', String(isExpanded));
      metaToggleBtn.classList.toggle('is-active', isExpanded);
    });

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (target.closest('#scratchpad-back-btn')) {
        e.preventDefault();
        this.handleNavigateBack();
        return;
      }

      const viewModeBtn = target.closest<HTMLButtonElement>('[data-view-mode]');
      if (viewModeBtn) {
        e.preventDefault();
        const mode = viewModeBtn.getAttribute('data-view-mode') as WorkspaceViewMode | null;
        if (mode) this.applyViewMode(mode);
        return;
      }

      if (target.closest('#scratchpad-toc-trigger')) {
        e.preventDefault();
        this.toggleTocPopup();
        return;
      }

      if (target.closest('#scratchpad-toc-popup-close')) {
        e.preventDefault();
        this.toggleTocPopup(false);
        return;
      }

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

      const tocDropdownWrap = target.closest('.scratchpad-toc-dropdown-wrap');
      if (!tocDropdownWrap) {
        this.toggleTocPopup(false);
      }

      if (target.closest('[data-scratchpad-translate]')) {
        e.preventDefault();
        this.toggleBilingualReading();
        return;
      }

      if (target.closest('#trans-back-to-toc') || target.closest('#trans-sidebar-close')) {
        e.preventDefault();
        this.closeTranslationDrawer();
        return;
      }

      if (target.closest('[data-scratchpad-print]')) {
        e.preventDefault();
        this.exportPrintPdf();
        return;
      }

      if (target.closest('[data-scratchpad-export-md]')) {
        e.preventDefault();
        this.exportMarkdownFile();
        return;
      }

      if (target.closest('[data-scratchpad-open-templates]')) {
        e.preventDefault();
        this.openTemplateModal();
        return;
      }

      if (target.closest('#scratchpad-template-close-btn') || target.id === 'scratchpad-template-modal') {
        e.preventDefault();
        this.closeTemplateModal();
        return;
      }

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

      if (target.closest('[data-scratchpad-reset]')) {
        e.preventDefault();
        if (window.confirm('确定要清空当前草稿并重置为初始空白状态吗？未保存的内容将无法找回。')) {
          this.resetDraft();
        }
        return;
      }

      const insertBtn = target.closest<HTMLButtonElement>('[data-insert-action]');
      if (insertBtn) {
        e.preventDefault();
        const action = insertBtn.getAttribute('data-insert-action');
        this.handleToolbarInsert(action);
        return;
      }
    });

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

  private bindEditorShortcuts(): void {
    const ta = this.editorTextarea;

    if (ta) {
      ta.addEventListener('keydown', (e) => {

        if (e.key === 'Tab') {
          e.preventDefault();
          const start = ta.selectionStart;
          const end = ta.selectionEnd;

          if (e.shiftKey) {

            const before = ta.value.substring(0, start);
            if (before.endsWith('  ')) {
              ta.setRangeText('', start - 2, start, 'end');
            }
          } else {

            ta.setRangeText('  ', start, end, 'end');
          }

          this.currentBodyContent = ta.value;
          this.scheduleRender();
          return;
        }

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

    window.addEventListener('keydown', (e) => {

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
