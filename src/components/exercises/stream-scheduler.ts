export class StreamThrottleScheduler {
  private lastRenderTime = 0;
  private rafId: number | null = null;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private pending = false;
  private isDestroyed = false;
  private readonly intervalMs: number;
  private readonly renderFn: () => void;

  constructor(renderFn: () => void, intervalMs = 100) {
    this.renderFn = renderFn;
    this.intervalMs = intervalMs;
  }

  public schedule(): void {
    if (this.isDestroyed) return;
    this.pending = true;

    if (this.rafId !== null) return;

    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      if (!this.pending || this.isDestroyed) return;

      const now = Date.now();
      const elapsed = now - this.lastRenderTime;

      if (elapsed >= this.intervalMs) {
        this.flush(false);
      } else if (!this.timerId) {

        this.timerId = setTimeout(() => {
          this.timerId = null;
          if (!this.isDestroyed) {
            this.flush(false);
          }
        }, this.intervalMs - elapsed);
      }
    });
  }

  public flush(force = false): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (!this.pending && !force) return;
    if (this.isDestroyed && !force) return;

    this.pending = false;
    this.lastRenderTime = Date.now();

    try {
      this.renderFn();
    } catch (err) {
      console.error('[StreamThrottleScheduler] 渲染执行失败:', err);
    }
  }

  public stop(): void {
    this.isDestroyed = true;
    this.pending = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
