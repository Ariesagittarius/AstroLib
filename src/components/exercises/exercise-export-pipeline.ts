import { generateLatexDocument, type LatexExportConfig, DEFAULT_LATEX_CONFIG } from '../../publishing/latex/latex-generator';
import { getStoredExportSettings, saveStoredExportSettings } from '../../publishing/common/export-settings';
import {
  generateJobId,
  getStoredCompilerConfig,
  saveCompilerConfig,
  dispatchCompileWorkflow,
  pollCompileResult,
  checkReleaseDirectly,
  printPdfDirectly,
  downloadPdfFile,
} from '../../utils/latex/latex-cloud-compiler';
import type { SlimQuestionItem, ChapterData, SinglePaperData } from '../../types/exercises';

export interface ExerciseExportHost {
  getCurrentMode(): 'practice' | 'paper';
  getCurrentChapter(): number;
  getCurrentPaperId(): number;
  getChapterData(chapter: number): ChapterData | undefined;
  getPaperData(paperId: number): SinglePaperData | undefined;
  getSearchQuery(): string;
  getFilteredQuestions(): SlimQuestionItem[];
  showToast(msg: string): void;
}

export class ExerciseExportPipeline {
  private host: ExerciseExportHost;
  private root: HTMLElement | null = null;

  private latexModal: HTMLElement | null = null;
  private openLatexBtn: HTMLElement | null = null;
  private latexCodeTextarea: HTMLTextAreaElement | null = null;
  private latexFilenameBadge: HTMLElement | null = null;
  private latexOverleafBtn: HTMLElement | null = null;
  private latexCopyBtn: HTMLElement | null = null;
  private latexPreviewCopyBtn: HTMLElement | null = null;
  private latexDownloadBtn: HTMLElement | null = null;
  private currentLatexConfig: LatexExportConfig = { ...DEFAULT_LATEX_CONFIG };
  private currentGeneratedLatexCode: string = '';

  private latexSettingsOpenBtn: HTMLElement | null = null;
  private latexSettingsModal: HTMLElement | null = null;
  private latexSettingsCloseBtn: HTMLElement | null = null;
  private latexSettingsCancelBtn: HTMLElement | null = null;
  private ghTokenInput: HTMLInputElement | null = null;
  private ghRepoInput: HTMLInputElement | null = null;
  private ghTransportModeSelect: HTMLSelectElement | null = null;
  private ghSaveConfigBtn: HTMLElement | null = null;

  private moreExportBtn: HTMLElement | null = null;
  private moreExportMenu: HTMLElement | null = null;
  private moreExportWrapper: HTMLElement | null = null;

  private tabCloudBtn: HTMLElement | null = null;
  private tabSourceBtn: HTMLElement | null = null;
  private latexCloudPanel: HTMLElement | null = null;
  private latexSourcePanel: HTMLElement | null = null;

  private pipelineStatusPill: HTMLElement | null = null;
  private pipelineStatusDesc: HTMLElement | null = null;
  private pipelineTimer: HTMLElement | null = null;
  private pipelineJobId: HTMLElement | null = null;

  private pipelineEmptyCard: HTMLElement | null = null;
  private pipelineLoadingCard: HTMLElement | null = null;
  private pipelinePreviewFrame: HTMLElement | null = null;
  private latexPdfIframe: HTMLIFrameElement | null = null;
  private loadingTitle: HTMLElement | null = null;
  private loadingSub: HTMLElement | null = null;
  private pipelineProgressBar: HTMLElement | null = null;

  private latexLogDrawer: HTMLDetailsElement | null = null;
  private latexLogPre: HTMLElement | null = null;

  private latexModalMeta: HTMLElement | null = null;
  private templateHint: HTMLElement | null = null;
  private pipelineTimeoutCard: HTMLElement | null = null;
  private pipelineTimeoutDesc: HTMLElement | null = null;
  private continueWaitBtn: HTMLElement | null = null;
  private checkResultNowBtn: HTMLElement | null = null;
  private latexPrintBtn: HTMLElement | null = null;
  private latexCancelCompileBtn: HTMLElement | null = null;
  private latexConfigView: HTMLElement | null = null;
  private latexResultView: HTMLElement | null = null;
  private latexStartCompileBtn: HTMLButtonElement | null = null;
  private latexLocalCompileBtn: HTMLButtonElement | null = null;
  private latexBackConfigBtn: HTMLButtonElement | null = null;
  private latexDownloadPdfBtn: HTMLButtonElement | null = null;
  private latexDownloadPdfText: HTMLElement | null = null;

  private currentCompiledPdfUrl: string | null = null;
  private currentCompileJobId: string | null = null;
  private isCompiling: boolean = false;
  private compileTimerInterval: any = null;
  private compileStartTime: number = 0;
  private compileAbortController: AbortController | null = null;
  private latexDebounceTimer: any = null;

  constructor(host: ExerciseExportHost) {
    this.host = host;
  }

  public initElements(root: HTMLElement) {
    this.root = root;

    this.latexModal = root.querySelector('#ex-latex-modal');
    this.openLatexBtn = root.querySelector('#ex-open-latex-btn');
    this.latexCodeTextarea = root.querySelector('#ex-latex-code-textarea');
    this.latexFilenameBadge = root.querySelector('#ex-latex-filename-badge');
    this.latexOverleafBtn = root.querySelector('#ex-latex-overleaf-btn');
    this.latexCopyBtn = root.querySelector('#ex-latex-copy-btn');
    this.latexPreviewCopyBtn = root.querySelector('#ex-latex-preview-copy-btn');
    this.latexDownloadBtn = root.querySelector('#ex-latex-download-btn');

    this.latexSettingsOpenBtn = root.querySelector('#ex-latex-open-settings-btn');
    this.latexSettingsModal = root.querySelector('#ex-latex-settings-modal');
    this.latexSettingsCloseBtn = root.querySelector('#ex-close-settings-modal-btn');
    this.latexSettingsCancelBtn = root.querySelector('#ex-cancel-settings-btn');
    this.ghTokenInput = root.querySelector('#ex-gh-token-input');
    this.ghRepoInput = root.querySelector('#ex-gh-repo-input');
    this.ghTransportModeSelect = root.querySelector('#ex-gh-transport-mode-select');
    this.ghSaveConfigBtn = root.querySelector('#ex-gh-save-config-btn');

    this.moreExportBtn = root.querySelector('#ex-more-export-btn');
    this.moreExportMenu = root.querySelector('#ex-more-export-menu');
    this.moreExportWrapper = root.querySelector('#ex-more-export-wrapper');

    this.tabCloudBtn = root.querySelector('#ex-tab-cloud-btn');
    this.tabSourceBtn = root.querySelector('#ex-tab-source-btn');
    this.latexCloudPanel = root.querySelector('#ex-latex-cloud-panel');
    this.latexSourcePanel = root.querySelector('#ex-latex-source-panel');

    this.pipelineStatusPill = root.querySelector('#ex-pipeline-status-pill');
    this.pipelineStatusDesc = root.querySelector('#ex-pipeline-status-desc');
    this.pipelineTimer = root.querySelector('#ex-pipeline-timer');
    this.pipelineJobId = root.querySelector('#ex-pipeline-job-id');

    this.pipelineEmptyCard = root.querySelector('#ex-pipeline-empty-card');
    this.pipelineLoadingCard = root.querySelector('#ex-pipeline-loading-card');
    this.pipelinePreviewFrame = root.querySelector('#ex-pipeline-preview-frame');
    this.latexPdfIframe = root.querySelector('#ex-latex-pdf-iframe');
    this.loadingTitle = root.querySelector('#ex-loading-title');
    this.loadingSub = root.querySelector('#ex-loading-sub');
    this.pipelineProgressBar = root.querySelector('#ex-pipeline-progress-bar');

    this.latexLogDrawer = root.querySelector('#ex-pipeline-log-drawer');
    this.latexLogPre = root.querySelector('#ex-latex-log-pre');

    this.latexModalMeta = root.querySelector('#ex-latex-modal-meta');
    this.templateHint = root.querySelector('#ex-template-hint');
    this.pipelineTimeoutCard = root.querySelector('#ex-pipeline-timeout-card');
    this.pipelineTimeoutDesc = root.querySelector('#ex-pipeline-timeout-desc');
    this.continueWaitBtn = root.querySelector('#ex-continue-wait-btn');
    this.checkResultNowBtn = root.querySelector('#ex-check-result-now-btn');
    this.latexPrintBtn = root.querySelector('#ex-latex-print-btn');
    this.latexCancelCompileBtn = root.querySelector('#ex-latex-cancel-compile-btn');
    this.latexConfigView = root.querySelector('#ex-latex-config-view');
    this.latexResultView = root.querySelector('#ex-latex-result-view');
    this.latexStartCompileBtn = root.querySelector('#ex-latex-start-compile-btn');
    this.latexLocalCompileBtn = root.querySelector('#ex-latex-local-compile-btn');
    this.latexBackConfigBtn = root.querySelector('#ex-latex-back-config-btn');
    this.latexDownloadPdfBtn = root.querySelector('#ex-latex-download-pdf-btn');
    this.latexDownloadPdfText = root.querySelector('#ex-latex-download-pdf-text');

    this.bindEvents();
  }

  private bindEvents() {
    if (!this.root) return;

    if (this.openLatexBtn) {
      this.openLatexBtn.addEventListener('click', () => this.openLatexModal());
    }

    this.root.querySelectorAll('[data-action="close-latex-modal"]').forEach((btn) => {
      btn.addEventListener('click', () => this.closeLatexModal());
    });

    this.bindChipSetSingleSelect(
      'ex-chip-set-template',
      'data-template',
      () => this.currentLatexConfig.template || 'handout',
      (val) => {
        const t = (val || 'handout') as any;
        this.currentLatexConfig.template = t;
        if (this.templateHint) {
          this.templateHint.textContent =
            t === 'handout'
              ? '大学数学教材体例 · 经典双线页眉 · 纯正学术出版排版'
              : '标准自测测试卷头 · 紧凑排版 · 纯净无干扰题面';
        }
      }
    );

    this.bindChipSetSingleSelect(
      'ex-chip-set-header',
      'data-header-mode',
      () => this.currentLatexConfig.headerMode || 'standard',
      (val) => {
        this.currentLatexConfig.headerMode = (val || 'standard') as any;
      }
    );

    this.bindChipSetSingleSelect(
      'ex-chip-set-writing-space',
      'data-writing-space',
      () => this.currentLatexConfig.writingSpace || 'comfortable',
      (val) => {
        this.currentLatexConfig.writingSpace = (val || 'comfortable') as any;
        const radio = this.root?.querySelector(`input[name="ex-latex-writing-space"][value="${val}"]`) as HTMLInputElement | null;
        if (radio) radio.checked = true;
      }
    );

    this.bindChipSetSingleSelect(
      'ex-chip-set-answer-mode',
      'data-answer-mode',
      () => this.currentLatexConfig.answerPlacement || 'appendix',
      (val) => {
        this.currentLatexConfig.answerPlacement = (val || 'appendix') as any;
        const radio = this.root?.querySelector(`input[name="ex-latex-answer-mode"][value="${val}"]`) as HTMLInputElement | null;
        if (radio) radio.checked = true;
      }
    );

    this.root.querySelectorAll('.ex-segmented-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.root?.querySelectorAll('.ex-segmented-btn').forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const t = (btn.getAttribute('data-template') || 'handout') as any;
        this.currentLatexConfig.template = t;
        this.syncChipSetSelection('ex-chip-set-template', 'data-template', t);
        if (this.templateHint) {
          this.templateHint.textContent =
            t === 'handout'
              ? '大学数学教材体例 · 经典双线页眉 · 纯正学术出版排版'
              : '标准自测测试卷头 · 紧凑排版 · 纯净无干扰题面';
        }
        this.scheduleRefreshLatexPreview();
      });
    });

    const paperSelect = this.root.querySelector('#ex-latex-paper-size') as HTMLSelectElement;
    if (paperSelect) {
      paperSelect.addEventListener('change', (e) => {
        this.currentLatexConfig.paperSize = (e.target as HTMLSelectElement).value as any;
        this.scheduleRefreshLatexPreview();
      });
    }

    const typographySelect = this.root.querySelector('#ex-latex-typography') as HTMLSelectElement;
    if (typographySelect) {
      typographySelect.addEventListener('change', (e) => {
        const typo = (e.target as HTMLSelectElement).value as any;
        this.currentLatexConfig.typography = typo;
        saveStoredExportSettings({ typography: typo });
        this.scheduleRefreshLatexPreview();
      });
    }

    const fontSelect = this.root.querySelector('#ex-latex-font-family') as HTMLSelectElement;
    if (fontSelect) {
      fontSelect.addEventListener('change', (e) => {
        this.currentLatexConfig.fontFamily = (e.target as HTMLSelectElement).value as any;
        this.scheduleRefreshLatexPreview();
      });
    }

    const mathFontSelect = this.root.querySelector('#ex-latex-math-font') as HTMLSelectElement;
    if (mathFontSelect) {
      mathFontSelect.addEventListener('change', (e) => {
        this.currentLatexConfig.mathFont = (e.target as HTMLSelectElement).value as any;
        this.scheduleRefreshLatexPreview();
      });
    }

    const sizeSelect = this.root.querySelector('#ex-latex-font-size') as HTMLSelectElement;
    if (sizeSelect) {
      sizeSelect.addEventListener('change', (e) => {
        this.currentLatexConfig.fontSize = (parseFloat((e.target as HTMLSelectElement).value) || 11) as any;
        this.scheduleRefreshLatexPreview();
      });
    }

    const pageNumberingSelect = this.root.querySelector('#ex-latex-page-numbering') as HTMLSelectElement;
    if (pageNumberingSelect) {
      pageNumberingSelect.addEventListener('change', (e) => {
        this.currentLatexConfig.pageNumbering = (e.target as HTMLSelectElement).value as any;
        this.scheduleRefreshLatexPreview();
      });
    }

    this.root.querySelectorAll('input[name="ex-latex-writing-space"]').forEach((radio) => {
      radio.addEventListener('change', (e) => {
        this.currentLatexConfig.writingSpace = (e.target as HTMLInputElement).value as any;
        this.scheduleRefreshLatexPreview();
      });
    });

    this.root.querySelectorAll('input[name="ex-latex-answer-mode"]').forEach((radio) => {
      radio.addEventListener('change', (e) => {
        this.currentLatexConfig.answerPlacement = (e.target as HTMLInputElement).value as any;
        this.scheduleRefreshLatexPreview();
      });
    });

    if (this.latexOverleafBtn) {
      this.latexOverleafBtn.addEventListener('click', () => {
        this.closeMoreExportMenu();
        this.openInOverleaf();
      });
    }
    if (this.latexCopyBtn) {
      this.latexCopyBtn.addEventListener('click', () => {
        this.closeMoreExportMenu();
        this.copyLatexCode();
      });
    }
    if (this.latexPreviewCopyBtn) {
      this.latexPreviewCopyBtn.addEventListener('click', () => this.copyLatexCode());
    }
    if (this.latexDownloadBtn) {
      this.latexDownloadBtn.addEventListener('click', () => {
        this.closeMoreExportMenu();
        this.downloadLatexFile();
      });
    }

    if (this.moreExportBtn && this.moreExportMenu) {
      this.moreExportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = this.moreExportMenu?.classList.contains('hidden');
        if (isHidden) {
          this.openMoreExportMenu();
        } else {
          this.closeMoreExportMenu();
        }
      });
      document.addEventListener('click', (e) => {
        if (!this.moreExportWrapper?.contains(e.target as Node)) {
          this.closeMoreExportMenu();
        }
      });
    }

    if (this.latexSettingsOpenBtn) {
      this.latexSettingsOpenBtn.addEventListener('click', () => this.openSettingsModal());
    }
    if (this.latexSettingsCloseBtn) {
      this.latexSettingsCloseBtn.addEventListener('click', () => this.closeSettingsModal());
    }
    if (this.latexSettingsCancelBtn) {
      this.latexSettingsCancelBtn.addEventListener('click', () => this.closeSettingsModal());
    }
    if (this.latexSettingsModal) {
      this.latexSettingsModal.addEventListener('click', (e) => {
        if (e.target === this.latexSettingsModal) this.closeSettingsModal();
      });
    }
    if (this.ghSaveConfigBtn) {
      this.ghSaveConfigBtn.addEventListener('click', () => this.saveCompilerSettings());
    }

    if (this.latexStartCompileBtn) {
      this.latexStartCompileBtn.addEventListener('click', () => {
        const config = getStoredCompilerConfig();
        if (!config.token) {
          this.openSettingsModal();
          this.host.showToast('请先配置具备 actions:write 权限的 GitHub Token');
          return;
        }
        this.switchLatexStage('result');
        this.startCloudCompilation();
      });
    }

    if (this.latexLocalCompileBtn) {
      this.latexLocalCompileBtn.addEventListener('click', () => {
        this.startLocalCompilation();
      });
    }

    if (this.latexBackConfigBtn) {
      this.latexBackConfigBtn.addEventListener('click', () => {
        this.switchLatexStage('config');
      });
    }

    if (this.latexDownloadPdfBtn) {
      this.latexDownloadPdfBtn.addEventListener('click', () => {
        if (this.currentCompiledPdfUrl) {
          this.downloadCompiledPdf();
        } else if (this.pipelineTimeoutCard && !this.pipelineTimeoutCard.classList.contains('hidden')) {
          this.continueWaitingCompilation();
        } else {
          this.host.showToast('尚未生成可下载的 PDF');
        }
      });
    }

    if (this.latexPrintBtn) {
      this.latexPrintBtn.addEventListener('click', () => {
        if (this.currentCompiledPdfUrl) {
          printPdfDirectly(this.currentCompiledPdfUrl);
          this.host.showToast('正在调起系统打印面板...');
        }
      });
    }

    if (this.latexCancelCompileBtn) {
      this.latexCancelCompileBtn.addEventListener('click', () => this.cancelCloudCompilation());
    }

    if (this.continueWaitBtn) {
      this.continueWaitBtn.addEventListener('click', () => this.continueWaitingCompilation());
    }
    if (this.checkResultNowBtn) {
      this.checkResultNowBtn.addEventListener('click', () => this.checkCompilationResultDirectly());
    }

    if (this.tabCloudBtn && this.tabSourceBtn) {
      this.tabCloudBtn.addEventListener('click', () => {
        this.tabCloudBtn?.classList.add('active');
        this.tabSourceBtn?.classList.remove('active');
        this.latexCloudPanel?.classList.remove('hidden');
        this.latexSourcePanel?.classList.add('hidden');
      });
      this.tabSourceBtn.addEventListener('click', () => {
        this.tabSourceBtn?.classList.add('active');
        this.tabCloudBtn?.classList.remove('active');
        this.latexSourcePanel?.classList.remove('hidden');
        this.latexCloudPanel?.classList.add('hidden');
      });
    }
  }

  public openLatexModal() {
    if (!this.latexModal) return;

    let title = '工科数学分析';
    let subtitle = '章节真题精选与自测练习';
    let courseName = '工科数学分析';

    const mode = this.host.getCurrentMode();
    if (mode === 'practice') {
      const ch = this.host.getCurrentChapter();
      const chapterData = this.host.getChapterData(ch);
      const chTitle = chapterData?.chapter_title || `第 ${ch} 章`;
      title = `工科数学分析 · ${chTitle}`;
      subtitle = '章节课后真题精选与自测演练';
      courseName = '工科数学分析';
    } else if (mode === 'paper') {
      const pId = this.host.getCurrentPaperId();
      const paperData = this.host.getPaperData(pId);
      title = paperData?.clean_title || paperData?.raw_title || `课程试卷 #${pId}`;
      courseName = paperData?.course_name || '高等数学';
      subtitle = paperData?.academic_year ? `${paperData.academic_year} 学年模拟自测试卷` : '期中期末标准测试卷';
    } else {
      const sq = this.host.getSearchQuery();
      title = sq ? `数理精选习题（"${sq}"）` : '数理真题精选集';
      subtitle = '题库智能检索与专题训练';
      courseName = '高等数学';
    }

    this.currentLatexConfig.title = title;
    this.currentLatexConfig.subtitle = subtitle;
    this.currentLatexConfig.courseName = courseName;

    const questions = this.host.getFilteredQuestions();

    if (this.latexModalMeta) {
      this.latexModalMeta.textContent = `${title} · 共 ${questions.length} 道习题`;
    }

    const cfg = getStoredCompilerConfig();
    if (this.ghTokenInput) this.ghTokenInput.value = cfg.token;
    if (this.ghRepoInput) this.ghRepoInput.value = `${cfg.owner}/${cfg.repo}`;
    if (this.ghTransportModeSelect) this.ghTransportModeSelect.value = cfg.transportMode || 'auto';

    const storedExport = getStoredExportSettings();
    if (storedExport.typography) {
      this.currentLatexConfig.typography = storedExport.typography;
    }
    const typoSelect = this.latexModal.querySelector('#ex-latex-typography') as HTMLSelectElement | null;
    if (typoSelect && this.currentLatexConfig.typography) {
      typoSelect.value = this.currentLatexConfig.typography;
    }

    this.syncChipSetSelection('ex-chip-set-template', 'data-template', this.currentLatexConfig.template || 'handout');
    this.syncChipSetSelection('ex-chip-set-header', 'data-header-mode', this.currentLatexConfig.headerMode || 'standard');
    this.syncChipSetSelection('ex-chip-set-writing-space', 'data-writing-space', this.currentLatexConfig.writingSpace || 'comfortable');
    this.syncChipSetSelection('ex-chip-set-answer-mode', 'data-answer-mode', this.currentLatexConfig.answerPlacement || 'appendix');
    if (this.templateHint) {
      this.templateHint.textContent =
        this.currentLatexConfig.template === 'handout'
          ? '大学数学教材体例 · 经典双线页眉 · 纯正学术出版排版'
          : '标准自测测试卷头 · 紧凑排版 · 纯净无干扰题面';
    }

    if (this.currentCompiledPdfUrl || this.isCompiling) {
      this.switchLatexStage('result');
    } else {
      this.switchLatexStage('config');
    }

    this.refreshLatexPreview();
    if (!this.currentCompiledPdfUrl) {
      this.setLatexExportState('idle');
    } else {
      this.setLatexExportState('ready');
    }
    this.latexModal.classList.remove('hidden');
  }

  public closeLatexModal() {
    this.latexModal?.classList.add('hidden');
    this.releaseLatexPdfViewer();
  }

  public isModalOpen(): boolean {
    return Boolean(this.latexModal && !this.latexModal.classList.contains('hidden'));
  }

  public destroy() {
    this.releaseLatexPdfViewer();
    if (this.compileTimerInterval) {
      clearInterval(this.compileTimerInterval);
      this.compileTimerInterval = null;
    }
    if (this.latexDebounceTimer) {
      clearTimeout(this.latexDebounceTimer);
      this.latexDebounceTimer = null;
    }
    this.compileAbortController?.abort();
  }

  public releaseLatexPdfViewer() {
    if (this.currentCompiledPdfUrl && this.currentCompiledPdfUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(this.currentCompiledPdfUrl);
      } catch {}
    }
    if (this.latexPdfIframe) {
      this.latexPdfIframe.src = 'about:blank';
    }
    this.currentCompiledPdfUrl = null;
  }

  public openSettingsModal() {
    const cfg = getStoredCompilerConfig();
    if (this.ghTokenInput) this.ghTokenInput.value = cfg.token;
    if (this.ghRepoInput) this.ghRepoInput.value = `${cfg.owner}/${cfg.repo}`;
    if (this.ghTransportModeSelect) this.ghTransportModeSelect.value = cfg.transportMode || 'auto';
    this.latexSettingsModal?.classList.remove('hidden');
    this.ghTokenInput?.focus();
  }

  public closeSettingsModal() {
    this.latexSettingsModal?.classList.add('hidden');
  }

  private openMoreExportMenu() {
    this.moreExportMenu?.classList.remove('hidden');
    this.moreExportWrapper?.classList.add('open');
    this.moreExportBtn?.setAttribute('aria-expanded', 'true');
  }

  private closeMoreExportMenu() {
    this.moreExportMenu?.classList.add('hidden');
    this.moreExportWrapper?.classList.remove('open');
    this.moreExportBtn?.setAttribute('aria-expanded', 'false');
  }

  private saveCompilerSettings() {
    const token = this.ghTokenInput?.value.trim() || '';
    const repoStr = this.ghRepoInput?.value.trim() || 'Ariesagittarius/AstroLib';
    const [owner, repo] = repoStr.split('/');
    const transportMode = (this.ghTransportModeSelect?.value as any) || 'auto';

    saveCompilerConfig({
      token,
      owner: owner || 'Ariesagittarius',
      repo: repo || 'AstroLib',
      transportMode,
    });

    this.closeSettingsModal();
    this.host.showToast('✓ 已保存 GitHub Actions 编译凭证与传输模式配置');
  }

  private switchLatexStage(stage: 'config' | 'result') {
    if (stage === 'config') {
      this.latexConfigView?.classList.remove('hidden');
      this.latexResultView?.classList.add('hidden');
      this.releaseLatexPdfViewer();
    } else {
      this.latexConfigView?.classList.add('hidden');
      this.latexResultView?.classList.remove('hidden');
    }
  }

  public getPdfExportFilename(): string {
    const texName = this.getLatexExportFilename();
    return texName.replace(/\.tex$/i, '.pdf');
  }

  public handleCloudCompileOrPrint() {
    if (this.currentCompiledPdfUrl) {
      printPdfDirectly(this.currentCompiledPdfUrl);
      this.host.showToast('正在调起浏览器原生打印面板...');
    } else {
      this.startCloudCompilation();
    }
  }

  public downloadCompiledPdf() {
    if (!this.currentCompiledPdfUrl) return;
    downloadPdfFile(this.currentCompiledPdfUrl, this.getPdfExportFilename());
    this.host.showToast(`已开始下载：${this.getPdfExportFilename()}`);
  }

  private setLatexExportState(
    state: 'idle' | 'compiling' | 'ready' | 'timeout' | 'failed',
    message?: string
  ) {
    if (!this.latexModal) return;

    if (state === 'idle') {
      this.isCompiling = false;
      this.releaseLatexPdfViewer();
      if (this.compileTimerInterval) clearInterval(this.compileTimerInterval);

      this.pipelineLoadingCard?.classList.add('hidden');
      this.pipelineTimeoutCard?.classList.add('hidden');
      this.pipelinePreviewFrame?.classList.add('hidden');
      this.latexPrintBtn?.classList.add('hidden');
      this.latexCancelCompileBtn?.classList.add('hidden');
      this.pipelineTimer?.classList.add('hidden');
      this.pipelineJobId?.classList.add('hidden');

      if (this.pipelineStatusPill) {
        this.pipelineStatusPill.className = 'ex-status-pill idle';
        this.pipelineStatusPill.textContent = '就绪';
      }
      if (this.pipelineStatusDesc) {
        this.pipelineStatusDesc.textContent = message || '就绪中，点击「开始生成 PDF」发起云端 XeLaTeX 编译排版';
      }
      if (this.latexStartCompileBtn) {
        this.latexStartCompileBtn.disabled = false;
      }
      if (this.latexDownloadPdfBtn) {
        this.latexDownloadPdfBtn.disabled = true;
      }
      if (this.latexDownloadPdfText) {
        this.latexDownloadPdfText.textContent = '下载 PDF';
      }
    } else if (state === 'compiling') {
      this.isCompiling = true;
      this.releaseLatexPdfViewer();
      this.switchLatexStage('result');
      this.pipelineLoadingCard?.classList.remove('hidden');
      this.pipelineTimeoutCard?.classList.add('hidden');
      this.pipelinePreviewFrame?.classList.add('hidden');
      this.latexPrintBtn?.classList.add('hidden');
      this.latexCancelCompileBtn?.classList.remove('hidden');
      this.pipelineTimer?.classList.remove('hidden');
      this.pipelineJobId?.classList.remove('hidden');

      if (this.pipelineStatusPill) {
        this.pipelineStatusPill.className = 'ex-status-pill compiling';
        this.pipelineStatusPill.textContent = '正在排版';
      }
      if (this.pipelineStatusDesc) {
        this.pipelineStatusDesc.textContent = message || '正在调度云端算力节点并排版生成 PDF...';
      }
      if (this.latexStartCompileBtn) {
        this.latexStartCompileBtn.disabled = true;
      }
      if (this.latexDownloadPdfBtn) {
        this.latexDownloadPdfBtn.disabled = true;
      }
      if (this.latexDownloadPdfText) {
        this.latexDownloadPdfText.textContent = '正在排版...';
      }
    } else if (state === 'ready') {
      this.isCompiling = false;
      this.switchLatexStage('result');
      if (this.compileTimerInterval) clearInterval(this.compileTimerInterval);

      this.pipelineLoadingCard?.classList.add('hidden');
      this.pipelineTimeoutCard?.classList.add('hidden');
      this.pipelinePreviewFrame?.classList.remove('hidden');
      this.latexPrintBtn?.classList.remove('hidden');
      this.latexCancelCompileBtn?.classList.add('hidden');

      if (this.pipelineStatusPill) {
        this.pipelineStatusPill.className = 'ex-status-pill ready';
        this.pipelineStatusPill.textContent = '✓ 已生成';
      }
      if (this.pipelineStatusDesc) {
        this.pipelineStatusDesc.textContent = message || '✓ 编译成功！高清矢量 PDF 已就绪，可直接预览或下载';
      }
      if (this.latexStartCompileBtn) {
        this.latexStartCompileBtn.disabled = false;
      }
      if (this.latexDownloadPdfBtn) {
        this.latexDownloadPdfBtn.disabled = false;
      }
      if (this.latexDownloadPdfText) {
        this.latexDownloadPdfText.textContent = '下载 PDF';
      }
    } else if (state === 'timeout') {
      this.isCompiling = false;
      this.releaseLatexPdfViewer();
      this.switchLatexStage('result');
      if (this.compileTimerInterval) clearInterval(this.compileTimerInterval);

      this.pipelineLoadingCard?.classList.add('hidden');
      this.pipelineTimeoutCard?.classList.remove('hidden');
      this.pipelinePreviewFrame?.classList.add('hidden');
      this.latexPrintBtn?.classList.add('hidden');
      this.latexCancelCompileBtn?.classList.add('hidden');

      if (this.pipelineStatusPill) {
        this.pipelineStatusPill.className = 'ex-status-pill queued';
        this.pipelineStatusPill.textContent = '排队/编译中';
      }
      if (this.pipelineStatusDesc) {
        this.pipelineStatusDesc.textContent = message || '云端编译耗时较长（GitHub 节点排队中）。任务仍在云端继续运行';
      }
      if (this.pipelineTimeoutDesc && message) {
        this.pipelineTimeoutDesc.textContent = message;
      }
      if (this.latexStartCompileBtn) {
        this.latexStartCompileBtn.disabled = false;
      }
      if (this.latexDownloadPdfBtn) {
        this.latexDownloadPdfBtn.disabled = true;
      }
      if (this.latexDownloadPdfText) {
        this.latexDownloadPdfText.textContent = '继续等待编译';
      }
    } else if (state === 'failed') {
      this.isCompiling = false;
      this.releaseLatexPdfViewer();
      this.switchLatexStage('result');
      if (this.compileTimerInterval) clearInterval(this.compileTimerInterval);

      this.pipelineLoadingCard?.classList.add('hidden');
      this.pipelineTimeoutCard?.classList.add('hidden');
      this.pipelinePreviewFrame?.classList.add('hidden');
      this.latexPrintBtn?.classList.add('hidden');
      this.latexCancelCompileBtn?.classList.add('hidden');

      if (this.pipelineStatusPill) {
        this.pipelineStatusPill.className = 'ex-status-pill failed';
        this.pipelineStatusPill.textContent = '编译失败';
      }
      if (this.pipelineStatusDesc) {
        this.pipelineStatusDesc.textContent = message || '编译未完成，请展开下方诊断日志查看原因';
      }
      if (this.latexStartCompileBtn) {
        this.latexStartCompileBtn.disabled = false;
      }
      if (this.latexDownloadPdfBtn) {
        this.latexDownloadPdfBtn.disabled = true;
      }
      if (this.latexDownloadPdfText) {
        this.latexDownloadPdfText.textContent = '重新生成 PDF';
      }
      if (this.latexLogDrawer) {
        this.latexLogDrawer.open = true;
      }
    }
  }

  public async startCloudCompilation() {
    if (this.isCompiling) return;

    const config = getStoredCompilerConfig();
    if (!config.token) {
      this.openSettingsModal();
      this.host.showToast('请先配置具备 actions:write 权限的 GitHub Token');
      return;
    }

    if (this.latexDebounceTimer) {
      clearTimeout(this.latexDebounceTimer);
      this.latexDebounceTimer = null;
      this.refreshLatexPreview();
    } else if (!this.currentGeneratedLatexCode) {
      this.refreshLatexPreview();
    }

    const jobId = generateJobId();
    this.currentCompileJobId = jobId;
    this.currentCompiledPdfUrl = null;
    this.compileAbortController = new AbortController();
    this.compileStartTime = Date.now();

    this.switchLatexStage('result');
    this.setLatexExportState('compiling', '正在向 GitHub Actions 算力池调度编译任务...');

    if (this.pipelineJobId) {
      this.pipelineJobId.textContent = jobId;
    }
    if (this.pipelineTimer) {
      this.pipelineTimer.textContent = '00:00';
    }

    if (this.compileTimerInterval) clearInterval(this.compileTimerInterval);
    this.compileTimerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.compileStartTime) / 1000);
      const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const s = String(elapsed % 60).padStart(2, '0');
      if (this.pipelineTimer) this.pipelineTimer.textContent = `${m}:${s}`;
    }, 1000);

    if (this.latexLogPre) {
      this.latexLogPre.textContent = `[${new Date().toLocaleTimeString()}] 准备派发任务 ${jobId} 至 ${config.owner}/${config.repo}...\n`;
    }

    try {
      if (this.latexLogPre) {
        this.latexLogPre.textContent += `[${new Date().toLocaleTimeString()}] 正在调度 GitHub workflow_dispatch (${config.workflowFile})...\n`;
      }

      const dispatchRes = await dispatchCompileWorkflow(
        jobId,
        this.currentGeneratedLatexCode,
        this.getPdfExportFilename(),
        config,
        (msg) => {
          if (this.latexLogPre) {
            this.latexLogPre.textContent += `[${new Date().toLocaleTimeString()}] ${msg}\n`;
          }
        }
      );

      if (this.latexLogPre) {
        const modeLabel = dispatchRes.modeUsed === 'blob' ? 'Git Blob' : 'Gzip';
        this.latexLogPre.textContent += `[${new Date().toLocaleTimeString()}] 任务已调度 (${modeLabel})，等待 Runner 执行...\n`;
      }

      const pdfUrl = await pollCompileResult(
        jobId,
        this.getPdfExportFilename(),
        config,
        (state) => {
          if (this.pipelineStatusDesc) this.pipelineStatusDesc.textContent = state.statusText;
          if (this.pipelineProgressBar) this.pipelineProgressBar.style.width = `${state.progress}%`;
          if (this.loadingTitle) this.loadingTitle.textContent = state.statusText;
        },
        this.compileAbortController.signal
      );

      this.currentCompiledPdfUrl = pdfUrl;
      if (this.latexPdfIframe) {
        try {
          this.latexPdfIframe.contentWindow?.location.replace(pdfUrl);
        } catch {
          this.latexPdfIframe.src = pdfUrl;
        }
      }
      const totalElapsed = Math.floor((Date.now() - this.compileStartTime) / 1000);
      this.setLatexExportState('ready', `✓ 编译成功！文档已生成 (总耗时 ${totalElapsed}s)`);

      if (this.latexLogPre) {
        this.latexLogPre.textContent += `[${new Date().toLocaleTimeString()}] 编译成功！获取 Release PDF 直链: ${pdfUrl}\n`;
      }

      this.host.showToast('✓ XeLaTeX 编译完成！可直接下载或打印');
    } catch (err: any) {
      if (err.message?.includes('超时') || err.message?.includes('耗时较长')) {
        this.setLatexExportState('timeout', err.message);
        if (this.latexLogPre) {
          this.latexLogPre.textContent += `\n[${new Date().toLocaleTimeString()}] 提示: ${err.message}\n`;
        }
      } else if (err.name === 'AbortError' || this.compileAbortController?.signal.aborted) {
        this.setLatexExportState('idle', '用户已取消本次排版编译');
      } else {
        this.setLatexExportState('failed', err.message || '排版编译未完成，请展开诊断日志查看原因');
        if (this.latexLogPre) {
          this.latexLogPre.textContent += `\n[${new Date().toLocaleTimeString()}] 错误: ${err.message || err}\n`;
        }
        this.host.showToast(`编译未完成: ${err.message || '请检查日志'}`);
      }
    }
  }

  public async startLocalCompilation() {
    if (this.isCompiling) return;

    try {
      const healthResp = await fetch('/__chapter_export__/health');
      if (!healthResp.ok) {
        throw new Error('本地编译服务未正常响应');
      }
      const health = await healthResp.json();
      if (!health.ok || !health.hasLocalXelatex) {
        this.host.showToast('未检测到本地 XeLaTeX 编译器 (TeX Live/MacTeX/MiKTeX)，请安装或使用云端编译');
        return;
      }
    } catch {
      this.host.showToast('本地导出编译器服务不可用，请确保开发服务正常运行');
      return;
    }

    if (this.latexDebounceTimer) {
      clearTimeout(this.latexDebounceTimer);
      this.latexDebounceTimer = null;
      this.refreshLatexPreview();
    } else if (!this.currentGeneratedLatexCode) {
      this.refreshLatexPreview();
    }

    const jobId = generateJobId();
    this.currentCompileJobId = jobId;
    this.currentCompiledPdfUrl = null;
    this.compileAbortController = new AbortController();
    this.compileStartTime = Date.now();

    const pdfFilename = this.getPdfExportFilename();

    this.switchLatexStage('result');
    this.setLatexExportState('compiling', '正在调用本地 XeLaTeX 编译器离线双遍排版...');

    if (this.pipelineJobId) {
      this.pipelineJobId.textContent = `local-${jobId}`;
    }
    if (this.pipelineTimer) {
      this.pipelineTimer.textContent = '00:00';
    }

    if (this.compileTimerInterval) clearInterval(this.compileTimerInterval);
    this.compileTimerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.compileStartTime) / 1000);
      const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const s = String(elapsed % 60).padStart(2, '0');
      if (this.pipelineTimer) this.pipelineTimer.textContent = `${m}:${s}`;
    }, 1000);

    if (this.latexLogPre) {
      this.latexLogPre.textContent = `[${new Date().toLocaleTimeString()}] 准备调用本地 XeLaTeX 离线双遍编译: ${pdfFilename}...\n`;
    }

    try {
      const resp = await fetch('/__chapter_export__/compile-latex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latex: this.currentGeneratedLatexCode,
          filename: pdfFilename,
        }),
        signal: this.compileAbortController.signal,
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({ message: `本地编译失败 (HTTP ${resp.status})` }));
        if (this.latexLogPre) {
          this.latexLogPre.textContent += `\n[${new Date().toLocaleTimeString()}] 编译失败:\n${errJson.logSnippet || errJson.message}\n`;
        }
        this.setLatexExportState('failed', errJson.message || '本地 XeLaTeX 编译失败，请展开下方诊断日志查看原因');
        this.host.showToast(`本地编译失败: ${errJson.message || '请检查控制台'}`);
        return;
      }

      const blob = await resp.blob();
      const pdfUrl = URL.createObjectURL(blob);
      this.currentCompiledPdfUrl = pdfUrl;

      if (this.latexPdfIframe) {
        try {
          this.latexPdfIframe.contentWindow?.location.replace(pdfUrl);
        } catch {
          this.latexPdfIframe.src = pdfUrl;
        }
      }

      const totalElapsed = Math.floor((Date.now() - this.compileStartTime) / 1000);
      this.setLatexExportState('ready', `✓ 本地编译成功！矢量 PDF 已就绪 (总耗时 ${totalElapsed}s)`);

      if (this.latexLogPre) {
        this.latexLogPre.textContent += `[${new Date().toLocaleTimeString()}] 本地 XeLaTeX 双遍编译完成！已生成 PDF 目标产物并自动下载。\n`;
      }

      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = pdfFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      this.host.showToast(`✓ 本地编译完成并开始下载：${pdfFilename}`);
    } catch (err: any) {
      if (err.name === 'AbortError' || this.compileAbortController?.signal.aborted) {
        this.setLatexExportState('idle', '已取消本地编译');
      } else {
        this.setLatexExportState('failed', err.message || '本地编译异常');
        if (this.latexLogPre) {
          this.latexLogPre.textContent += `\n[${new Date().toLocaleTimeString()}] 错误: ${err.message || err}\n`;
        }
        this.host.showToast(`编译异常: ${err.message || err}`);
      }
    }
  }

  private syncChipSetSelection(chipSetId: string, dataAttr: string, activeValue: string) {
    const chipSet = this.root?.querySelector(`#${chipSetId}`);
    if (!chipSet) return;
    chipSet.querySelectorAll<any>('md-filter-chip').forEach((chip) => {
      const isSelected = chip.getAttribute(dataAttr) === activeValue;
      chip.selected = isSelected;
      chip.toggleAttribute('selected', isSelected);
      chip.toggleAttribute('has-selected-icon', isSelected);
    });
  }

  private bindChipSetSingleSelect(
    chipSetId: string,
    dataAttr: string,
    getValue: () => string,
    onSelect: (val: string) => void
  ) {
    const chipSet = this.root?.querySelector(`#${chipSetId}`);
    if (!chipSet) return;
    chipSet.querySelectorAll<any>('md-filter-chip').forEach((chip) => {
      chip.addEventListener('click', (e: Event) => {
        const val = chip.getAttribute(dataAttr);
        if (!val) return;
        if (val === getValue()) {

          e.preventDefault();
          this.syncChipSetSelection(chipSetId, dataAttr, val);
          return;
        }
        e.stopPropagation();
        onSelect(val);
        this.syncChipSetSelection(chipSetId, dataAttr, val);
        this.scheduleRefreshLatexPreview();
      });
    });
  }

  private async continueWaitingCompilation() {
    if (!this.currentCompileJobId) {
      this.startCloudCompilation();
      return;
    }

    const config = getStoredCompilerConfig();
    const elapsed = Math.floor((Date.now() - this.compileStartTime) / 1000);

    this.setLatexExportState('compiling', `继续等待云端排版结果 (已耗时 ${elapsed}s)...`);
    this.compileAbortController = new AbortController();

    if (this.compileTimerInterval) clearInterval(this.compileTimerInterval);
    this.compileTimerInterval = setInterval(() => {
      const nowElapsed = Math.floor((Date.now() - this.compileStartTime) / 1000);
      const m = String(Math.floor(nowElapsed / 60)).padStart(2, '0');
      const s = String(nowElapsed % 60).padStart(2, '0');
      if (this.pipelineTimer) this.pipelineTimer.textContent = `${m}:${s}`;
    }, 1000);

    try {
      const pdfUrl = await pollCompileResult(
        this.currentCompileJobId,
        this.getPdfExportFilename(),
        config,
        (state) => {
          if (this.pipelineStatusDesc) this.pipelineStatusDesc.textContent = state.statusText;
          if (this.pipelineProgressBar) this.pipelineProgressBar.style.width = `${state.progress}%`;
          if (this.loadingTitle) this.loadingTitle.textContent = state.statusText;
        },
        this.compileAbortController.signal,
        elapsed
      );

      this.currentCompiledPdfUrl = pdfUrl;
      if (this.latexPdfIframe) {
        try {
          this.latexPdfIframe.contentWindow?.location.replace(pdfUrl);
        } catch {
          this.latexPdfIframe.src = pdfUrl;
        }
      }
      const totalElapsed = Math.floor((Date.now() - this.compileStartTime) / 1000);
      this.setLatexExportState('ready', `✓ 编译成功！已获取 PDF (总耗时 ${totalElapsed}s)`);
      this.host.showToast('✓ XeLaTeX 编译完成！已生成高清矢量 PDF');
    } catch (err: any) {
      if (err.message?.includes('超时') || err.message?.includes('耗时较长')) {
        this.setLatexExportState('timeout', err.message);
      } else if (err.name === 'AbortError' || this.compileAbortController?.signal.aborted) {
        this.setLatexExportState('idle', '已取消编译轮询');
      } else {
        this.setLatexExportState('failed', err.message);
      }
    }
  }

  private async checkCompilationResultDirectly() {
    if (!this.currentCompileJobId) return;
    const config = getStoredCompilerConfig();
    this.host.showToast('正在向 GitHub Release 查询资产...');
    const pdfUrl = await checkReleaseDirectly(this.currentCompileJobId, config);
    if (pdfUrl) {
      this.currentCompiledPdfUrl = pdfUrl;
      if (this.latexPdfIframe) {
        try {
          this.latexPdfIframe.contentWindow?.location.replace(pdfUrl);
        } catch {
          this.latexPdfIframe.src = pdfUrl;
        }
      }
      const totalElapsed = Math.floor((Date.now() - this.compileStartTime) / 1000);
      this.setLatexExportState('ready', `✓ 检测到云端已生成 PDF！(耗时 ${totalElapsed}s)`);
      this.host.showToast('✓ 成功获取已编译好的 PDF！');
    } else {
      this.host.showToast('云端还在处理中，尚未生成 PDF Release 资产，请稍候点击「继续等待」');
    }
  }

  private cancelCloudCompilation() {
    this.compileAbortController?.abort();
    this.setLatexExportState('idle', '已取消本次排版编译');
    this.host.showToast('已取消编译');
  }

  public scheduleRefreshLatexPreview(immediate = false) {
    if (immediate) {
      if (this.latexDebounceTimer) {
        clearTimeout(this.latexDebounceTimer);
        this.latexDebounceTimer = null;
      }
      this.refreshLatexPreview();
      return;
    }
    if (this.latexDebounceTimer) {
      clearTimeout(this.latexDebounceTimer);
    }
    this.latexDebounceTimer = setTimeout(() => {
      this.latexDebounceTimer = null;
      this.refreshLatexPreview();
    }, 250);
  }

  public refreshLatexPreview() {
    if (!this.latexModal) return;

    const questions = this.host.getFilteredQuestions();

    this.currentGeneratedLatexCode = generateLatexDocument(questions, this.currentLatexConfig);

    if (this.latexCodeTextarea) {
      this.latexCodeTextarea.value = this.currentGeneratedLatexCode;
    }

    const qCountEl = this.latexModal.querySelector('#ex-latex-stat-qcount');
    const linesEl = this.latexModal.querySelector('#ex-latex-stat-lines');

    const linesCount = this.currentGeneratedLatexCode.split('\n').length;

    if (qCountEl) qCountEl.textContent = `题目：${questions.length} 题`;
    if (linesEl) linesEl.textContent = `${linesCount} 行代码`;

    const defaultFilename = this.getLatexExportFilename();
    if (this.latexFilenameBadge) {
      this.latexFilenameBadge.textContent = defaultFilename;
    }
  }

  public getLatexExportFilename(): string {
    const sanitizeName = (str: string) => str.replace(/[^\w\u4e00-\u9fa5\-]/g, '_').replace(/_+/g, '_');
    const mode = this.host.getCurrentMode();
    if (mode === 'practice') {
      const ch = this.host.getCurrentChapter();
      const chData = this.host.getChapterData(ch);
      const chName = sanitizeName(chData?.chapter_title || `ch${ch}`);
      return `astrolib_${chName}_exercises.tex`;
    } else if (mode === 'paper') {
      const pId = this.host.getCurrentPaperId();
      const paperData = this.host.getPaperData(pId);
      const pName = sanitizeName(paperData?.clean_title || `paper_${pId}`);
      return `astrolib_${pName}.tex`;
    } else {
      const sq = this.host.getSearchQuery();
      const queryName = sq ? sanitizeName(sq) : 'search_results';
      return `astrolib_${queryName}_exercises.tex`;
    }
  }

  public copyLatexCode() {
    if (!this.currentGeneratedLatexCode) return;
    navigator.clipboard
      .writeText(this.currentGeneratedLatexCode)
      .then(() => {
        this.host.showToast('LaTeX 源码已成功复制至剪贴板！');
      })
      .catch(() => {
        this.host.showToast('复制失败，请手动选中文本框复制');
      });
  }

  public openInOverleaf() {
    if (!this.currentGeneratedLatexCode) return;
    const filename = this.getLatexExportFilename();
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://www.overleaf.com/docs';
    form.target = '_blank';

    const snipInput = document.createElement('input');
    snipInput.type = 'hidden';
    snipInput.name = 'snip';
    snipInput.value = this.currentGeneratedLatexCode;

    const nameInput = document.createElement('input');
    nameInput.type = 'hidden';
    nameInput.name = 'snip_name';
    nameInput.value = filename;

    form.appendChild(snipInput);
    form.appendChild(nameInput);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
    this.host.showToast('正在打开 Overleaf 云端排版平台...');
  }

  public downloadLatexFile() {
    if (!this.currentGeneratedLatexCode) return;
    const filename = this.getLatexExportFilename();
    const blob = new Blob([this.currentGeneratedLatexCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.host.showToast(`已开始下载：${filename}`);
  }
}
