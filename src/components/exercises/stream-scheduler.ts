/**
 * src/components/exercises/stream-scheduler.ts
 *
 * 流式渲染节流与批处理调度器 (Stream Throttle Scheduler)
 *
 * 核心目标：
 * 1. 应对超长推理模型（如 DeepSeek-R1 CoT）数万字、上万个 SSE chunk 的高频冲击；
 * 2. 内存高速追加数据（O(1) 字符串拼接），主线程不再在每个小 chunk 上阻塞执行耗时的 DOM 重建与 KaTeX 编译；
 * 3. 结合 requestAnimationFrame 与时间窗口切片（默认 100ms），保障帧率稳定且让出 CPU 供 V8 垃圾回收（杜绝 OOM）；
 * 4. 提供 flush(force) 方法在流结束或中断时确保最终内容 100% 完整无遗漏呈现。
 */

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

  /**
   * 触发一次调度请求（在接收到 SSE chunk 时高速调用）
   */
  public schedule(): void {
    if (this.isDestroyed) return;
    this.pending = true;

    // 若已有动画帧等待中，无须重复挂载
    if (this.rafId !== null) return;

    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      if (!this.pending || this.isDestroyed) return;

      const now = Date.now();
      const elapsed = now - this.lastRenderTime;

      if (elapsed >= this.intervalMs) {
        this.flush(false);
      } else if (!this.timerId) {
        // 在剩余时间窗口结束时安排下一次触发
        this.timerId = setTimeout(() => {
          this.timerId = null;
          if (!this.isDestroyed) {
            this.flush(false);
          }
        }, this.intervalMs - elapsed);
      }
    });
  }

  /**
   * 立即刷新并执行渲染
   * @param force 若为 true，无论是否有 pending 标记均执行一次渲染（用于流结束时对齐最终状态）
   */
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

  /**
   * 停止并清理所有定时器与动画帧回调
   */
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
