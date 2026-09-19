/**
 * src/components/exercises/lazy-exercise-sidebar.ts
 * 课后习题右侧抽屉按需动态加载门面与全局事件委托
 *
 * 核心优化：
 * 1. 消除首屏对 exercise-sidebar-controller.ts（1500行代码 + KaTeX auto-render + AI通信）的静态导入
 * 2. 使用事件委托捕获习题 Chip 与触发器点击，按需加载并激活控制器
 * 3. 对历史激活会话通过 requestIdleCallback 闲时低优先级恢复，0ms 阻塞正文首屏
 */

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

  // 1. 鼠标悬停预热
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

  // 2. 全局点击事件委托
  document.addEventListener('click', (e) => {
    const target = e.target instanceof Element ? e.target : (e.target as Node | null)?.parentElement;
    if (!target) return;

    // 场景 A：点击习题卡片内部的题库 Chip
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

    // 场景 B：点击移动端导航或顶栏菜单中的 [data-exercise-trigger] 触发按钮
    const triggerBtn = target.closest<HTMLElement>('[data-exercise-trigger]');
    if (triggerBtn && !triggerBtn.closest('#exercise-modal-root')) {
      getLazyExerciseSidebarController().then((ctrl) => {
        ctrl.init();
      });
    }
  });

  // 3. 快捷键 Alt+E 监听
  window.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'e' || e.key === 'E')) {
      getLazyExerciseSidebarController().then((ctrl) => {
        ctrl.init();
      });
    }
  });
}

/**
 * 探测是否需要恢复上一章节已激活的题库会话（SessionStorage 驱动）
 * 严格放入 requestIdleCallback 闲时执行，绝不与首屏关键正文渲染争抢主线程
 */
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
