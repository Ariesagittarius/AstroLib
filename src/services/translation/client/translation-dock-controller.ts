import { sideloadManager } from '../../../components/sideload/sideload-manager.ts';
import { getProviderApiKey, saveProviderApiKey, AI_CONFIG_CHANGE_EVENT } from '../../../ai/ai-config.ts';
import { ParagraphAligner } from '../paragraph-aligner.ts';
import {
  TranslationStorage,
  TRANSLATION_DISPLAY_MODE_CHANGE_EVENT,
  TRANSLATION_PROVIDER_CHANGE_EVENT,
} from '../storage/translation-storage.ts';
import { TranslationExporter } from '../export/translation-exporter.ts';
import { StructurePreservingMasker } from '../masker.ts';
import type { ParagraphUnit, TranslationProviderId, TranslationExportFormat, TranslationDisplayMode } from '../types.ts';

let _renderMath: any = null;
async function renderMathInElementSafely(elem: HTMLElement) {
  try {
    if (!_renderMath) {
      const mod = await import('katex/dist/contrib/auto-render.mjs');
      _renderMath = mod.default || mod;
    }
    _renderMath(elem, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true },
      ],
      throwOnError: false,
    });
  } catch (err) {
    console.warn('[TranslationDock] KaTeX auto-render 降级:', err);
  }
}

export class TranslationDockController {
  private static instance: TranslationDockController | null = null;
  private isInitialized = false;
  private currentProvider: TranslationProviderId = 'google';
  private displayMode: TranslationDisplayMode = 'sidebar';
  private isInlineActive = false;
  private currentChapterKey: string = '';
  private paragraphs: ParagraphUnit[] = [];
  private isTranslating = false;
  private isSettingsOpen = false;
  private isExportOpen = false;
  private selectedExportFormat: TranslationExportFormat = 'bilingual-markdown';
  private selectedExportScope: 'all' | 'satisfied' = 'all';
  private unbindSync: (() => void) | null = null;
  private abortController: AbortController | null = null;

  public static getInstance(): TranslationDockController {
    if (!this.instance) {
      this.instance = new TranslationDockController();
    }
    return this.instance;
  }

  public init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    this.currentProvider = TranslationStorage.getProvider();
    this.displayMode = TranslationStorage.getDisplayMode();

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (target.closest('#trans-back-to-toc') || target.closest('#trans-sidebar-close')) {
        e.preventDefault();
        sideloadManager.switchToDefault();
        return;
      }

      if (target.closest('#trans-sidebar-refresh')) {
        e.preventDefault();
        if (this.displayMode === 'sidebar') {
          this.startTranslation(true);
        } else {
          this.showInlineTranslations(true);
        }
        return;
      }

      if (target.closest('#trans-inline-refresh-btn')) {
        e.preventDefault();
        this.showInlineTranslations(true);
        return;
      }

      if (target.closest('#trans-inline-exit-btn')) {
        e.preventDefault();
        this.hideInlineTranslations();
        return;
      }

      const inlinePill = target.closest<HTMLButtonElement>('[data-inline-provider]');
      if (inlinePill) {
        e.preventDefault();
        const p = inlinePill.getAttribute('data-inline-provider') as TranslationProviderId | null;
        if (p && p !== this.currentProvider) {
          this.setProvider(p);
        }
        return;
      }

      if (target.closest('#trans-sidebar-settings')) {
        e.preventDefault();
        this.toggleSettingsDrawer();
        return;
      }

      if (target.closest('#trans-settings-close')) {
        e.preventDefault();
        this.toggleSettingsDrawer(false);
        return;
      }

      if (target.closest('#trans-sidebar-export')) {
        e.preventDefault();
        this.toggleExportDrawer();
        return;
      }

      if (target.closest('#trans-export-close')) {
        e.preventDefault();
        this.toggleExportDrawer(false);
        return;
      }

      if (target.closest('#trans-export-download')) {
        e.preventDefault();
        this.handleExportDownload();
        return;
      }

      if (target.closest('#trans-export-approve-all')) {
        e.preventDefault();
        this.handleMarkAllSatisfied();
        return;
      }

      const fmtChip = target.closest<HTMLButtonElement>('[data-export-fmt]');
      if (fmtChip) {
        e.preventDefault();
        const fmt = fmtChip.getAttribute('data-export-fmt') as TranslationExportFormat;
        if (fmt) {
          this.selectedExportFormat = fmt;
          this.syncExportDrawerUI();
        }
        return;
      }

      const scopeChip = target.closest<HTMLButtonElement>('[data-export-scope]');
      if (scopeChip) {
        e.preventDefault();
        const scope = scopeChip.getAttribute('data-export-scope') as 'all' | 'satisfied';
        if (scope) {
          this.selectedExportScope = scope;
          this.syncExportDrawerUI();
        }
        return;
      }

      if (target.closest('#trans-key-toggle-eye')) {
        e.preventDefault();
        this.toggleKeyVisibility();
        return;
      }

      if (target.closest('#trans-settings-save')) {
        e.preventDefault();
        this.handleSaveKey();
        return;
      }

      if (target.closest('#trans-settings-clear')) {
        e.preventDefault();
        this.handleClearKey();
        return;
      }

      if (target.closest('#trans-settings-more')) {
        e.preventDefault();
        this.openFullAiSettings();
        return;
      }

      const chip = target.closest<HTMLButtonElement>('.trans-provider-chips [data-provider]');
      if (chip) {
        e.preventDefault();
        const targetProvider = chip.getAttribute('data-provider') as TranslationProviderId;
        if (targetProvider && targetProvider !== this.currentProvider) {
          this.setProvider(targetProvider);
        }
        return;
      }

      const modeChip = target.closest<HTMLButtonElement>('[data-trans-mode]');
      if (modeChip) {
        e.preventDefault();
        const targetMode = modeChip.getAttribute('data-trans-mode') as TranslationDisplayMode | null;
        if (targetMode) {
          this.setDisplayMode(targetMode, true, true);
        }
        return;
      }

      const trigger = target.closest('[data-translation-trigger]');
      if (trigger) {
        e.preventDefault();
        this.handleTriggerClick();
        return;
      }
    });

    document.addEventListener('input', (e) => {
      const target = e.target as HTMLElement | null;
      if (target && target.id === 'trans-api-key-input') {
        this.handleKeyInput((target as HTMLInputElement).value);
      }
    });

    document.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement | null;
      if (target && target.id === 'trans-api-key-input' && e.key === 'Enter') {
        e.preventDefault();
        this.handleSaveKey();
      }
    });

    window.addEventListener(AI_CONFIG_CHANGE_EVENT, () => {
      this.syncSettingsDrawerUI();
    });

    window.addEventListener(TRANSLATION_DISPLAY_MODE_CHANGE_EVENT, (e: any) => {
      const mode = e?.detail?.mode;
      const forceTrigger = Boolean(e?.detail?.forceTrigger);
      if (mode && (mode === 'sidebar' || mode === 'inline')) {
        this.setDisplayMode(mode, false, forceTrigger);
      }
    });

    window.addEventListener(TRANSLATION_PROVIDER_CHANGE_EVENT, (e: any) => {
      const p = e?.detail?.provider as TranslationProviderId | undefined;
      if (p && p !== this.currentProvider) {
        this.setProvider(p);
      }
    });

    window.addEventListener('astrolib:sideload-change', (e: any) => {
      const activeId = e?.detail?.activePanelId;
      if (activeId === 'translate') {
        if (this.displayMode === 'inline') {

          sideloadManager.switchToDefault();
          return;
        }
        this.onPanelActivated();
      }
    });

    document.addEventListener('astro:page-load', () => {
      const newKey = TranslationStorage.normalizeKey();
      if (this.currentChapterKey !== newKey) {
        this.currentChapterKey = newKey;
        this.paragraphs = [];
        if (this.unbindSync) {
          this.unbindSync();
          this.unbindSync = null;
        }
      }
      this.syncDisplayModeChips();
      if (this.displayMode === 'sidebar') {
        if (sideloadManager.getActivePanelId() === 'translate') {
          this.onPanelActivated();
        }
      } else if (this.displayMode === 'inline') {
        if (this.isInlineActive) {
          this.showInlineTranslations();
        }
      }
    });

    window.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'MD-OUTLINED-TEXT-FIELD' || target.isContentEditable)) {
        return;
      }
      if (e.altKey && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 't'))) {
        e.preventDefault();
        this.handleTriggerClick();
      }
    });
  }

  public handleTriggerClick(): void {
    if (this.displayMode === 'sidebar') {
      this.openTranslationPanel();
    } else {
      this.toggleInlineTranslation();
    }
  }

  public openTranslationPanel(): void {
    if (this.displayMode === 'inline') {
      this.toggleInlineTranslation();
      return;
    }
    if (sideloadManager.getActivePanelId() === 'translate') {
      sideloadManager.switchToDefault();
    } else {
      sideloadManager.open('translate');
    }
  }

  public getDisplayMode(): TranslationDisplayMode {
    return this.displayMode;
  }

  public setDisplayMode(mode: TranslationDisplayMode, persist = true, forceTrigger = false): void {
    const isModeChanged = this.displayMode !== mode;
    this.displayMode = mode;
    if (persist) {
      TranslationStorage.setDisplayMode(mode);
    }
    this.syncDisplayModeChips();

    if (mode === 'inline') {

      if (sideloadManager.getActivePanelId() === 'translate') {
        sideloadManager.switchToDefault();
      }

      if (!this.isInlineActive || isModeChanged || forceTrigger) {
        this.showInlineTranslations();
      }
    } else if (mode === 'sidebar') {

      if (this.isInlineActive) {
        this.hideInlineTranslations();
        sideloadManager.open('translate');
      } else if (forceTrigger) {
        sideloadManager.open('translate');
      }
    }
  }

  private syncDisplayModeChips(): void {
    document.querySelectorAll<HTMLButtonElement>('[data-trans-mode]').forEach((btn) => {
      const mode = btn.getAttribute('data-trans-mode');
      if (mode === this.displayMode) {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
    });
  }

  public toggleSettingsDrawer(open?: boolean): void {
    const drawer = document.getElementById('trans-settings-drawer');
    const toggleBtn = document.getElementById('trans-sidebar-settings');
    if (!drawer) return;

    this.isSettingsOpen = open !== undefined ? open : !this.isSettingsOpen;

    if (this.isSettingsOpen) {
      if (this.isExportOpen) {
        this.toggleExportDrawer(false);
      }
      drawer.style.display = 'block';
      drawer.setAttribute('aria-hidden', 'false');
      toggleBtn?.classList.add('is-active');
      this.syncDisplayModeChips();
      this.syncSettingsDrawerUI();
      const input = document.getElementById('trans-api-key-input') as HTMLInputElement | null;

      if (input && !input.disabled) {
        setTimeout(() => {
          input.focus();
          input.select();
        }, 50);
      }
    } else {
      drawer.style.display = 'none';
      drawer.setAttribute('aria-hidden', 'true');
      toggleBtn?.classList.remove('is-active');
    }
  }

  public toggleExportDrawer(open?: boolean): void {
    const drawer = document.getElementById('trans-export-drawer');
    const toggleBtn = document.getElementById('trans-sidebar-export');
    if (!drawer) return;

    this.isExportOpen = open !== undefined ? open : !this.isExportOpen;

    if (this.isExportOpen) {
      if (this.isSettingsOpen) {
        this.toggleSettingsDrawer(false);
      }
      drawer.style.display = 'block';
      drawer.setAttribute('aria-hidden', 'false');
      toggleBtn?.classList.add('is-active');
      this.syncExportDrawerUI();
    } else {
      drawer.style.display = 'none';
      drawer.setAttribute('aria-hidden', 'true');
      toggleBtn?.classList.remove('is-active');
    }
  }

  private syncExportDrawerUI(): void {
    const drawer = document.getElementById('trans-export-drawer');
    if (!drawer) return;

    drawer.querySelectorAll<HTMLButtonElement>('[data-export-fmt]').forEach((btn) => {
      const fmt = btn.getAttribute('data-export-fmt');
      if (fmt === this.selectedExportFormat) {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
    });

    drawer.querySelectorAll<HTMLButtonElement>('[data-export-scope]').forEach((btn) => {
      const scope = btn.getAttribute('data-export-scope');
      if (scope === this.selectedExportScope) {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
    });

    this.updateSatisfiedCountBadge();
  }

  private updateSatisfiedCountBadge(): void {
    const satisfiedCount = this.paragraphs.filter((p) => Boolean(p.isSatisfied && p.translatedText && p.status === 'done')).length;

    const countBadge = document.getElementById('trans-satisfied-count');
    if (countBadge) {
      if (satisfiedCount > 0) {
        countBadge.style.display = 'inline-flex';
        countBadge.textContent = `${satisfiedCount} 采纳`;
      } else {
        countBadge.style.display = 'none';
      }
    }

    const exportNum = document.getElementById('trans-export-satisfied-num');
    if (exportNum) {
      exportNum.textContent = String(satisfiedCount);
    }
  }

  private handleExportDownload(): void {
    const downloadBtn = document.getElementById('trans-export-download');
    const chapterTitle = document.querySelector('h1')?.textContent?.trim() || document.title || 'AstroLib-Chapter';

    const result = TranslationExporter.generateExport(this.paragraphs, {
      format: this.selectedExportFormat,
      onlySatisfied: this.selectedExportScope === 'satisfied',
      chapterTitle,
    });

    TranslationExporter.downloadFile(result.filename, result.content, result.mimeType);

    if (downloadBtn) {
      const textSpan = downloadBtn.querySelector('.trans-btn-text');
      const iconSpan = downloadBtn.querySelector('.trans-btn-icon');
      const origText = textSpan?.textContent || '立即下载文件';
      const origIcon = iconSpan?.textContent || 'file_download';
      if (textSpan) textSpan.textContent = '已下载';
      if (iconSpan) iconSpan.textContent = 'check';

      setTimeout(() => {
        if (textSpan) textSpan.textContent = origText;
        if (iconSpan) iconSpan.textContent = origIcon;
      }, 1500);
    }
  }

  private handleMarkAllSatisfied(): void {
    const chapterKey = TranslationStorage.normalizeKey();
    TranslationStorage.markAllSatisfied(chapterKey, this.paragraphs);

    const dockContent = document.getElementById('trans-sidebar-content');
    if (dockContent) {
      for (const unit of this.paragraphs) {
        if (unit.translatedText && unit.status === 'done') {
          const card = dockContent.querySelector<HTMLElement>(`[data-trans-card-id="${unit.id}"]`);
          if (card) {
            card.classList.add('is-satisfied');
            const satisfyBtn = card.querySelector<HTMLButtonElement>('.trans-card-satisfy-btn');
            if (satisfyBtn) {
              satisfyBtn.classList.add('is-satisfied');
              satisfyBtn.title = '取消采纳';
              const icon = satisfyBtn.querySelector('md-icon');
              if (icon) icon.textContent = 'star';
            }
            this.updateCardBadges(card, unit);
          }
        }
      }
    }

    this.updateSatisfiedCountBadge();

    const btn = document.getElementById('trans-export-approve-all');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = '已全部采纳';
      setTimeout(() => {
        btn.textContent = orig;
      }, 1500);
    }
  }

  private toggleKeyVisibility(): void {
    const input = document.getElementById('trans-api-key-input') as HTMLInputElement | null;
    const eyeBtn = document.getElementById('trans-key-toggle-eye');
    const eyeIcon = eyeBtn?.querySelector('md-icon');
    if (!input || !eyeIcon) return;

    if (input.type === 'password') {
      input.type = 'text';
      eyeIcon.textContent = 'visibility_off';
      eyeBtn?.setAttribute('title', '隐藏密钥');
    } else {
      input.type = 'password';
      eyeIcon.textContent = 'visibility';
      eyeBtn?.setAttribute('title', '显示密钥');
    }
  }

  private syncSettingsDrawerUI(): void {
    const drawer = document.getElementById('trans-settings-drawer');
    if (!drawer) return;

    const providerNameEl = document.getElementById('trans-settings-provider-name');
    const keyInput = document.getElementById('trans-api-key-input') as HTMLInputElement | null;
    const badgeEl = document.getElementById('trans-key-status-badge');
    const tipEl = document.getElementById('trans-settings-tip');
    const alertEl = document.getElementById('trans-settings-alert');
    const saveBtn = document.getElementById('trans-settings-save') as HTMLButtonElement | null;
    const clearBtn = document.getElementById('trans-settings-clear') as HTMLButtonElement | null;

    if (alertEl) {
      alertEl.style.display = 'none';
      alertEl.textContent = '';
      alertEl.className = 'trans-settings-alert';
    }

    if (this.currentProvider === 'google') {
      if (providerNameEl) providerNameEl.textContent = 'Google 翻译 (公共免密钥)';
      if (keyInput) {
        keyInput.value = '';
        keyInput.placeholder = 'Google 翻译无需配置 API Key';
        keyInput.disabled = true;
      }
      if (badgeEl) {
        badgeEl.textContent = '无需密钥';
        badgeEl.className = 'trans-key-status-badge';
      }
      if (tipEl) {
        tipEl.textContent = '💡 Google 翻译为公共免费接口，无需任何配置，即开即用。';
      }
      if (saveBtn) saveBtn.disabled = true;
      if (clearBtn) clearBtn.disabled = true;
      return;
    }

    if (saveBtn) saveBtn.disabled = false;
    if (clearBtn) clearBtn.disabled = false;
    if (keyInput) keyInput.disabled = false;

    if (this.currentProvider === 'bupt') {
      if (providerNameEl) providerNameEl.textContent = 'DeepSeek (北京邮电大学)';
      const currentKey = getProviderApiKey('bupt') || (typeof localStorage !== 'undefined' ? localStorage.getItem('astrolib_ai_provider_key_bupt') || '' : '');
      if (keyInput && document.activeElement !== keyInput) {
        keyInput.value = currentKey;
        keyInput.placeholder = 'sk-bupt-... 或 sk-...';
      }
      if (badgeEl) {
        const hasKey = Boolean(currentKey.trim());
        badgeEl.textContent = hasKey ? '已配置 (本地)' : '默认配置';
        badgeEl.className = `trans-key-status-badge ${hasKey ? 'is-configured' : ''}`;
      }
      if (tipEl) {
        tipEl.textContent = '💡 北京邮电大学「人人有算力」校内模型服务网关。若留空，将自动使用服务端默认配置 (.env)。';
      }
      if (keyInput) {
        this.handleKeyInput(keyInput.value);
      }
    } else if (this.currentProvider === 'gemini') {
      if (providerNameEl) providerNameEl.textContent = 'Google Gemini (学术推理)';
      const currentKey = getProviderApiKey('gemini') || (typeof localStorage !== 'undefined' ? localStorage.getItem('astrolib_ai_provider_key_gemini') || '' : '');
      if (keyInput && document.activeElement !== keyInput) {
        keyInput.value = currentKey;
        keyInput.placeholder = 'AIzaSy... (留空使用默认)';
      }
      if (badgeEl) {
        const hasKey = Boolean(currentKey.trim());
        badgeEl.textContent = hasKey ? '已配置 (本地)' : '默认配置';
        badgeEl.className = `trans-key-status-badge ${hasKey ? 'is-configured' : ''}`;
      }
      if (tipEl) {
        tipEl.textContent = '💡 Google Gemini 官方学术与理科推理模型。若留空，将自动使用服务端默认配置 (.env)。';
      }
      if (keyInput) {
        this.handleKeyInput(keyInput.value);
      }
    } else if (this.currentProvider === 'zhipu') {
      if (providerNameEl) providerNameEl.textContent = '智谱开放平台 (GLM-4-Flash 免费)';
      const currentKey = getProviderApiKey('zhipu') || (typeof localStorage !== 'undefined' ? localStorage.getItem('astrolib_ai_provider_key_zhipu') || '' : '');
      if (keyInput && document.activeElement !== keyInput) {
        keyInput.value = currentKey;
        keyInput.placeholder = '请填写智谱 API Key (例如: xxxxxxxxx.yyyyyyyyy)';
      }
      if (badgeEl) {
        const hasKey = Boolean(currentKey.trim());
        badgeEl.textContent = hasKey ? '已配置 (本地)' : '未配置';
        badgeEl.className = `trans-key-status-badge ${hasKey ? 'is-configured' : ''}`;
      }
      if (tipEl) {
        tipEl.textContent = '💡 智谱开放平台 GLM-4-Flash 为永久免费模型，请前往 open.bigmodel.cn 复制 API Key。若配置在服务端的 .env (ZHIPU_API_KEY)，此处可留空。';
      }
      if (keyInput) {
        this.handleKeyInput(keyInput.value);
      }
    }
  }

  private handleKeyInput(val: string): void {
    const alertEl = document.getElementById('trans-settings-alert');
    if (!alertEl) return;

    const trimmed = val.trim();
    if (!trimmed) {
      alertEl.style.display = 'none';
      alertEl.textContent = '';
      return;
    }

    if (this.currentProvider === 'bupt') {
      if (trimmed.startsWith('ghp_')) {
        alertEl.style.display = 'block';
        alertEl.className = 'trans-settings-alert';
        alertEl.textContent = '❌ 检测到 GitHub 访问令牌 (ghp_...)！北邮网关无法使用此密钥，请填写以 sk- 开头的密钥或点击「清空密钥」恢复默认。';
        return;
      }
      if (!trimmed.startsWith('sk-')) {
        alertEl.style.display = 'block';
        alertEl.className = 'trans-settings-alert is-warning';
        alertEl.textContent = '⚠️ 北邮 LiteLLM 网关密钥通常以 sk- 开头，请确认密钥格式正确。';
        return;
      }
    } else if (this.currentProvider === 'gemini') {
      if (!trimmed.startsWith('AIzaSy')) {
        alertEl.style.display = 'block';
        alertEl.className = 'trans-settings-alert is-warning';
        alertEl.textContent = '提示：Google Gemini 官方密钥通常以 AIzaSy 开头。';
        return;
      }
    } else if (this.currentProvider === 'zhipu') {
      if (trimmed.startsWith('ghp_')) {
        alertEl.style.display = 'block';
        alertEl.className = 'trans-settings-alert';
        alertEl.textContent = '❌ 检测到 GitHub 访问令牌 (ghp_...)！智谱开放平台无法使用此密钥，请前往 open.bigmodel.cn 获取 API Key。';
        return;
      }
    }

    alertEl.style.display = 'none';
    alertEl.textContent = '';
  }

  private handleSaveKey(): void {
    if (this.currentProvider === 'google') return;
    const input = document.getElementById('trans-api-key-input') as HTMLInputElement | null;
    const saveBtn = document.getElementById('trans-settings-save');
    const alertEl = document.getElementById('trans-settings-alert');
    if (!input) return;

    const key = input.value.trim();

    if ((this.currentProvider === 'bupt' || this.currentProvider === 'zhipu') && key && key.startsWith('ghp_')) {
      if (alertEl) {
        alertEl.style.display = 'block';
        alertEl.className = 'trans-settings-alert';
        alertEl.textContent = '❌ 无法保存：检测到 GitHub 令牌 (ghp_...)，请填写对应大模型服务商的有效 API Key。';
      }
      return;
    }

    saveProviderApiKey(this.currentProvider, key);

    if (saveBtn) {
      const textSpan = saveBtn.querySelector('.trans-btn-text');
      const iconSpan = saveBtn.querySelector('.trans-btn-icon');
      const origText = textSpan?.textContent || '保存并应用';
      const origIcon = iconSpan?.textContent || 'save';
      if (textSpan) textSpan.textContent = '已保存';
      if (iconSpan) iconSpan.textContent = 'check';

      setTimeout(() => {
        if (textSpan) textSpan.textContent = origText;
        if (iconSpan) iconSpan.textContent = origIcon;
      }, 1500);
    }

    this.syncSettingsDrawerUI();

    this.startTranslation(true);
  }

  private handleClearKey(): void {
    if (this.currentProvider === 'google') return;
    const input = document.getElementById('trans-api-key-input') as HTMLInputElement | null;
    if (input) input.value = '';

    saveProviderApiKey(this.currentProvider, '');
    this.syncSettingsDrawerUI();

    this.startTranslation(true);
  }

  private openFullAiSettings(): void {
    window.dispatchEvent(new CustomEvent('astrolib:open-settings', { detail: { tab: 'ai' } }));
  }

  private getEffectiveApiKey(): string | undefined {
    if (this.currentProvider === 'google') {
      const key = (getProviderApiKey('google' as any) || (typeof localStorage !== 'undefined' ? localStorage.getItem('astrolib_ai_provider_key_google') || '' : '')).trim();
      return key && key.startsWith('AIzaSy') ? key : undefined;
    }

    if (this.currentProvider === 'bupt') {
      const key = (getProviderApiKey('bupt') || (typeof localStorage !== 'undefined' ? localStorage.getItem('astrolib_ai_provider_key_bupt') || '' : '')).trim();

      if (key && key.startsWith('sk-') && !key.startsWith('sk-bupt-...')) {
        return key;
      }
      return undefined;
    }

    if (this.currentProvider === 'gemini') {
      const key = (getProviderApiKey('gemini') || (typeof localStorage !== 'undefined' ? localStorage.getItem('astrolib_ai_provider_key_gemini') || '' : '')).trim();
      if (key && !key.startsWith('AIzaSy...')) {
        return key;
      }
      return undefined;
    }

    if (this.currentProvider === 'zhipu') {
      const key = (getProviderApiKey('zhipu') || (typeof localStorage !== 'undefined' ? localStorage.getItem('astrolib_ai_provider_key_zhipu') || '' : '')).trim();
      if (key && !key.startsWith('ghp_')) {
        return key;
      }
      return undefined;
    }

    if (this.currentProvider === 'deepseek') {
      const key = (getProviderApiKey('deepseek') || (typeof localStorage !== 'undefined' ? localStorage.getItem('astrolib_ai_provider_key_deepseek') || '' : '')).trim();
      if (key && key.startsWith('sk-')) {
        return key;
      }
      return undefined;
    }

    return undefined;
  }

  private onPanelActivated(): void {
    if (this.displayMode === 'inline') {
      sideloadManager.switchToDefault();
      return;
    }

    const panel = document.getElementById('trans-sidebar-panel');
    if (panel) {
      panel.setAttribute('aria-hidden', 'false');
    }

    this.syncProviderChips();
    this.syncDisplayModeChips();
    this.syncSettingsDrawerUI();
    this.updateSatisfiedCountBadge();

    this.startTranslation(false);
  }

  private syncProviderChips(): void {
    document.querySelectorAll('.trans-provider-chips [data-provider]').forEach((el) => {
      const p = el.getAttribute('data-provider');
      if (p === this.currentProvider) {
        el.classList.add('is-active');
      } else {
        el.classList.remove('is-active');
      }
    });
    this.syncInlineToolbarUI();
  }

  public getProvider(): TranslationProviderId {
    return this.currentProvider;
  }

  public setProvider(provider: TranslationProviderId): void {
    if (this.currentProvider === provider && !this.isTranslating) return;
    this.currentProvider = provider;
    TranslationStorage.setProvider(provider);
    this.syncProviderChips();
    this.syncSettingsDrawerUI();
    this.syncInlineToolbarUI();

    if (this.displayMode === 'sidebar') {
      if (sideloadManager.getActivePanelId() === 'translate') {
        this.startTranslation(true);
      }
    } else {
      if (this.isInlineActive) {
        this.showInlineTranslations(true);
      }
    }
  }

  public async startTranslation(forceRefresh = false): Promise<void> {
    if (this.isTranslating) {
      if (!forceRefresh) return;

      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }
      this.isTranslating = false;
    }

    const contentContainer = document.querySelector<HTMLElement>('.sl-markdown-content') || document.querySelector<HTMLElement>('article');
    const dockContent = document.getElementById('trans-sidebar-content');
    const countBadge = document.getElementById('trans-para-count');
    const progressBar = document.getElementById('trans-progress-bar');
    const progressFill = document.getElementById('trans-progress-fill');

    if (!contentContainer || !dockContent) return;

    const chapterKey = TranslationStorage.normalizeKey();
    const hasTransIds = Boolean(contentContainer.querySelector('[data-trans-id]'));

    if (this.currentChapterKey !== chapterKey || !hasTransIds || this.paragraphs.length === 0 || forceRefresh) {
      this.currentChapterKey = chapterKey;
      this.paragraphs = ParagraphAligner.extractFromArticleDom(contentContainer);
    }

    if (countBadge) {
      countBadge.textContent = `${this.paragraphs.length} 段`;
    }

    const { hydratedCount } = TranslationStorage.hydrateUnits(chapterKey, this.paragraphs);
    this.updateSatisfiedCountBadge();

    this.renderSkeletonCards(dockContent, this.paragraphs);

    if (this.unbindSync) this.unbindSync();
    this.unbindSync = ParagraphAligner.bindBidirectionalSync(contentContainer, dockContent);

    if (!forceRefresh && hydratedCount === this.paragraphs.length && this.paragraphs.length > 0) {
      if (progressBar) progressBar.style.display = 'none';
      return;
    }

    this.isTranslating = true;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    if (progressBar) progressBar.style.display = 'block';
    if (progressFill) {
      const initialPct = this.paragraphs.length > 0 ? Math.round((hydratedCount / this.paragraphs.length) * 100) : 10;
      progressFill.style.width = `${Math.max(10, initialPct)}%`;
    }

    let completedCount = hydratedCount;
    const total = this.paragraphs.length;
    const CHUNK_SIZE = 4;

    for (let i = 0; i < total; i += CHUNK_SIZE) {
      if (signal.aborted) break;
      const chunk = this.paragraphs.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (unit) => {
          if (signal.aborted) return;

          if (unit.type === 'math' || unit.type === 'code') {
            unit.status = 'done';
            unit.translatedText = unit.sourceText;
            this.updateCardContent(dockContent, unit);
            return;
          }

          if (!forceRefresh && unit.status === 'done' && unit.translatedText) {
            this.updateCardContent(dockContent, unit);
            return;
          }

          try {
            const res = await this.requestTranslation(unit.sourceText, signal);
            if (signal.aborted) return;

            if (res.ok && res.translatedText) {
              unit.translatedText = res.translatedText;
              unit.status = 'done';
              unit.provider = this.currentProvider;
              unit.error = undefined;
              TranslationStorage.saveUnit(chapterKey, unit);
            } else {
              unit.translatedText = unit.sourceText;
              unit.status = 'error';
              unit.error = res.error || '翻译失败';
            }
          } catch (err: any) {
            if (signal.aborted) return;
            unit.translatedText = unit.sourceText;
            unit.status = 'error';
            unit.error = err?.message || '网络连接异常';
          }

          if (signal.aborted) return;
          completedCount++;

          this.updateCardContent(dockContent, unit);

          if (progressFill) {
            const pct = Math.min(100, Math.round((completedCount / total) * 100));
            progressFill.style.width = `${pct}%`;
          }
        })
      );
    }

    const chapterTitle = document.querySelector('h1')?.textContent?.trim() || document.title;
    TranslationStorage.saveChapter(chapterKey, this.paragraphs, chapterTitle);
    this.updateSatisfiedCountBadge();

    this.isTranslating = false;
    setTimeout(() => {
      if (progressBar) progressBar.style.display = 'none';
    }, 600);
  }

  private async retrySingleUnit(card: HTMLElement, unit: ParagraphUnit): Promise<void> {
    const targetElem = card.querySelector<HTMLElement>('.trans-target-text');
    if (targetElem) {
      targetElem.classList.add('trans-pulse-text');
      targetElem.innerHTML = `
        <div class="trans-skeleton-line"></div>
        <div class="trans-skeleton-line short"></div>
      `;
    }
    card.classList.remove('trans-card-error');

    try {
      const res = await this.requestTranslation(unit.sourceText);
      if (res.ok && res.translatedText) {
        unit.translatedText = res.translatedText;
        unit.status = 'done';
        unit.provider = this.currentProvider;
        unit.error = undefined;
        TranslationStorage.saveUnit(TranslationStorage.normalizeKey(), unit);
        this.updateSatisfiedCountBadge();
      } else {
        unit.status = 'error';
        unit.error = res.error || '翻译失败';
      }
    } catch (err: any) {
      unit.status = 'error';
      unit.error = err?.message || '网络连接异常';
    }

    const dockContent = document.getElementById('trans-sidebar-content');
    if (dockContent) {
      this.updateCardContent(dockContent, unit);
    }
  }

  private async requestTranslation(
    text: string,
    signal?: AbortSignal
  ): Promise<{ ok: boolean; translatedText?: string; error?: string }> {
    const apiKey = this.getEffectiveApiKey();

    if (this.currentProvider === 'google' || apiKey) {
      const clientRes = await this.requestClientDirectTranslation(text, apiKey, signal);
      if (clientRes.ok) {
        return clientRes;
      }

      if (clientRes.error && (clientRes.error.includes('鉴权失败') || clientRes.error.includes('频次受限'))) {
        return clientRes;
      }
    }

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          text,
          provider: this.currentProvider,
          preserveStructure: true,
          ...(apiKey ? { apiKey } : {}),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.translatedText) {
          return { ok: true, translatedText: data.translatedText };
        }
      }
    } catch {

    }

    if (!apiKey && this.currentProvider !== 'google') {
      const providerNames: Record<string, string> = {
        zhipu: '智谱 GLM-4 (open.bigmodel.cn 免费获取)',
        gemini: 'Google Gemini (aistudio.google.com)',
        deepseek: 'DeepSeek (api.deepseek.com)',
        bupt: 'DeepSeek (北京邮电大学)',
      };
      const name = providerNames[this.currentProvider] || this.currentProvider;
      return {
        ok: false,
        error: `未配置 API Key，请在侧栏右上角设置中填写 ${name}`,
      };
    }

    return { ok: false, error: '翻译请求未成功，请检查网络或更换服务商' };
  }

  private async requestClientDirectTranslation(
    text: string,
    apiKey?: string,
    signal?: AbortSignal
  ): Promise<{ ok: boolean; translatedText?: string; error?: string }> {
    const provider = this.currentProvider;

    if (provider === 'zhipu') {
      if (!apiKey) {
        return {
          ok: false,
          error: '未配置智谱 API Key，请在侧栏右上角设置中填写 (open.bigmodel.cn 免费获取)',
        };
      }

      try {
        const maskResult = StructurePreservingMasker.mask(text, false);
        const res = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            Authorization: `Bearer ${apiKey}`,
          },
          signal,
          body: JSON.stringify({
            model: 'glm-4-flash',
            temperature: 0.1,
            messages: [
              {
                role: 'system',
                content:
                  '你是一个无状态的高校教材纯文本翻译引擎。你的唯一任务是将输入的英文直接翻译为规范的简体中文。\n【核心铁律】：1. 严禁扩写，严禁添加任何解释；2. 严格 1:1 对等；3. 形如 ⟦ASTRO_TOK_N⟧ 的占位符必须原封不动保留；4. 仅输出翻译结果本身。',
              },
              {
                role: 'user',
                content: `请直接翻译以下英文内容为简体中文（严禁扩写、仅输出译文）：\n<source_text>\n${maskResult.maskedText}\n</source_text>`,
              },
            ],
          }),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          let msg = `HTTP ${res.status}`;
          try {
            const j = JSON.parse(errText);
            if (j?.error?.message) msg = j.error.message;
          } catch {}
          if (res.status === 401) {
            return { ok: false, error: '智谱 API Key 鉴权失败，请检查密钥是否正确' };
          }
          if (res.status === 429) {
            return { ok: false, error: '智谱 API 请求频次受限 (429)，请稍后重试' };
          }
          return { ok: false, error: `智谱 API 异常 (${msg})` };
        }

        const data = await res.json();
        let content = data?.choices?.[0]?.message?.content;
        if (typeof content !== 'string') {
          return { ok: false, error: '智谱 API 未返回有效内容' };
        }

        content = this.cleanClientLlmOutput(content, text);

        if (maskResult.tokens.size > 0) {
          const unmasked = StructurePreservingMasker.unmask(content, maskResult.tokens);
          content = unmasked.restoredText;
        }

        return { ok: true, translatedText: content };
      } catch (err: any) {
        if (signal?.aborted) throw err;
        return { ok: false, error: err?.message || '智谱直连翻译失败' };
      }
    }

    if (provider === 'gemini') {
      if (!apiKey) {
        return {
          ok: false,
          error: '未配置 Gemini API Key，请在侧栏右上角设置中填写 (aistudio.google.com)',
        };
      }

      try {
        const maskResult = StructurePreservingMasker.mask(text, false);
        const endpoint =
          typeof import.meta !== 'undefined' && import.meta.env?.DEV
            ? '/api/proxy/gemini/v1beta/openai/chat/completions'
            : 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            Authorization: `Bearer ${apiKey}`,
          },
          signal,
          body: JSON.stringify({
            model: 'gemini-3.8-flash',
            temperature: 0.1,
            messages: [
              {
                role: 'system',
                content:
                  '你是一个无状态的高校教材纯文本翻译引擎。你的唯一任务是将输入的英文直接翻译为规范的简体中文。\n【核心铁律】：1. 严禁扩写，严禁添加任何解释；2. 严格 1:1 对等；3. 形如 ⟦ASTRO_TOK_N⟧ 的占位符必须原封不动保留；4. 仅输出翻译结果本身。',
              },
              {
                role: 'user',
                content: `请直接翻译以下英文内容为简体中文（严禁扩写、仅输出译文）：\n<source_text>\n${maskResult.maskedText}\n</source_text>`,
              },
            ],
          }),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          let msg = `HTTP ${res.status}`;
          try {
            const j = JSON.parse(errText);
            if (j?.error?.message) msg = j.error.message;
          } catch {}
          return { ok: false, error: `Gemini API 异常 (${msg})` };
        }

        const data = await res.json();
        let content = data?.choices?.[0]?.message?.content;
        if (typeof content !== 'string') {
          return { ok: false, error: 'Gemini API 未返回有效内容' };
        }

        content = this.cleanClientLlmOutput(content, text);

        if (maskResult.tokens.size > 0) {
          const unmasked = StructurePreservingMasker.unmask(content, maskResult.tokens);
          content = unmasked.restoredText;
        }

        return { ok: true, translatedText: content };
      } catch (err: any) {
        if (signal?.aborted) throw err;
        return { ok: false, error: err?.message || 'Gemini 直连翻译失败' };
      }
    }

    if (provider === 'bupt') {
      const endpoint =
        typeof import.meta !== 'undefined' && import.meta.env?.DEV
          ? '/api/proxy/bupt/chat/completions'
          : 'https://myai.bupt.edu.cn/llm-gw/v1/chat/completions';

      try {
        const maskResult = StructurePreservingMasker.mask(text, false);
        const headers: Record<string, string> = {
          'Content-Type': 'application/json; charset=utf-8',
        };
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          signal,
          body: JSON.stringify({
            model: 'deepseek-v4-flash',
            temperature: 0.1,
            messages: [
              {
                role: 'system',
                content:
                  '你是一个无状态的高校教材纯文本翻译引擎。你的唯一任务是将输入的英文直接翻译为规范的简体中文。\n【核心铁律】：1. 严禁扩写，严禁添加任何解释；2. 严格 1:1 对等；3. 形如 ⟦ASTRO_TOK_N⟧ 的占位符必须原封不动保留；4. 仅输出翻译结果本身。',
              },
              {
                role: 'user',
                content: `请直接翻译以下英文内容为简体中文（严禁扩写、仅输出译文）：\n<source_text>\n${maskResult.maskedText}\n</source_text>`,
              },
            ],
          }),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          let msg = `HTTP ${res.status}`;
          try {
            const j = JSON.parse(errText);
            if (j?.error?.message) msg = j.error.message;
          } catch {}
          return { ok: false, error: `北邮校内网关异常 (${msg})` };
        }

        const data = await res.json();
        let content = data?.choices?.[0]?.message?.content;
        if (typeof content !== 'string') {
          return { ok: false, error: '北邮网关未返回有效内容' };
        }

        content = this.cleanClientLlmOutput(content, text);

        if (maskResult.tokens.size > 0) {
          const unmasked = StructurePreservingMasker.unmask(content, maskResult.tokens);
          content = unmasked.restoredText;
        }

        return { ok: true, translatedText: content };
      } catch (err: any) {
        if (signal?.aborted) throw err;
        return { ok: false, error: err?.message || '北邮校内网关直连失败' };
      }
    }

    if (provider === 'deepseek') {
      if (!apiKey) {
        return {
          ok: false,
          error: '未配置 DeepSeek API Key，请在侧栏右上角设置中填写 (api.deepseek.com)',
        };
      }

      try {
        const maskResult = StructurePreservingMasker.mask(text, false);
        const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            Authorization: `Bearer ${apiKey}`,
          },
          signal,
          body: JSON.stringify({
            model: 'deepseek-chat',
            temperature: 0.1,
            messages: [
              {
                role: 'system',
                content:
                  '你是一个无状态的高校教材纯文本翻译引擎。你的唯一任务是将输入的英文直接翻译为规范的简体中文。\n【核心铁律】：1. 严禁扩写，严禁添加任何解释；2. 严格 1:1 对等；3. 形如 ⟦ASTRO_TOK_N⟧ 的占位符必须原封不动保留；4. 仅输出翻译结果本身。',
              },
              {
                role: 'user',
                content: `请直接翻译以下英文内容为简体中文（严禁扩写、仅输出译文）：\n<source_text>\n${maskResult.maskedText}\n</source_text>`,
              },
            ],
          }),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          return { ok: false, error: `DeepSeek API 异常 (HTTP ${res.status}): ${errText.slice(0, 100)}` };
        }

        const data = await res.json();
        let content = data?.choices?.[0]?.message?.content;
        if (typeof content !== 'string') {
          return { ok: false, error: 'DeepSeek API 未返回有效内容' };
        }

        content = this.cleanClientLlmOutput(content, text);

        if (maskResult.tokens.size > 0) {
          const unmasked = StructurePreservingMasker.unmask(content, maskResult.tokens);
          content = unmasked.restoredText;
        }

        return { ok: true, translatedText: content };
      } catch (err: any) {
        if (signal?.aborted) throw err;
        return { ok: false, error: err?.message || 'DeepSeek 直连翻译失败' };
      }
    }

    if (provider === 'google') {

      if (apiKey && apiKey.startsWith('AIzaSy')) {
        try {
          const maskResult = StructurePreservingMasker.mask(text, false);
          const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            signal,
            body: JSON.stringify({ q: maskResult.maskedText, source: 'en', target: 'zh-CN', format: 'text' }),
          });
          if (res.ok) {
            const data = await res.json();
            let trans = data?.data?.translations?.[0]?.translatedText || '';
            if (trans) {
              if (maskResult.tokens.size > 0) {
                trans = StructurePreservingMasker.unmask(trans, maskResult.tokens).restoredText;
              }
              return { ok: true, translatedText: trans };
            }
          }
        } catch {}
      }

      try {
        const maskResult = StructurePreservingMasker.mask(text, false);
        const res = await fetch('https://clients5.google.com/translate_a/t?client=dict-chrome-ex', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
          signal,
          body: new URLSearchParams({
            sl: 'en',
            tl: 'zh-CN',
            q: maskResult.maskedText,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          let trans = '';
          if (Array.isArray(data) && typeof data[0] === 'string') {
            trans = data.join('');
          } else if (Array.isArray(data) && Array.isArray(data[0])) {
            trans = data[0].filter((p: any) => typeof p === 'string').join('');
          }
          if (trans) {
            if (maskResult.tokens.size > 0) {
              trans = StructurePreservingMasker.unmask(trans, maskResult.tokens).restoredText;
            }
            return { ok: true, translatedText: trans };
          }
        }
      } catch (clientErr: any) {
        if (signal?.aborted) throw clientErr;
      }

      try {
        const maskResult = StructurePreservingMasker.mask(text, false);
        const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(maskResult.maskedText)}`;
        const gtxRes = await fetch(gtxUrl, { signal });
        if (gtxRes.ok) {
          const gtxData = await gtxRes.json();
          let trans = (gtxData?.[0] || []).map((p: any) => p?.[0] || '').join('');
          if (trans) {
            if (maskResult.tokens.size > 0) {
              trans = StructurePreservingMasker.unmask(trans, maskResult.tokens).restoredText;
            }
            return { ok: true, translatedText: trans };
          }
        }
      } catch (gtxErr: any) {
        if (signal?.aborted) throw gtxErr;
      }

      return { ok: false, error: 'Google 翻译直连受阻，建议在顶栏切换为智谱 GLM-4 免费模型' };
    }

    return { ok: false, error: '未识别的翻译服务商' };
  }

  private cleanClientLlmOutput(raw: string, sourceText = ''): string {
    let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    text = text.replace(/<\/?(?:source_text|text_to_translate|translation|translated_text)>/gi, '').trim();
    if (text.startsWith('```') && text.endsWith('```')) {
      text = text.replace(/^```(?:markdown|md|text)?\n([\s\S]*?)\n```$/i, '$1').trim();
    }
    text = text.replace(/^(?:好的[，,！!]?|以下是翻译[：:]?|翻译如下[：:]?|译文[：:]?)\s*/i, '').trim();

    const trimmedSource = sourceText.trim();
    const isSingleLine = !trimmedSource.includes('\n');
    const wordCount = trimmedSource.split(/\s+/).length;
    const isShortHeading = isSingleLine && (trimmedSource.startsWith('#') || wordCount <= 8);

    if (isShortHeading && text) {
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      let firstLine = lines[0] || text;
      if (wordCount <= 5 && firstLine.length > 30) {
        const sentenceMatch = firstLine.match(/^([^。！？\n]+[。！？]?)/);
        if (sentenceMatch && sentenceMatch[1].length < firstLine.length) {
          firstLine = sentenceMatch[1].trim();
        }
      }
      text = firstLine;
    }

    return text.trim();
  }

  private renderSkeletonCards(container: HTMLElement, paragraphs: ParagraphUnit[]): void {
    if (paragraphs.length === 0) {
      container.innerHTML = `
        <div class="trans-empty-tip">
          <md-icon class="trans-empty-icon">menu_book</md-icon>
          <p>当前页面暂无匹配的英文段落</p>
        </div>
      `;
      return;
    }

    container.innerHTML = paragraphs
      .map((unit) => {
        const typeLabel = this.getTypeLabel(unit.type);
        const isDone = unit.status === 'done';
        const isSatisfied = Boolean(unit.isSatisfied);
        const isCustom = Boolean(unit.isCustomEdited);
        const cardClass = `trans-card ${isDone ? '' : 'trans-card-loading'} ${isSatisfied ? 'is-satisfied' : ''}`;
        const statusPill = isCustom
          ? '<span class="trans-card-status-pill is-custom">★ 已精修</span>'
          : isSatisfied
          ? '<span class="trans-card-status-pill is-satisfied">★ 已采纳</span>'
          : '';

        return `
          <div class="${cardClass}" data-trans-card-id="${unit.id}">
            <div class="trans-card-header">
              <div class="trans-card-badges">
                <span class="trans-card-badge">${typeLabel} ${unit.index + 1}</span>
                ${statusPill}
              </div>
              <div class="trans-card-actions">
                <button
                  type="button"
                  class="trans-card-action-icon-btn trans-card-satisfy-btn ${isSatisfied ? 'is-satisfied' : ''}"
                  title="${isSatisfied ? '取消采纳' : '采纳满意译文'}"
                  aria-label="采纳满意译文"
                >
                  <md-icon class="trans-card-icon">${isSatisfied ? 'star' : 'star_border'}</md-icon>
                </button>
                <button
                  type="button"
                  class="trans-card-action-icon-btn trans-card-edit-btn"
                  title="微调/精修译文"
                  aria-label="微调译文"
                >
                  <md-icon class="trans-card-icon">edit</md-icon>
                </button>
                <button
                  type="button"
                  class="trans-card-action-icon-btn trans-card-copy-btn"
                  title="复制中文译文"
                  aria-label="复制译文"
                >
                  <md-icon class="trans-card-icon">content_copy</md-icon>
                </button>
              </div>
            </div>
            <div class="trans-card-body">
              <div class="trans-source-snippet">${this.escapeHtml(unit.sourceText.slice(0, 140))}${unit.sourceText.length > 140 ? '...' : ''}</div>
              <div class="trans-target-text ${isDone ? '' : 'trans-pulse-text'}">
                ${isDone
                  ? this.escapeHtml(unit.translatedText || unit.sourceText)
                  : '<div class="trans-skeleton-line"></div><div class="trans-skeleton-line short"></div>'}
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    paragraphs.forEach((unit) => {
      const card = container.querySelector<HTMLElement>(`[data-trans-card-id="${unit.id}"]`);
      if (card) {
        this.bindCardActions(card, unit);
        if (unit.status === 'done') {
          const targetElem = card.querySelector<HTMLElement>('.trans-target-text');
          if (targetElem) {
            renderMathInElementSafely(targetElem);
          }
        }
      }
    });
  }

  private updateCardContent(container: HTMLElement, unit: ParagraphUnit): void {
    const card = container.querySelector<HTMLElement>(`[data-trans-card-id="${unit.id}"]`);
    if (!card) return;

    card.classList.remove('trans-card-loading');
    const targetElem = card.querySelector<HTMLElement>('.trans-target-text');
    if (!targetElem) return;

    targetElem.classList.remove('trans-pulse-text');

    if (unit.status === 'error') {
      card.classList.add('trans-card-error');
      targetElem.innerHTML = `
        <span class="trans-error-msg" title="${this.escapeHtml(unit.error || '')}">
          ⚠️ 翻译未成功 (${this.escapeHtml(unit.error || '请求异常')}) · <button type="button" class="trans-retry-btn">重试</button><button type="button" class="trans-fix-key-btn">配置密钥</button>
        </span>
      `;
      const retryBtn = card.querySelector('.trans-retry-btn');
      retryBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.retrySingleUnit(card, unit);
      });
      const fixKeyBtn = card.querySelector('.trans-fix-key-btn');
      fixKeyBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSettingsDrawer(true);
        const input = document.getElementById('trans-api-key-input') as HTMLInputElement | null;
        if (input && !input.disabled) {
          input.focus();
          input.select();
        }
      });
      return;
    }

    card.classList.remove('trans-card-error');
    if (unit.isSatisfied) {
      card.classList.add('is-satisfied');
    } else {
      card.classList.remove('is-satisfied');
    }

    const satisfyBtn = card.querySelector<HTMLButtonElement>('.trans-card-satisfy-btn');
    if (satisfyBtn) {
      if (unit.isSatisfied) {
        satisfyBtn.classList.add('is-satisfied');
        satisfyBtn.title = '取消采纳';
        const icon = satisfyBtn.querySelector('md-icon');
        if (icon) icon.textContent = 'star';
      } else {
        satisfyBtn.classList.remove('is-satisfied');
        satisfyBtn.title = '采纳满意译文';
        const icon = satisfyBtn.querySelector('md-icon');
        if (icon) icon.textContent = 'star_border';
      }
    }

    this.updateCardBadges(card, unit);

    targetElem.textContent = unit.translatedText || unit.sourceText;
    renderMathInElementSafely(targetElem);
  }

  private bindCardActions(card: HTMLElement, unit: ParagraphUnit): void {
    const satisfyBtn = card.querySelector<HTMLButtonElement>('.trans-card-satisfy-btn');
    satisfyBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleToggleSatisfied(unit, card);
    });

    const editBtn = card.querySelector<HTMLButtonElement>('.trans-card-edit-btn');
    editBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleStartEdit(unit, card);
    });

    const copyBtn = card.querySelector<HTMLButtonElement>('.trans-card-copy-btn');
    copyBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(unit.translatedText || unit.sourceText).then(() => {
        const icon = copyBtn.querySelector('md-icon');
        if (icon) {
          icon.textContent = 'check';
          setTimeout(() => {
            icon.textContent = 'content_copy';
          }, 1500);
        }
      });
    });
  }

  private handleToggleSatisfied(unit: ParagraphUnit, card: HTMLElement): void {
    const nextVal = !unit.isSatisfied;
    unit.isSatisfied = nextVal;
    TranslationStorage.toggleSatisfied(TranslationStorage.normalizeKey(), unit.id, nextVal);

    if (nextVal) {
      card.classList.add('is-satisfied');
    } else {
      card.classList.remove('is-satisfied');
    }

    const satisfyBtn = card.querySelector<HTMLButtonElement>('.trans-card-satisfy-btn');
    if (satisfyBtn) {
      if (nextVal) {
        satisfyBtn.classList.add('is-satisfied');
        satisfyBtn.title = '取消采纳';
        const icon = satisfyBtn.querySelector('md-icon');
        if (icon) icon.textContent = 'star';
      } else {
        satisfyBtn.classList.remove('is-satisfied');
        satisfyBtn.title = '采纳满意译文';
        const icon = satisfyBtn.querySelector('md-icon');
        if (icon) icon.textContent = 'star_border';
      }
    }

    this.updateCardBadges(card, unit);
    this.updateSatisfiedCountBadge();
  }

  private updateCardBadges(card: HTMLElement, unit: ParagraphUnit): void {
    const badgesBox = card.querySelector('.trans-card-badges');
    if (!badgesBox) return;

    const existingPill = badgesBox.querySelector('.trans-card-status-pill');
    if (existingPill) existingPill.remove();

    if (unit.isCustomEdited) {
      const pill = document.createElement('span');
      pill.className = 'trans-card-status-pill is-custom';
      pill.textContent = '★ 已精修';
      badgesBox.appendChild(pill);
    } else if (unit.isSatisfied) {
      const pill = document.createElement('span');
      pill.className = 'trans-card-status-pill is-satisfied';
      pill.textContent = '★ 已采纳';
      badgesBox.appendChild(pill);
    }
  }

  private handleStartEdit(unit: ParagraphUnit, card: HTMLElement): void {
    const body = card.querySelector<HTMLElement>('.trans-card-body');
    const targetElem = card.querySelector<HTMLElement>('.trans-target-text');
    if (!body || !targetElem) return;

    if (card.querySelector('.trans-card-editor-box')) return;

    targetElem.style.display = 'none';

    const editorBox = document.createElement('div');
    editorBox.className = 'trans-card-editor-box';
    editorBox.innerHTML = `
      <textarea class="trans-card-textarea" rows="3" placeholder="在此编辑或精修译文...">${this.escapeHtml(unit.translatedText || unit.sourceText)}</textarea>
      <div class="trans-card-editor-actions">
        <button type="button" class="trans-editor-save-btn">保存微调</button>
        <button type="button" class="trans-editor-cancel-btn">取消</button>
      </div>
    `;

    body.appendChild(editorBox);

    const textarea = editorBox.querySelector<HTMLTextAreaElement>('.trans-card-textarea');
    const saveBtn = editorBox.querySelector<HTMLButtonElement>('.trans-editor-save-btn');
    const cancelBtn = editorBox.querySelector<HTMLButtonElement>('.trans-editor-cancel-btn');

    const closeEditor = () => {
      editorBox.remove();
      targetElem.style.display = '';
    };

    const saveAction = () => {
      const val = textarea?.value.trim() ?? '';
      if (val) {
        unit.translatedText = val;
        unit.isCustomEdited = true;
        unit.isSatisfied = true;
        unit.status = 'done';
        TranslationStorage.updateCustomTranslation(TranslationStorage.normalizeKey(), unit.id, val);

        card.classList.add('is-satisfied');
        const satisfyBtn = card.querySelector<HTMLButtonElement>('.trans-card-satisfy-btn');
        if (satisfyBtn) {
          satisfyBtn.classList.add('is-satisfied');
          satisfyBtn.title = '取消采纳';
          const icon = satisfyBtn.querySelector('md-icon');
          if (icon) icon.textContent = 'star';
        }

        this.updateCardBadges(card, unit);
        this.updateSatisfiedCountBadge();

        targetElem.textContent = val;
        renderMathInElementSafely(targetElem);
      }
      closeEditor();
    };

    if (textarea) {
      textarea.focus();
      textarea.addEventListener('click', (e) => e.stopPropagation());
      textarea.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          saveAction();
        }
      });
    }

    saveBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      saveAction();
    });

    cancelBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeEditor();
    });
  }

  public toggleInlineTranslation(): void {
    if (this.isInlineActive) {
      this.hideInlineTranslations();
    } else {
      this.showInlineTranslations();
    }
  }

  public async showInlineTranslations(forceRefresh = false): Promise<void> {
    if (this.isTranslating && !forceRefresh) return;
    if (this.isTranslating && forceRefresh) {
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }
      this.isTranslating = false;
    }

    const contentContainer = document.querySelector<HTMLElement>('.sl-markdown-content') || document.querySelector<HTMLElement>('article');
    if (!contentContainer) return;

    this.isInlineActive = true;
    this.updateTriggerActiveState(true);

    const chapterKey = TranslationStorage.normalizeKey();
    const hasTransIds = Boolean(contentContainer.querySelector('[data-trans-id]'));

    if (this.currentChapterKey !== chapterKey || !hasTransIds || this.paragraphs.length === 0 || forceRefresh) {
      this.currentChapterKey = chapterKey;
      this.paragraphs = ParagraphAligner.extractFromArticleDom(contentContainer);
    }
    if (this.paragraphs.length === 0) return;

    const { hydratedCount } = TranslationStorage.hydrateUnits(chapterKey, this.paragraphs);

    this.renderInlineToolbar(contentContainer);
    this.renderInlineBlocks(contentContainer, this.paragraphs);

    if (!forceRefresh && hydratedCount === this.paragraphs.length) {
      return;
    }

    this.isTranslating = true;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const total = this.paragraphs.length;
    const CHUNK_SIZE = 4;

    for (let i = 0; i < total; i += CHUNK_SIZE) {
      if (signal.aborted) break;
      const chunk = this.paragraphs.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (unit) => {
          if (signal.aborted) return;

          if (unit.type === 'math' || unit.type === 'code') {
            unit.status = 'done';
            unit.translatedText = unit.sourceText;
            return;
          }

          if (!forceRefresh && unit.status === 'done' && unit.translatedText) {
            this.updateInlineBlockContent(contentContainer, unit);
            return;
          }

          try {
            const res = await this.requestTranslation(unit.sourceText, signal);
            if (signal.aborted) return;

            if (res.ok && res.translatedText) {
              unit.translatedText = res.translatedText;
              unit.status = 'done';
              unit.provider = this.currentProvider;
              unit.error = undefined;
              TranslationStorage.saveUnit(chapterKey, unit);
            } else {
              unit.translatedText = unit.sourceText;
              unit.status = 'error';
              unit.error = res.error || '翻译失败';
            }
          } catch (err: any) {
            if (signal.aborted) return;
            unit.translatedText = unit.sourceText;
            unit.status = 'error';
            unit.error = err?.message || '网络连接异常';
          }

          if (signal.aborted) return;
          this.updateInlineBlockContent(contentContainer, unit);
        })
      );
    }

    const chapterTitle = document.querySelector('h1')?.textContent?.trim() || document.title;
    TranslationStorage.saveChapter(chapterKey, this.paragraphs, chapterTitle);
    this.isTranslating = false;
  }

  public hideInlineTranslations(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isTranslating = false;
    this.isInlineActive = false;

    const contentContainer = document.querySelector<HTMLElement>('.sl-markdown-content') || document.querySelector<HTMLElement>('article');
    if (contentContainer) {
      contentContainer.querySelectorAll<HTMLElement>('.trans-inline-block').forEach((el) => el.remove());
      contentContainer.querySelectorAll<HTMLElement>('.has-trans-inline').forEach((el) => el.classList?.remove('has-trans-inline'));
      const toolbar = contentContainer.querySelector<HTMLElement>('#trans-inline-toolbar');
      if (toolbar) toolbar.remove();
    }

    this.updateTriggerActiveState(false);
  }

  private renderInlineBlocks(container: HTMLElement, paragraphs: ParagraphUnit[]): void {
    for (const unit of paragraphs) {

      if (unit.type === 'math' || unit.type === 'code') continue;

      const srcEl = container.querySelector<HTMLElement>(`[data-trans-id="${unit.id}"]`);
      if (!srcEl) continue;

      let inlineBlock = container.querySelector<HTMLElement>(`[data-trans-inline-id="${unit.id}"]`);
      if (!inlineBlock) {
        inlineBlock = document.createElement('div');
        const isCardTitle =
          unit.type === 'card-title' ||
          srcEl.getAttribute?.('data-trans-card-title') === 'true' ||
          srcEl.classList?.contains('card-header');

        const isTableCell =
          unit.type === 'table-cell' ||
          srcEl.tagName === 'TH' ||
          srcEl.tagName === 'TD' ||
          srcEl.getAttribute?.('data-trans-kind') === 'table-cell';

        const isInsideAlgorithm = Boolean(srcEl.closest?.('.academic-algorithm, .mineru-algorithm, .algorithm-body'));
        const isNoIndent = srcEl.classList?.contains('noindent') || isInsideAlgorithm || isTableCell;

        inlineBlock.className = `trans-inline-block ${unit.type === 'heading' ? 'is-heading' : ''} ${isCardTitle ? 'is-card-title' : ''} ${isTableCell ? 'is-table-cell' : ''} ${isNoIndent ? 'is-noindent' : ''} ${isInsideAlgorithm ? 'is-algorithm-item' : ''}`.trim();
        inlineBlock.setAttribute('data-trans-inline-id', unit.id);
        inlineBlock.setAttribute('role', 'region');
        inlineBlock.setAttribute(
          'aria-label',
          isCardTitle ? '卡片标题中文译文' : isTableCell ? '表格单元格中文译文' : '段落中文译文'
        );

        if (isCardTitle || isTableCell) {
          srcEl.classList?.add('has-trans-inline');
          srcEl.appendChild(inlineBlock);
        } else {
          srcEl.after(inlineBlock);

          if (isInsideAlgorithm) {
            const nextNode = inlineBlock.nextSibling;
            if (nextNode && nextNode.nodeType === 3  && /^\s+$/.test(nextNode.nodeValue || '')) {
              nextNode.nodeValue = '';
            }
          }
        }
      }

      this.updateInlineBlockContent(container, unit, inlineBlock);
    }
  }

  private updateInlineBlockContent(container: HTMLElement, unit: ParagraphUnit, targetBlock?: HTMLElement): void {
    const block = targetBlock || container.querySelector<HTMLElement>(`[data-trans-inline-id="${unit.id}"]`);
    if (!block) return;

    const isDone = unit.status === 'done';
    const isError = unit.status === 'error';
    const isSatisfied = Boolean(unit.isSatisfied);

    if (isError) {
      const isKeyError = (unit.error || '').includes('Key') || (unit.error || '').includes('密钥') || (unit.error || '').includes('401');
      const fixKeyBtn = isKeyError ? '<button type="button" class="trans-inline-fix-key-btn">配置密钥</button>' : '';
      block.innerHTML = `<div class="trans-inline-error"><span class="trans-inline-error-text">⚠️ 翻译未成功 (${this.escapeHtml(unit.error || '请求异常')})</span><button type="button" class="trans-inline-retry-btn">重试</button>${fixKeyBtn}</div>`;
      block.querySelector('.trans-inline-retry-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.retrySingleUnitInline(block, unit);
      });
      block.querySelector('.trans-inline-fix-key-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.displayMode === 'sidebar') {
          this.toggleSettingsDrawer(true);
        } else {
          sideloadManager.open('translate');
          this.toggleSettingsDrawer(true);
        }
      });
      return;
    }

    const textContent = isDone
      ? this.escapeHtml((unit.translatedText || unit.sourceText).trim())
      : '<div class="trans-skeleton-line"></div>';

    const actionsContent = isDone
      ? `<div class="trans-inline-actions">
          <button
            type="button"
            class="trans-inline-action-btn trans-inline-satisfy-btn ${isSatisfied ? 'is-satisfied' : ''}"
            title="${isSatisfied ? '取消采纳' : '采纳满意译文'}"
            aria-label="采纳满意译文"
          >
            <md-icon class="trans-inline-icon">${isSatisfied ? 'star' : 'star_border'}</md-icon>
          </button>
          <button
            type="button"
            class="trans-inline-action-btn trans-inline-copy-btn"
            title="复制译文"
            aria-label="复制译文"
          >
            <md-icon class="trans-inline-icon">content_copy</md-icon>
          </button>
        </div>`
      : '';

    block.innerHTML = `<div class="trans-inline-inner"><div class="trans-inline-text ${isDone ? '' : 'trans-pulse-text'}">${textContent}</div>${actionsContent}</div>`;

    if (isDone) {
      const textEl = block.querySelector<HTMLElement>('.trans-inline-text');
      if (textEl) {
        renderMathInElementSafely(textEl);
      }

      const satisfyBtn = block.querySelector<HTMLButtonElement>('.trans-inline-satisfy-btn');
      satisfyBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const nextVal = !unit.isSatisfied;
        unit.isSatisfied = nextVal;
        TranslationStorage.toggleSatisfied(TranslationStorage.normalizeKey(), unit.id, nextVal);
        satisfyBtn.classList.toggle('is-satisfied', nextVal);
        const icon = satisfyBtn.querySelector('md-icon');
        if (icon) icon.textContent = nextVal ? 'star' : 'star_border';
        satisfyBtn.title = nextVal ? '取消采纳' : '采纳满意译文';
        this.updateSatisfiedCountBadge();

        const dockContent = document.getElementById('trans-sidebar-content');
        if (dockContent) {
          const card = dockContent.querySelector<HTMLElement>(`[data-trans-card-id="${unit.id}"]`);
          if (card) {
            this.handleToggleSatisfied(unit, card);
          }
        }
      });

      const copyBtn = block.querySelector<HTMLButtonElement>('.trans-inline-copy-btn');
      copyBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(unit.translatedText || unit.sourceText).then(() => {
          const icon = copyBtn.querySelector('md-icon');
          if (icon) {
            icon.textContent = 'check';
            setTimeout(() => {
              icon.textContent = 'content_copy';
            }, 1500);
          }
        });
      });
    }
  }

  private async retrySingleUnitInline(block: HTMLElement, unit: ParagraphUnit): Promise<void> {
    const textEl = block.querySelector<HTMLElement>('.trans-inline-error');
    if (textEl) {
      textEl.innerHTML = '<div class="trans-skeleton-line"></div>';
    }
    try {
      const res = await this.requestTranslation(unit.sourceText);
      if (res.ok && res.translatedText) {
        unit.translatedText = res.translatedText;
        unit.status = 'done';
        unit.provider = this.currentProvider;
        unit.error = undefined;
        TranslationStorage.saveUnit(TranslationStorage.normalizeKey(), unit);
      } else {
        unit.status = 'error';
        unit.error = res.error || '翻译失败';
      }
    } catch (err: any) {
      unit.status = 'error';
      unit.error = err?.message || '网络连接异常';
    }

    const container = document.querySelector<HTMLElement>('.sl-markdown-content') || document.querySelector<HTMLElement>('article');
    if (container) {
      this.updateInlineBlockContent(container, unit, block);
    }
  }

  private updateTriggerActiveState(active: boolean): void {
    document.querySelectorAll<HTMLElement>('[data-translation-trigger]').forEach((el) => {
      el.classList.toggle('is-active', active);
      if (el.tagName.toLowerCase() === 'md-assist-chip') {
        if (active) {
          el.setAttribute('selected', '');
        } else {
          el.removeAttribute('selected');
        }
      }
    });
  }

  private getTypeLabel(type: ParagraphUnit['type']): string {

    switch (type) {
      case 'heading':
        return '标题';
      case 'card-title':
        return '卡片标题';
      case 'table-cell':
        return '表格';
      case 'math':
        return '公式';
      case 'code':
        return '算法';
      case 'quote':
        return '引言';
      case 'card':
        return '专栏';
      default:
        return '段落';
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private renderInlineToolbar(container: HTMLElement): void {
    let toolbar = container.querySelector<HTMLElement>('#trans-inline-toolbar');
    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.id = 'trans-inline-toolbar';
      toolbar.className = 'trans-inline-toolbar';
      toolbar.setAttribute('role', 'toolbar');
      toolbar.setAttribute('aria-label', '双语助读控制条');
      container.prepend(toolbar);
    }

    const currentP = this.currentProvider;
    toolbar.innerHTML = `
      <div class="trans-inline-toolbar-left">
        <span class="trans-inline-toolbar-title">
          <svg class="trans-inline-toolbar-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
          </svg>
          <span>双语助读</span>
        </span>
        <span class="trans-inline-toolbar-sep">/</span>
        <div class="trans-inline-provider-pills" role="radiogroup" aria-label="选择翻译服务商">
          <button type="button" class="trans-inline-pill ${currentP === 'google' ? 'is-active' : ''}" data-inline-provider="google" title="Google 翻译 (免密默认)">Google 翻译</button>
          <button type="button" class="trans-inline-pill ${currentP === 'bupt' ? 'is-active' : ''}" data-inline-provider="bupt" title="北京邮电大学「人人有算力」校内专属服务">北邮校内</button>
          <button type="button" class="trans-inline-pill ${currentP === 'zhipu' ? 'is-active' : ''}" data-inline-provider="zhipu" title="智谱开放平台 GLM-4-Flash (免费模型)">智谱 GLM-4</button>
          <button type="button" class="trans-inline-pill ${currentP === 'gemini' ? 'is-active' : ''}" data-inline-provider="gemini" title="Google Gemini 学术翻译">Gemini</button>
        </div>
      </div>
      <div class="trans-inline-toolbar-right">
        <button type="button" class="trans-inline-toolbar-btn" id="trans-inline-refresh-btn" title="重新翻译全文">
          <md-icon class="trans-inline-btn-icon">refresh</md-icon>
          <span>重新翻译</span>
        </button>
        <button type="button" class="trans-inline-toolbar-btn trans-inline-close-btn" id="trans-inline-exit-btn" title="退出双语助读模式">
          <md-icon class="trans-inline-btn-icon">close</md-icon>
          <span>退出助读</span>
        </button>
      </div>
    `;
  }

  public syncInlineToolbarUI(): void {
    const toolbar = document.getElementById('trans-inline-toolbar');
    if (!toolbar) return;
    toolbar.querySelectorAll<HTMLButtonElement>('[data-inline-provider]').forEach((btn) => {
      const p = btn.getAttribute('data-inline-provider');
      btn.classList.toggle('is-active', p === this.currentProvider);
    });
  }
}

if (typeof window !== 'undefined') {
  const initController = () => {
    TranslationDockController.getInstance().init();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initController);
  } else {
    initController();
  }
}
