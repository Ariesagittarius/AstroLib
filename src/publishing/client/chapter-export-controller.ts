import '@material/web/dialog/dialog.js';
  import '@material/web/button/filled-button.js';
  import '@material/web/button/outlined-button.js';
  import '@material/web/button/filled-tonal-button.js';
  import '@material/web/iconbutton/icon-button.js';
  import '@material/web/icon/icon.js';
  import '@material/web/select/outlined-select.js';
  import '@material/web/select/select-option.js';
  import '@material/web/textfield/outlined-text-field.js';
  import '@material/web/progress/linear-progress.js';

  import {
    getStoredExportSettings,
    saveStoredExportSettings,
  } from '../common/export-settings.ts';
  import {
    dispatchCompileWorkflow,
    pollCompileResult,
    getStoredCompilerConfig,
    saveCompilerConfig,
    generateJobId,
  } from '../../utils/latex/latex-cloud-compiler.ts';
  import { mountToOverlayRoot } from '../../utils/overlay/overlay-root.ts';

  let currentOpenModal: (() => void) | null = null;

  export function setupChapterExport() {
    const newModal = document.getElementById('chapter-export-modal');
    if (!newModal) return;

    const existingModals = document.querySelectorAll('#astro-overlay-root > #chapter-export-modal, body > #chapter-export-modal');
    existingModals.forEach((el) => {
      if (el !== newModal) el.remove();
    });

    mountToOverlayRoot(newModal);
    const modal = newModal as any;

    function ensureDialogCentered(targetModal: HTMLElement) {
      const target = targetModal as any;
      if (typeof target.getOpenAnimation === 'function') {
        target.getOpenAnimation = () => ({
          dialog: [
            [
              [{ opacity: 0, transform: 'scale(0.96) translateY(-8px)' }, { opacity: 1, transform: 'scale(1) translateY(0)' }],
              { duration: 160, easing: 'cubic-bezier(0.1, 0.9, 0.2, 1)' },
            ],
          ],
          scrim: [
            [
              [{ opacity: 0 }, { opacity: 0.32 }],
              { duration: 160, easing: 'linear' },
            ],
          ],
        });
        target.getCloseAnimation = () => ({
          dialog: [
            [
              [{ opacity: 1, transform: 'scale(1) translateY(0)' }, { opacity: 0, transform: 'scale(0.96) translateY(-8px)' }],
              { duration: 120, easing: 'cubic-bezier(0.4, 0, 1, 1)' },
            ],
          ],
          scrim: [
            [
              [{ opacity: 0.32 }, { opacity: 0 }],
              { duration: 120, easing: 'linear' },
            ],
          ],
        });
      }

      const shadow = targetModal.shadowRoot;
      if (!shadow) return;
      const nativeDialog = shadow.querySelector('dialog');
      if (nativeDialog) {
        nativeDialog.style.margin = 'auto';
        nativeDialog.style.inset = '0';
      }
      let style = shadow.querySelector('#m3-dialog-centering-style') as HTMLStyleElement | null;
      if (!style) {
        style = document.createElement('style');
        style.id = 'm3-dialog-centering-style';
        shadow.appendChild(style);
      }
      style.textContent = `
        dialog {
          margin: auto !important;
          inset: 0 !important;
          transform-origin: center center;
        }
        .scrim {
          z-index: var(--layer-dialog, 500) !important;
        }
        ::backdrop {
          background: rgba(0, 0, 0, 0.32) !important;
        }
        /* 锁定标题栏分割线常驻与内边距，彻底消除打开时异步计算导致的跳动 */
        .headline md-divider {
          display: flex !important;
          position: absolute !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          width: 100% !important;
          opacity: 1 !important;
        }
        slot[name=headline]::slotted(*) {
          padding: 24px 24px 16px !important;
        }
      `;
    }
    ensureDialogCentered(newModal);

    if (modal.hasAttribute('data-initialized')) {
      const h1 = document.querySelector('h1#_top') || document.querySelector('h1');
      const title = h1 ? h1.textContent?.trim() || '当前章节' : '当前章节';
      const nameEl = modal.querySelector('#export-chapter-name');
      if (nameEl) nameEl.textContent = title;
      return;
    }
    modal.setAttribute('data-initialized', 'true');

    const chapterNameEl = modal.querySelector('#export-chapter-name');
    const statusBox = modal.querySelector('#export-progress-container') as HTMLElement | null;
    const statusText = modal.querySelector('#export-status-text');

    const selectFormat = modal.querySelector('#chapter-export-format') as any;
    const selectTypography = modal.querySelector('#chapter-typography') as any;
    const selectSidenoteMode = modal.querySelector('#chapter-sidenote-mode') as any;
    const selectFontSize = modal.querySelector('#chapter-font-size') as any;
    const selectPaperSize = modal.querySelector('#chapter-paper-size') as any;

    const selectCjkFont = modal.querySelector('#chapter-cjk-font') as HTMLSelectElement | null;
    const selectMathFont = modal.querySelector('#chapter-math-font') as HTMLSelectElement | null;

    const cloudTokenRow = modal.querySelector('#cloud-token-row') as HTMLElement | null;
    const inputToken = modal.querySelector('#input-gh-token') as any;
    const btnSaveToken = modal.querySelector('#btn-save-token') as any;
    const btnMainExport = modal.querySelector('#btn-main-export') as any;

    const btnTex = modal.querySelector('#btn-export-tex') as HTMLElement | null;
    const btnZip = modal.querySelector('#btn-export-zip') as HTMLElement | null;
    const btnPdf = modal.querySelector('#btn-export-pdf') as HTMLElement | null;
    const btnCloudPdf = modal.querySelector('#btn-export-cloud-pdf') as HTMLElement | null;

    const initialSettings = getStoredExportSettings();
    if (selectTypography && initialSettings.typography) selectTypography.value = initialSettings.typography;
    if (selectSidenoteMode && initialSettings.sidenoteMode) selectSidenoteMode.value = initialSettings.sidenoteMode;
    if (selectCjkFont && initialSettings.cjkFont) selectCjkFont.value = initialSettings.cjkFont;
    if (selectMathFont && initialSettings.mathFont) selectMathFont.value = initialSettings.mathFont;
    if (selectFontSize && initialSettings.fontSize) selectFontSize.value = String(initialSettings.fontSize);
    if (selectPaperSize && initialSettings.paperSize) selectPaperSize.value = initialSettings.paperSize;

    function onSettingsChange() {
      const typography = (selectTypography?.value || 'scholarly') as any;
      const sidenoteMode = (selectSidenoteMode?.value || 'inline') as any;
      const fontSize = parseFloat(selectFontSize?.value || '11') as any;
      const paperSize = (selectPaperSize?.value || 'a4') as any;
      saveStoredExportSettings({ typography, sidenoteMode, fontSize, paperSize });
    }

    selectTypography?.addEventListener('change', onSettingsChange);
    selectTypography?.addEventListener('input', onSettingsChange);
    selectSidenoteMode?.addEventListener('change', onSettingsChange);
    selectSidenoteMode?.addEventListener('input', onSettingsChange);
    selectFontSize?.addEventListener('change', onSettingsChange);
    selectFontSize?.addEventListener('input', onSettingsChange);
    selectPaperSize?.addEventListener('change', onSettingsChange);
    selectPaperSize?.addEventListener('input', onSettingsChange);

    const isLocalDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    function updateFormatUi() {
      const currentFormat = selectFormat?.value || 'print';
      const isCloud = currentFormat === 'pdf-cloud';
      if (cloudTokenRow) {
        cloudTokenRow.style.display = isCloud ? 'flex' : 'none';
        if (isCloud && inputToken && !inputToken.value) {
          inputToken.focus();
        }
      }

      if (!isLocalDev && (currentFormat === 'pdf-local' || currentFormat === 'tex' || currentFormat === 'zip')) {
        if (statusBox && statusText) {
          statusBox.style.display = 'flex';
          statusText.textContent = '提示：该导出格式需在本地开发环境 (astro dev) 中运行，在线阅读推荐使用【网页打印 / 另存为 PDF】。';
        }
      } else if (!isCloud) {
        if (statusBox) statusBox.style.display = 'none';
      }
    }
    selectFormat?.addEventListener('change', updateFormatUi);
    selectFormat?.addEventListener('input', updateFormatUi);

    const cloudCfg = getStoredCompilerConfig();
    if (inputToken && cloudCfg.token) {
      inputToken.value = cloudCfg.token;
    }

    btnSaveToken?.addEventListener('click', () => {
      const tokenVal = inputToken?.value?.trim() || '';
      saveCompilerConfig({ token: tokenVal });
      if (statusBox && statusText) {
        statusBox.style.display = 'flex';
        statusText.textContent = tokenVal ? '已保存凭据' : '已清除凭据';
        setTimeout(() => {
          if (statusBox) statusBox.style.display = 'none';
        }, 2200);
      }
    });

    function openModal() {
      currentOpenModal = openModal;
      const activeModal = document.getElementById('chapter-export-modal') as any;
      if (!activeModal) return;
      const h1 = document.querySelector('h1#_top') || document.querySelector('h1');
      const title = h1 ? h1.textContent?.trim() || '当前章节' : '当前章节';
      const nameEl = activeModal.querySelector('#export-chapter-name');
      if (nameEl) nameEl.textContent = title;

      if (!isLocalDev && selectFormat && (selectFormat.value === 'pdf-local' || selectFormat.value === 'zip')) {
        selectFormat.value = 'print';
      }

      ensureDialogCentered(activeModal);
      activeModal.classList.add('open');
      activeModal.setAttribute('aria-hidden', 'false');
      if (typeof activeModal.show === 'function') {
        activeModal.show();
      } else {
        activeModal.open = true;
      }
      ensureDialogCentered(activeModal);
      updateFormatUi();
    }

    function closeModal() {
      const activeModal = document.getElementById('chapter-export-modal') as any;
      if (!activeModal) return;
      if (typeof activeModal.close === 'function') {
        activeModal.close();
      } else {
        activeModal.open = false;
        activeModal.classList.remove('open');
        activeModal.setAttribute('aria-hidden', 'true');
      }
      const prog = activeModal.querySelector('#export-progress-container') as HTMLElement | null;
      if (prog) prog.style.display = 'none';
    }

    modal.querySelectorAll('[data-close-export-modal]').forEach((btn: Element) => {
      btn.addEventListener('click', closeModal);
    });

    modal.addEventListener('closed', () => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      const prog = modal.querySelector('#export-progress-container') as HTMLElement | null;
      if (prog) prog.style.display = 'none';
    });

    modal.addEventListener('cancel', () => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    });

    if (!(window as any).__astrolib_chapter_export_bound) {
      (window as any).__astrolib_chapter_export_bound = true;

      document.addEventListener('keydown', (e) => {
        const activeModal = document.getElementById('chapter-export-modal') as any;
        if ((e.altKey && (e.key === 'x' || e.key === 'X')) || (e.ctrlKey && e.altKey && (e.key === 'x' || e.key === 'X'))) {
          e.preventDefault();
          openModal();
        } else if (e.key === 'Escape' && activeModal?.open) {
          closeModal();
        }
      });

      document.addEventListener('click', (e) => {
        const trigger = (e.target as HTMLElement)?.closest('[data-chapter-export-trigger]');
        if (trigger) {
          e.preventDefault();
          openModal();
        }
      });
    }

    async function triggerDownload(format: 'tex' | 'zip' | 'pdf', targetBtn: any) {
      if (targetBtn) targetBtn.disabled = true;

      if (!isLocalDev) {
        if (statusBox && statusText) {
          statusBox.style.display = 'flex';
          statusText.textContent = '当前处于云端生产站点，本地 XeLaTeX 编译与源码包导出需在本地开发环境 (astro dev) 中运行。在线阅读推荐使用【网页打印 / 另存为 PDF】直接导出。';
          setTimeout(() => {
            if (statusBox) statusBox.style.display = 'none';
          }, 5500);
        }
        if (targetBtn) targetBtn.disabled = false;
        return;
      }

      if (statusBox && statusText) {
        statusBox.style.display = 'flex';
        statusText.textContent =
          format === 'pdf'
            ? '正在调用本地 XeLaTeX 执行双遍编译...'
            : `正在生成 ${format.toUpperCase()} 产物...`;
      }

      const currentPath = decodeURI(window.location.pathname);
      const typography = selectTypography?.value || 'scholarly';
      const sidenoteMode = selectSidenoteMode?.value || getStoredExportSettings().sidenoteMode || 'inline';
      const fontSize = selectFontSize?.value || '11';
      const paperSize = selectPaperSize?.value || 'a4';

      const downloadUrl = `/__chapter_export__/export?pathname=${encodeURIComponent(currentPath)}&format=${format}&typography=${encodeURIComponent(typography)}&sidenoteMode=${encodeURIComponent(sidenoteMode)}&fontSize=${encodeURIComponent(fontSize)}&paperSize=${encodeURIComponent(paperSize)}`;

      try {
        const resp = await fetch(downloadUrl);
        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.message || `导出失败 (HTTP ${resp.status})`);
        }

        const disposition = resp.headers.get('content-disposition') || '';
        let filename = `chapter_${Date.now()}.${format}`;
        const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="([^"]+)"/);
        if (match) {
          filename = decodeURIComponent(match[1] || match[2]);
        }

        const blob = await resp.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);

        if (statusBox && statusText) {
          statusText.textContent = `${filename} 已生成并开始下载`;
          setTimeout(() => {
            if (statusBox) statusBox.style.display = 'none';
          }, 3500);
        }
      } catch (err: any) {
        console.error('[chapter-export] 下载异常:', err);
        if (statusBox && statusText) {
          statusText.textContent = `导出失败: ${err.message || '服务不可用'}`;
        }
      } finally {
        if (targetBtn) targetBtn.disabled = false;
      }
    }

    async function triggerCloudPdf(targetBtn: any) {
      const storedCfg = getStoredCompilerConfig();
      if (!storedCfg.token) {
        if (cloudTokenRow) {
          cloudTokenRow.style.display = 'flex';
          if (inputToken) inputToken.focus();
        }
        if (statusBox && statusText) {
          statusBox.style.display = 'flex';
          statusText.textContent = '请先配置具备 actions:write 权限的 GitHub PAT 凭据';
        }
        return;
      }

      if (!isLocalDev) {
        if (statusBox && statusText) {
          statusBox.style.display = 'flex';
          statusText.textContent = '云端编译需依赖本地环境提供 AST 源码，当前在线阅读推荐使用【网页打印 / 另存为 PDF】直接生成文件。';
          setTimeout(() => {
            if (statusBox) statusBox.style.display = 'none';
          }, 5000);
        }
        return;
      }

      if (targetBtn) targetBtn.disabled = true;
      if (statusBox && statusText) {
        statusBox.style.display = 'flex';
        statusText.textContent = '正在获取当前章节 LaTeX 源码...';
      }

      try {
        const currentPath = decodeURI(window.location.pathname);
        const typography = selectTypography?.value || 'scholarly';
        const sidenoteMode = selectSidenoteMode?.value || getStoredExportSettings().sidenoteMode || 'inline';
        const fontSize = selectFontSize?.value || '11';
        const paperSize = selectPaperSize?.value || 'a4';

        const texUrl = `/__chapter_export__/export?pathname=${encodeURIComponent(currentPath)}&format=tex&typography=${encodeURIComponent(typography)}&sidenoteMode=${encodeURIComponent(sidenoteMode)}&fontSize=${encodeURIComponent(fontSize)}&paperSize=${encodeURIComponent(paperSize)}`;

        const texResp = await fetch(texUrl);
        if (!texResp.ok) {
          throw new Error('获取本章 LaTeX 源码失败');
        }
        const latexSource = await texResp.text();

        const jobId = generateJobId();
        const safeChapterTitle = (chapterNameEl?.textContent || 'chapter').replace(/[^\w\u4e00-\u9fa5\-]/g, '_');
        const pdfFilename = `${safeChapterTitle}.pdf`;

        if (statusText) statusText.textContent = '正在调度 GitHub Actions 云端编译工作流...';

        await dispatchCompileWorkflow(
          jobId,
          latexSource,
          pdfFilename,
          storedCfg,
          (log) => {
            if (statusText) statusText.textContent = log;
          }
        );

        if (statusText) statusText.textContent = 'GitHub Actions 排队与编译中...';

        const pdfUrl = await pollCompileResult(
          jobId,
          pdfFilename,
          storedCfg,
          (state) => {
            if (statusText) {
              statusText.textContent = `[${state.progress}%] ${state.statusText} (${state.elapsedSeconds}s)`;
            }
          }
        );

        if (pdfUrl) {
          if (statusText) statusText.textContent = '云端编译完成，正在下载 PDF...';
          const a = document.createElement('a');
          a.href = pdfUrl;
          a.download = pdfFilename;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          setTimeout(() => {
            if (statusBox) statusBox.style.display = 'none';
          }, 4000);
        } else {
          throw new Error('云端编译超时或未生成 PDF');
        }
      } catch (err: any) {
        console.error('[chapter-export] 云端编译失败:', err);
        if (statusBox && statusText) {
          statusText.textContent = `云端编译失败: ${err.message || '未知错误'}`;
        }
      } finally {
        if (targetBtn) targetBtn.disabled = false;
      }
    }

    btnMainExport?.addEventListener('click', () => {
      const fmt = selectFormat?.value || 'print';
      if (fmt === 'print') {
        closeModal();
        window.print();
        return;
      }
      if (fmt === 'pdf-cloud') {
        triggerCloudPdf(btnMainExport);
      } else if (fmt === 'tex') {
        triggerDownload('tex', btnMainExport);
      } else if (fmt === 'zip') {
        triggerDownload('zip', btnMainExport);
      } else {
        triggerDownload('pdf', btnMainExport);
      }
    });

    btnTex?.addEventListener('click', () => triggerDownload('tex', btnMainExport));
    btnZip?.addEventListener('click', () => triggerDownload('zip', btnMainExport));
    btnPdf?.addEventListener('click', () => triggerDownload('pdf', btnMainExport));
    btnCloudPdf?.addEventListener('click', () => triggerCloudPdf(btnMainExport));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupChapterExport);
  } else {
    setupChapterExport();
  }
  document.addEventListener('astro:page-load', setupChapterExport);

  export function openChapterExportModal(): void {
    setupChapterExport();
    if (currentOpenModal) {
      currentOpenModal();
    } else {
      const modal = document.getElementById('chapter-export-modal') as any;
      if (modal && typeof modal.show === 'function') {
        modal.show();
      }
    }
  }
