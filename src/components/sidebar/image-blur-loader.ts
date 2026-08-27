/**
 * image-blur-loader：客户端高斯模糊渐显动效控制器
 *
 * 负责在页面初次载入与 SPA 路由切换（astro:page-load）时，
 * 智能监听正文中携带 .astro-blur-image 的图片加载状态：
 *   - 若图片已被浏览器缓存（img.complete 为 true 且具备 naturalWidth），立即点亮 .is-loaded，杜绝二次闪烁；
 *   - 若图片处于懒加载待载入中，监听 decode() / load / error 事件，在图像数据解码就绪后添加 .is-loaded 类触发平滑 CSS 渐显动效。
 */

function setupImage(img: HTMLImageElement) {
  if (img.dataset.loaded === 'true') {
    if (!img.classList.contains('is-loaded')) {
      img.classList.add('is-loaded');
    }
    return;
  }

  const markLoaded = () => {
    img.dataset.loaded = 'true';
    img.classList.add('is-loaded');
  };

  // 1. 命中本地缓存或已加载完成
  if (img.complete && img.naturalWidth > 0) {
    markLoaded();
    return;
  }

  // 2. 现代浏览器异步 decode() 提前感知
  if (typeof img.decode === 'function') {
    img.decode().then(markLoaded).catch(() => {
      // 若 decode 出错回退到常规 load 事件
    });
  }

  // 3. 常规加载事件监听
  img.addEventListener('load', markLoaded, { once: true });
  img.addEventListener('error', markLoaded, { once: true });
}

export function initImageBlur() {
  const images = document.querySelectorAll<HTMLImageElement>('img.astro-blur-image');
  images.forEach(setupImage);
}
