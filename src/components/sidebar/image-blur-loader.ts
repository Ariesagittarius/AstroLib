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

  if (img.complete && img.naturalWidth > 0) {
    markLoaded();
    return;
  }

  if (typeof img.decode === 'function') {
    img.decode().then(markLoaded).catch(() => {

    });
  }

  img.addEventListener('load', markLoaded, { once: true });
  img.addEventListener('error', markLoaded, { once: true });
}

export function initImageBlur() {
  const images = document.querySelectorAll<HTMLImageElement>('img.astro-blur-image');
  images.forEach(setupImage);
}
