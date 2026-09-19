/**
 * src/scripts/settings/pwa-service.ts
 * PWA 独立桌面应用与全量离线资源包管理服务
 */

import { getOfflinePackStatus } from '../pwa-offline-manager';

let deferredInstallPrompt: any = null;

export function setDeferredInstallPrompt(prompt: any): void {
  deferredInstallPrompt = prompt;
}

/** 供外部或事件获取当前暂存的安装提示 */
export function getDeferredInstallPrompt(): any {
  return deferredInstallPrompt;
}

/** 同步当前所有实例的 PWA 独立应用卡片状态 */
export function syncAllPwaCard(): void {
  if (typeof document === 'undefined') return;
  const isStandalone = (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );

  document.querySelectorAll<HTMLElement>('.ft-pwa-card').forEach((card) => {
    const badge = card.querySelector<HTMLElement>('[data-pwa-badge]');
    const desc = card.querySelector<HTMLElement>('[data-pwa-desc]');
    const btn = card.querySelector<HTMLButtonElement>('[data-pwa-install-btn]');
    const btnText = btn?.querySelector<HTMLElement>('.ft-pwa-btn-text');

    if (isStandalone) {
      card.classList.add('is-installed');
      if (badge) {
        badge.textContent = '已运行';
        badge.classList.add('is-installed');
      }
      if (desc) {
        desc.textContent = '当前正在专用独立窗口中运行，享纯净沉浸学术阅读';
      }
      if (btn) {
        btn.disabled = true;
      }
      if (btnText) {
        btnText.textContent = '已安装';
      }
    } else if (deferredInstallPrompt) {
      card.classList.remove('is-installed');
      if (badge) {
        badge.textContent = '可安装';
        badge.classList.remove('is-installed');
      }
      if (desc) {
        desc.textContent = '安装到电脑/设备桌面，支持离线阅读与断网秒开';
      }
      if (btn) {
        btn.disabled = false;
      }
      if (btnText) {
        btnText.textContent = '安装应用';
      }
    } else {
      card.classList.remove('is-installed');
      if (badge) {
        badge.textContent = '应用模式';
        badge.classList.remove('is-installed');
      }
      if (desc) {
        desc.textContent = '支持添加到桌面或浏览器地址栏一键安装独立应用';
      }
      if (btn) {
        btn.disabled = false;
      }
      if (btnText) {
        btnText.textContent = '安装应用';
      }
    }
  });

  // 同步全量离线数据包状态
  getOfflinePackStatus().then((status) => {
    document.querySelectorAll<HTMLElement>('.ft-pwa-pack-box').forEach((box) => {
      const badge = box.querySelector<HTMLElement>('[data-pwa-pack-badge]');
      const desc = box.querySelector<HTMLElement>('[data-pwa-pack-desc]');
      const downloadBtn = box.querySelector<HTMLButtonElement>('[data-pwa-download-pack-btn]');
      const downloadBtnText = downloadBtn?.querySelector<HTMLElement>('.ft-pwa-pack-btn-text');
      const clearBtn = box.querySelector<HTMLButtonElement>('[data-pwa-clear-pack-btn]');

      if (status.hasPack && status.count > 0) {
        if (badge) {
          badge.textContent = `已离线 (${status.count} 篇)`;
          badge.classList.add('is-loaded');
        }
        if (desc) {
          desc.textContent = `已离线全站 ${status.count} 篇章节 (约占 ${status.approxSizeMb} MB)，断网秒开`;
        }
        if (downloadBtnText) {
          downloadBtnText.textContent = '重新同步';
        }
        if (clearBtn) {
          clearBtn.classList.remove('hidden');
        }
      } else {
        if (badge) {
          badge.textContent = '未下载';
          badge.classList.remove('is-loaded');
        }
        if (desc) {
          desc.textContent = '从 GitHub 一次性下载全站离线包，断网秒开，不消耗主站流量';
        }
        if (downloadBtnText) {
          downloadBtnText.textContent = '下载离线包';
        }
        if (clearBtn) {
          clearBtn.classList.add('hidden');
        }
      }
    });
  }).catch(() => {});
}
