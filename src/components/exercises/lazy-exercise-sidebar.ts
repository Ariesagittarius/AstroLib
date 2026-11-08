let controllerPromise: Promise<any> | null = null;
let isDelegationBound = false;

export async function getLazyExerciseSidebarController(): Promise<any> {
  if (!controllerPromise) {
    controllerPromise = import('./exercise-sidebar-controller').then((m) => m.getExerciseSidebarController());
  }
  return controllerPromise;
}

export function initExerciseSidebarTriggerDelegation(): void {
  if (isDelegationBound) return;
  isDelegationBound = true;

  document.addEventListener(
    'pointerenter',
    (e) => {
      if (controllerPromise) return;
      const target = e.target instanceof Element ? e.target : (e.target as Node | null)?.parentElement;
      if (target?.closest?.('.ex-bank-chip, [data-exercise-trigger], [data-exercise-trigger-card]')) {
        import('./exercise-sidebar-controller');
      }
    },
    { capture: true, passive: true }
  );

  document.addEventListener('click', (e) => {
    const target = e.target instanceof Element ? e.target : (e.target as Node | null)?.parentElement;
    if (!target) return;

    const bankChip = target.closest<HTMLElement>('.ex-bank-chip');
    if (bankChip) {
      const card = bankChip.closest<HTMLElement>('[data-exercise-trigger-card]');
      const chapter = parseInt(card?.getAttribute('data-chapter') || bankChip.getAttribute('data-chapter') || '1', 10);
      const section = card?.getAttribute('data-section') || bankChip.getAttribute('data-section') || 'all';
      const book = card?.getAttribute('data-book') || bankChip.getAttribute('data-book') || 'engineering_analysis';
      const bankId = bankChip.getAttribute('data-bank-id') || '';

      getLazyExerciseSidebarController().then((ctrl) => {
        ctrl.init();
        ctrl.handleChipClick(bankChip, bankId, chapter, section, book);
      });
      return;
    }

    const triggerBtn = target.closest<HTMLElement>('[data-exercise-trigger]');
    if (triggerBtn && !triggerBtn.closest('#exercise-modal-root')) {
      getLazyExerciseSidebarController().then((ctrl) => {
        ctrl.init();
      });
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'e' || e.key === 'E')) {
      getLazyExerciseSidebarController().then((ctrl) => {
        ctrl.init();
      });
    }
  });
}

export function probeActiveExerciseSession(): void {
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('astrolib_active_exercise_bank')) {
      const idle = (typeof window !== 'undefined' && window.requestIdleCallback) || ((fn: Function) => setTimeout(fn, 150));
      idle(() => {
        getLazyExerciseSidebarController().then((ctrl) => {
          ctrl.init();
        });
      }, { timeout: 400 });
    }
  } catch {}
}
