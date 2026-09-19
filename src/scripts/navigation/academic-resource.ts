/**
 * 全局数字资源弹层事件委托 (零生命周期依赖，无论初次加载还是 SPA 换页均即刻响应)
 */

declare global {
  interface Window {
    __academicResourceBound?: boolean;
  }
}

export function initAcademicResourcePopovers(): void {
  if (typeof window === 'undefined' || window.__academicResourceBound) return;
  window.__academicResourceBound = true;

  function closeAllResourcePopovers() {
    document.querySelectorAll('.js-resource-popover:not([hidden]), .js-qr-popover:not([hidden])').forEach((pop) => {
      pop.setAttribute('hidden', '');
      pop.classList.remove('is-open');
      const trigger = pop.closest('.academic-resource-trigger-wrapper, .qr-trigger-wrapper')?.querySelector('.js-resource-trigger, .js-qr-trigger');
      if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
        trigger.classList.remove('is-active');
      }
    });
  }

  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;

    // 1. 点击关闭按钮
    const closeBtn = target.closest('.js-resource-close, .js-qr-close');
    if (closeBtn) {
      e.stopPropagation();
      const popover = closeBtn.closest('.js-resource-popover, .js-qr-popover');
      if (popover) {
        popover.setAttribute('hidden', '');
        popover.classList.remove('is-open');
        const trigger = popover.closest('.academic-resource-trigger-wrapper, .qr-trigger-wrapper')?.querySelector('.js-resource-trigger, .js-qr-trigger');
        if (trigger) {
          trigger.setAttribute('aria-expanded', 'false');
          trigger.classList.remove('is-active');
        }
      }
      return;
    }

    // 2. 点击触发按钮
    const triggerBtn = target.closest('.js-resource-trigger, .js-qr-trigger');
    if (triggerBtn) {
      e.stopPropagation();
      const popoverId = triggerBtn.getAttribute('data-popover-id');
      if (!popoverId) return;
      const popover = document.getElementById(popoverId);
      if (!popover) return;

      const isCurrentlyOpen = !popover.hasAttribute('hidden') && popover.classList.contains('is-open');

      closeAllResourcePopovers();

      if (!isCurrentlyOpen) {
        popover.removeAttribute('hidden');
        requestAnimationFrame(() => {
          popover.classList.add('is-open');
        });
        triggerBtn.setAttribute('aria-expanded', 'true');
        triggerBtn.classList.add('is-active');
      }
      return;
    }

    // 3. 点击在 popover 内部：阻止冒泡关闭
    if (target.closest('.js-resource-popover, .js-qr-popover')) {
      return;
    }

    // 4. 点击其他任何区域：收起所有打开的 popover
    closeAllResourcePopovers();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllResourcePopovers();
    }
  });
}

if (typeof window !== 'undefined') {
  initAcademicResourcePopovers();
}
