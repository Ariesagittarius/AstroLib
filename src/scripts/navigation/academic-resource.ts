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

    if (target.closest('.js-resource-popover, .js-qr-popover')) {
      return;
    }

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
