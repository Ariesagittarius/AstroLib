/**
 * rehype-image-blur：正文图像构建期高斯模糊占位 (LQIP) 与平滑渐变加载插件
 *
 * 在 @mdx-js/mdx / rehype 处理管线中拦截所有 <img> 标签：
 *   1. 解析 MDX 中相对引用的本地图片（如 images/xxx.jpg）；
 *   2. 利用 sharp 读取图像真实宽高 (width/height)，注入 aspect-ratio 与尺寸属性，根治布局抖动 (CLS)；
 *   3. 生成极微型（~16px 宽）Base64 WebP 模糊缩略图，作为 CSS background-image 占位；
 *   4. 注入 loading="lazy"、decoding="async" 与 class="astro-blur-image"；
 *   5. 全局带文件修改时间 (mtime) 内存缓存，避免重复计算，极大提升 dev 与构建性能。
 */

import fs from 'node:fs';
import path from 'node:path';
import { visit } from 'unist-util-visit';
import sharp from 'sharp';

// 内存缓存：imgPath:mtime -> { width, height, placeholder }
const blurCache = new Map();

/**
 * 为本地图片生成微型 Base64 占位图及元数据
 * @param {string} imgPath 图片绝对路径
 * @returns {Promise<{ width: number, height: number, placeholder: string } | null>}
 */
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

    // 缩放至约 16px 宽微型图，WebP 格式质量 20（体积仅 ~100 字节）
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
    // 读取或生成失败时平稳降级，不阻断构建
    return null;
  }
}

/**
 * 统一类名处理
 */
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
      // 跳过远程 URL、Base64 或绝对 URL
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

      // 1. 设置原生尺寸防抖动 (CLS)
      if (!node.properties.width) node.properties.width = width;
      if (!node.properties.height) node.properties.height = height;

      // 2. 注入 lazy & async
      if (!node.properties.loading) node.properties.loading = 'lazy';
      if (!node.properties.decoding) node.properties.decoding = 'async';

      // 3. 添加样式与 CSS 变量
      const aspectStyle = `aspect-ratio: ${width} / ${height};`;
      const placeholderStyle = `--blur-placeholder: url("${placeholder}");`;
      const existingStyle = typeof node.properties.style === 'string' ? node.properties.style : '';
      node.properties.style = [aspectStyle, placeholderStyle, existingStyle].filter(Boolean).join(' ');

      // 4. 添加专属类名与属性标记
      node.properties.className = appendClass(node.properties.className, 'astro-blur-image');
      node.properties.dataBlurPlaceholder = 'true';
    }
  };
}

export default rehypeImageBlur;
