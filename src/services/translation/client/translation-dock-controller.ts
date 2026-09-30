/**
 * src/services/translation/client/translation-dock-controller.ts
 * ============================================================================
 * AstroLib 双语助读侧载面板前端交互控制器
 * ============================================================================
 * 核心交互：
 * 1. 扫描正文 DOM 提取段落，并在正文段落注入 data-trans-id 标记；
 * 2. 渲染右侧卡片流，实现【段落与段落之间严格 1:1 双向对应】；
 * 3. 支持 Google 翻译 (默认) 与 Google Gemini 学术翻译提供商实时切换；
 * 4. 驱动公式 KaTeX 实时排版，悬浮双向高亮与点击平滑定位滚动；
 * 5. 遵从 SideloadManager 状态机规范，支持 Esc 键与返回大纲闭环。
 * ============================================================================
 */

import { sideloadManager } from '../../../components/sideload/sideload-manager.ts';
import { getProviderApiKey, saveProviderApiKey, AI_CONFIG_CHANGE_EVENT } from '../../../ai/ai-config.ts';
import { ParagraphAligner } from '../paragraph-aligner.ts';
import {
  TranslationStorage,
  TRANSLATION_DISPLAY_MODE_CHANGE_EVENT,
  TRANSLATION_PROVIDER_CHANGE_EVENT,
} from '../storage/translation-storage.ts';
import { TranslationExporter } from '../export/translation-exporter.ts';
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

    // 恢复用户上次选择的翻译提供商与呈现模式
    this.currentProvider = TranslationStorage.getProvider();
    this.displayMode = TranslationStorage.getDisplayMode();

    // 全局事件委托：绑定所有侧载操作、服务商切换、一键触发器
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // 1. 返回大纲或关闭侧载栏
      if (target.closest('#trans-back-to-toc') || target.closest('#trans-sidebar-close')) {
        e.preventDefault();
        sideloadManager.switchToDefault();
        return;
      }

      // 2. 重新翻译本节 (侧边栏刷新按钮)
      if (target.closest('#trans-sidebar-refresh')) {
        e.preventDefault();
        if (this.displayMode === 'sidebar') {
          this.startTranslation(true);
        } else {
          this.showInlineTranslations(true);
        }
        return;
      }

      // 2.1 行内控制条：重新翻译全文
      if (target.closest('#trans-inline-refresh-btn')) {
        e.preventDefault();
        this.showInlineTranslations(true);
        return;
      }

      // 2.2 行内控制条：退出助读
      if (target.closest('#trans-inline-exit-btn')) {
        e.preventDefault();
        this.hideInlineTranslations();
        return;
      }

      // 2.3 行内控制条：就地切换翻译服务商
      const inlinePill = target.closest<HTMLButtonElement>('[data-inline-provider]');
      if (inlinePill) {
        e.preventDefault();
        const p = inlinePill.getAttribute('data-inline-provider') as TranslationProviderId | null;
        if (p && p !== this.currentProvider) {
          this.setProvider(p);
        }
        return;
      }

      // 3. 展开/折叠翻译设置抽屉
      if (target.closest('#trans-sidebar-settings')) {
        e.preventDefault();
        this.toggleSettingsDrawer();
        return;
      }

      // 4. 收起设置抽屉
      if (target.closest('#trans-settings-close')) {
        e.preventDefault();
        this.toggleSettingsDrawer(false);
        return;
      }

      // 5. 展开/折叠导出抽屉
      if (target.closest('#trans-sidebar-export')) {
        e.preventDefault();
        this.toggleExportDrawer();
        return;
      }

      // 6. 收起导出抽屉
      if (target.closest('#trans-export-close')) {
        e.preventDefault();
        this.toggleExportDrawer(false);
        return;
      }

      // 7. 执行下载导出
      if (target.closest('#trans-export-download')) {
        e.preventDefault();
        this.handleExportDownload();
        return;
      }

      // 8. 全部标为采纳
      if (target.closest('#trans-export-approve-all')) {
        e.preventDefault();
        this.handleMarkAllSatisfied();
        return;
      }

      // 9. 切换导出格式
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

      // 10. 切换导出范围
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

      // 11. 切换密码明文/掩码
      if (target.closest('#trans-key-toggle-eye')) {
        e.preventDefault();
        this.toggleKeyVisibility();
        return;
      }

      // 12. 保存密钥
      if (target.closest('#trans-settings-save')) {
        e.preventDefault();
        this.handleSaveKey();
        return;
      }

      // 13. 清空密钥
      if (target.closest('#trans-settings-clear')) {
        e.preventDefault();
        this.handleClearKey();
        return;
      }

      // 14. 打开系统全站 AI 偏好设置
      if (target.closest('#trans-settings-more')) {
        e.preventDefault();
        this.openFullAiSettings();
        return;
      }

      // 15. 切换翻译服务商 (Google / Gemini / BUPT DeepSeek)
      const chip = target.closest<HTMLButtonElement>('.trans-provider-chips [data-provider]');
      if (chip) {
        e.preventDefault();
        const targetProvider = chip.getAttribute('data-provider') as TranslationProviderId;
        if (targetProvider && targetProvider !== this.currentProvider) {
          this.setProvider(targetProvider);
        }
        return;
      }

      // 15.1 切换译文呈现方式 (侧边栏对照 vs 段落下方显示)
      const modeChip = target.closest<HTMLButtonElement>('[data-trans-mode]');
      if (modeChip) {
        e.preventDefault();
        const targetMode = modeChip.getAttribute('data-trans-mode') as TranslationDisplayMode | null;
        if (targetMode) {
          this.setDisplayMode(targetMode, true, true);
        }
        return;
      }

      // 16. 触发双语助读面板开关 (来自顶栏、正文芯片、本地导航等所有位置)
      const trigger = target.closest('[data-translation-trigger]');
      if (trigger) {
        e.preventDefault();
        this.handleTriggerClick();
        return;
      }
    });

    // 监听输入框实时校验
    document.addEventListener('input', (e) => {
      const target = e.target as HTMLElement | null;
      if (target && target.id === 'trans-api-key-input') {
        this.handleKeyInput((target as HTMLInputElement).value);
      }
    });

    // 回车保存
    document.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement | null;
      if (target && target.id === 'trans-api-key-input' && e.key === 'Enter') {
        e.preventDefault();
        this.handleSaveKey();
      }
    });

    // 监听全站 AI 设置变更事件联动
    window.addEventListener(AI_CONFIG_CHANGE_EVENT, () => {
      this.syncSettingsDrawerUI();
    });

    // 监听全局译文呈现方式变更事件
    window.addEventListener(TRANSLATION_DISPLAY_MODE_CHANGE_EVENT, (e: any) => {
      const mode = e?.detail?.mode;
      const forceTrigger = Boolean(e?.detail?.forceTrigger);
      if (mode && (mode === 'sidebar' || mode === 'inline')) {
        this.setDisplayMode(mode, false, forceTrigger);
      }
    });

    // 监听全局翻译服务商变更事件
    window.addEventListener(TRANSLATION_PROVIDER_CHANGE_EVENT, (e: any) => {
      const p = e?.detail?.provider as TranslationProviderId | undefined;
      if (p && p !== this.currentProvider) {
        this.setProvider(p);
      }
    });

    // 监听 SideloadManager 侧载状态事件
    window.addEventListener('astrolib:sideload-change', (e: any) => {
      const activeId = e?.detail?.activePanelId;
      if (activeId === 'translate') {
        if (this.displayMode === 'inline') {
          // 行内模式下严禁占用或影响右侧边栏，安全恢复默认大纲
          sideloadManager.switchToDefault();
          return;
        }
        this.onPanelActivated();
      }
    });

    // 页面切页路由跳转时重置段落状态与联动
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

    // 快捷键: Alt+Y (译) 与 Alt+Shift+T 开启双语助读
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
      // 切换至行内段落下显示：
      // 1. 若右侧边栏当前正处于 translate 面板，立即安全关闭并无条件退回大纲，保持右侧栏不受影响
      if (sideloadManager.getActivePanelId() === 'translate') {
        sideloadManager.switchToDefault();
      }
      // 2. 无论右侧栏当前为何种面板，只要进入 inline 模式且尚未呈现行内翻译，或者显式触发/模式变更，立即在正文呈现段落下对照翻译
      if (!this.isInlineActive || isModeChanged || forceTrigger) {
        this.showInlineTranslations();
      }
    } else if (mode === 'sidebar') {
      // 切换回侧边栏对照：
      // 1. 若正文中已有行内译文，清理行内译文并呼出右侧侧载栏
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

    // 格式阻止拦截：例如误粘了 GitHub Token
    if ((this.currentProvider === 'bupt' || this.currentProvider === 'zhipu') && key && key.startsWith('ghp_')) {
      if (alertEl) {
        alertEl.style.display = 'block';
        alertEl.className = 'trans-settings-alert';
        alertEl.textContent = '❌ 无法保存：检测到 GitHub 令牌 (ghp_...)，请填写对应大模型服务商的有效 API Key。';
      }
      return;
    }

    saveProviderApiKey(this.currentProvider, key);

    // 按钮反馈动效
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

    // 立即重新触发翻译以应用新密钥
    this.startTranslation(true);
  }

  private handleClearKey(): void {
    if (this.currentProvider === 'google') return;
    const input = document.getElementById('trans-api-key-input') as HTMLInputElement | null;
    if (input) input.value = '';

    saveProviderApiKey(this.currentProvider, '');
    this.syncSettingsDrawerUI();

    // 重新发起翻译测试默认配置
    this.startTranslation(true);
  }

  private openFullAiSettings(): void {
    window.dispatchEvent(new CustomEvent('astrolib:open-settings', { detail: { tab: 'ai' } }));
  }

  private getEffectiveApiKey(): string | undefined {
    if (this.currentProvider === 'google') return undefined;

    if (this.currentProvider === 'bupt') {
      const key = (getProviderApiKey('bupt') || (typeof localStorage !== 'undefined' ? localStorage.getItem('astrolib_ai_provider_key_bupt') || '' : '')).trim();
      // 只有以 sk- 开头才是合法可用的 BUPT key，过滤掉残余的 ghp_ 等错误 key
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

    // 若尚未加载段落或章节已更换，执行解析与翻译
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

    // 根据当前呈现方式，重新发起翻译以新服务商刷新内容
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
      // 切换服务商或强制刷新时，立即终止进行中的上一次翻译
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

    // 1. 扫描正文 DOM 提取段落
    if (this.currentChapterKey !== chapterKey || !hasTransIds || this.paragraphs.length === 0 || forceRefresh) {
      this.currentChapterKey = chapterKey;
      this.paragraphs = ParagraphAligner.extractFromArticleDom(contentContainer);
    }

    if (countBadge) {
      countBadge.textContent = `${this.paragraphs.length} 段`;
    }

    // 2. 本地持久化缓存回填 (Hydration)
    const { hydratedCount } = TranslationStorage.hydrateUnits(chapterKey, this.paragraphs);
    this.updateSatisfiedCountBadge();

    // 3. 渲染卡片骨架或已回填卡片
    this.renderSkeletonCards(dockContent, this.paragraphs);

    // 4. 绑定双向悬浮与定位联动
    if (this.unbindSync) this.unbindSync();
    this.unbindSync = ParagraphAligner.bindBidirectionalSync(contentContainer, dockContent);

    // 若非强制刷新，且所有段落均已从本地缓存瞬间回填完成，则实现 0 网络请求即时呈现
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

    // 5. 分块请求翻译端点 (/api/translate)
    let completedCount = hydratedCount;
    const total = this.paragraphs.length;
    const CHUNK_SIZE = 4;

    for (let i = 0; i < total; i += CHUNK_SIZE) {
      if (signal.aborted) break;
      const chunk = this.paragraphs.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (unit) => {
          if (signal.aborted) return;

          // 严格跳过公式块与代码块的翻译
          if (unit.type === 'math' || unit.type === 'code') {
            unit.status = 'done';
            unit.translatedText = unit.sourceText;
            this.updateCardContent(dockContent, unit);
            return;
          }

          // 若非强制刷新且该段已回填完成，直接跳过请求
          if (!forceRefresh && unit.status === 'done' && unit.translatedText) {
            this.updateCardContent(dockContent, unit);
            return;
          }

          try {
            const apiKey = this.getEffectiveApiKey();

            // 调用本地 Dev Server 接口
            const res = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal,
              body: JSON.stringify({
                text: unit.sourceText,
                provider: this.currentProvider,
                preserveStructure: true,
                ...(apiKey ? { apiKey } : {}),
              }),
            });

            if (signal.aborted) return;

            if (res.ok) {
              const data = await res.json();
              if (data.ok && data.translatedText) {
                unit.translatedText = data.translatedText;
                unit.status = 'done';
                unit.provider = this.currentProvider;
                unit.error = undefined;
                TranslationStorage.saveUnit(chapterKey, unit);
              } else {
                unit.translatedText = unit.sourceText;
                unit.status = 'error';
                unit.error = data.error || '翻译失败';
              }
            } else {
              const errData = await res.json().catch(() => null);
              unit.translatedText = unit.sourceText;
              unit.status = 'error';
              unit.error = errData?.error || `HTTP ${res.status}`;
            }
          } catch (err: any) {
            if (signal.aborted) return;
            unit.translatedText = unit.sourceText;
            unit.status = 'error';
            unit.error = err?.message || '网络连接异常';
          }

          if (signal.aborted) return;
          completedCount++;
          // 局部更新卡片内容
          this.updateCardContent(dockContent, unit);

          if (progressFill) {
            const pct = Math.min(100, Math.round((completedCount / total) * 100));
            progressFill.style.width = `${pct}%`;
          }
        })
      );
    }

    // 整章完成批量持久化更新
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

    const apiKey = this.getEffectiveApiKey();

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: unit.sourceText,
          provider: this.currentProvider,
          preserveStructure: true,
          ...(apiKey ? { apiKey } : {}),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.translatedText) {
          unit.translatedText = data.translatedText;
          unit.status = 'done';
          unit.provider = this.currentProvider;
          unit.error = undefined;
          TranslationStorage.saveUnit(TranslationStorage.normalizeKey(), unit);
          this.updateSatisfiedCountBadge();
        } else {
          unit.status = 'error';
          unit.error = data.error || '翻译失败';
        }
      } else {
        const errData = await res.json().catch(() => null);
        unit.status = 'error';
        unit.error = errData?.error || `HTTP ${res.status}`;
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

    // 绑定卡片交互与公式渲染
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

    // 1. 扫描正文 DOM 提取段落
    if (this.currentChapterKey !== chapterKey || !hasTransIds || this.paragraphs.length === 0 || forceRefresh) {
      this.currentChapterKey = chapterKey;
      this.paragraphs = ParagraphAligner.extractFromArticleDom(contentContainer);
    }
    if (this.paragraphs.length === 0) return;

    // 2. 本地持久化缓存回填
    const { hydratedCount } = TranslationStorage.hydrateUnits(chapterKey, this.paragraphs);

    // 3. 渲染行内控制条与行内对照译文块
    this.renderInlineToolbar(contentContainer);
    this.renderInlineBlocks(contentContainer, this.paragraphs);

    if (!forceRefresh && hydratedCount === this.paragraphs.length) {
      return;
    }

    this.isTranslating = true;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    // 4. 分块请求翻译
    const total = this.paragraphs.length;
    const CHUNK_SIZE = 4;

    for (let i = 0; i < total; i += CHUNK_SIZE) {
      if (signal.aborted) break;
      const chunk = this.paragraphs.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (unit) => {
          if (signal.aborted) return;

          // 严格跳过公式块与代码块的翻译
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
            const apiKey = this.getEffectiveApiKey();
            const res = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal,
              body: JSON.stringify({
                text: unit.sourceText,
                provider: this.currentProvider,
                preserveStructure: true,
                ...(apiKey ? { apiKey } : {}),
              }),
            });

            if (signal.aborted) return;

            if (res.ok) {
              const data = await res.json();
              if (data.ok && data.translatedText) {
                unit.translatedText = data.translatedText;
                unit.status = 'done';
                unit.provider = this.currentProvider;
                unit.error = undefined;
                TranslationStorage.saveUnit(chapterKey, unit);
              } else {
                unit.translatedText = unit.sourceText;
                unit.status = 'error';
                unit.error = data.error || '翻译失败';
              }
            } else {
              const errData = await res.json().catch(() => null);
              unit.translatedText = unit.sourceText;
              unit.status = 'error';
              unit.error = errData?.error || `HTTP ${res.status}`;
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
      // 严格跳过公式与代码块，不注入任何行内翻译结构
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
          // 若在算法等预格式化块内，清理与下个元素之间多余的纯空行文本节点，避免 pre-wrap 导致巨大空白
          if (isInsideAlgorithm) {
            const nextNode = inlineBlock.nextSibling;
            if (nextNode && nextNode.nodeType === 3 /* TEXT_NODE */ && /^\s+$/.test(nextNode.nodeValue || '')) {
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
      block.innerHTML = `<div class="trans-inline-error"><span class="trans-inline-error-text">⚠️ 翻译未成功 (${this.escapeHtml(unit.error || '请求异常')})</span><button type="button" class="trans-inline-retry-btn">重试</button></div>`;
      block.querySelector('.trans-inline-retry-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.retrySingleUnitInline(block, unit);
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
    const apiKey = this.getEffectiveApiKey();
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: unit.sourceText,
          provider: this.currentProvider,
          preserveStructure: true,
          ...(apiKey ? { apiKey } : {}),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.translatedText) {
          unit.translatedText = data.translatedText;
          unit.status = 'done';
          unit.provider = this.currentProvider;
          unit.error = undefined;
          TranslationStorage.saveUnit(TranslationStorage.normalizeKey(), unit);
        } else {
          unit.status = 'error';
          unit.error = data.error || '翻译失败';
        }
      } else {
        const errData = await res.json().catch(() => null);
        unit.status = 'error';
        unit.error = errData?.error || `HTTP ${res.status}`;
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

// 自动初始化挂载
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
