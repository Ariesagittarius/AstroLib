import fs from 'node:fs';
import path from 'node:path';
import { visit } from 'unist-util-visit';
import sharp from 'sharp';

const blurCache = new Map();

async function getImageBlurData(imgPath) {
  try {
    const stat = await fs.promises.stat(imgPath);
    const cacheKey = `${imgPath}:${stat.mtimeMs}`;
    if (blurCache.has(cacheKey)) {
      return blurCache.get(cacheKey);
    }

    const image = sharp(imgPath);
    const meta = await image.metadata();
    if (!meta.width || !meta.height) {
      return null;
    }

    const targetWidth = Math.min(16, meta.width);
    const targetHeight = Math.max(1, Math.round(targetWidth * (meta.height / meta.width)));

    const placeholderBuf = await sharp(imgPath)
      .resize(targetWidth, targetHeight, { fit: 'inside' })
      .webp({ quality: 20 })
      .toBuffer();

    const placeholder = `data:image/webp;base64,${placeholderBuf.toString('base64')}`;
    const result = {
      width: meta.width,
      height: meta.height,
      placeholder,
    };

    blurCache.set(cacheKey, result);
    return result;
  } catch (err) {

    return null;
  }
}

function appendClass(existing, newClass) {
  if (!existing) return [newClass];
  if (Array.isArray(existing)) {
    return existing.includes(newClass) ? existing : [...existing, newClass];
  }
  if (typeof existing === 'string') {
    const list = existing.split(/\s+/).filter(Boolean);
    return list.includes(newClass) ? list : [...list, newClass];
  }
  return [newClass];
}

export function rehypeImageBlur() {
  return async (tree, file) => {
    const filePath = file?.history?.[0] || file?.path;
    const fileDir = filePath ? path.dirname(filePath) : process.cwd();

    const imgNodes = [];
    visit(tree, 'element', (node) => {
      if (node.tagName === 'img' && node.properties?.src) {
        imgNodes.push(node);
      }
    });

    if (imgNodes.length === 0) return;

    for (const node of imgNodes) {
      const rawSrc = String(node.properties.src || '').trim();

      if (!rawSrc || /^(https?:|\/\/|data:)/i.test(rawSrc)) {
        continue;
      }

      const imgAbsPath = path.resolve(fileDir, rawSrc);
      if (!fs.existsSync(imgAbsPath)) {
        continue;
      }

      const blurData = await getImageBlurData(imgAbsPath);
      if (!blurData) {
        continue;
      }

      const { width, height, placeholder } = blurData;

      if (!node.properties.width) node.properties.width = width;
      if (!node.properties.height) node.properties.height = height;

      if (!node.properties.loading) node.properties.loading = 'lazy';
      if (!node.properties.decoding) node.properties.decoding = 'async';

      const aspectStyle = `aspect-ratio: ${width} / ${height};`;
      const placeholderStyle = `--blur-placeholder: url("${placeholder}");`;
      const existingStyle = typeof node.properties.style === 'string' ? node.properties.style : '';
      node.properties.style = [aspectStyle, placeholderStyle, existingStyle].filter(Boolean).join(' ');

      node.properties.className = appendClass(node.properties.className, 'astro-blur-image');
      node.properties.dataBlurPlaceholder = 'true';
    }
  };
}

export default rehypeImageBlur;
