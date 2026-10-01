#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import jsQR from 'jsqr';

const targetDirArg = process.argv[2] || 'src/content/docs/collections/math/engineering_analysis';
const targetDir = path.resolve(process.cwd(), targetDirArg);

if (!fs.existsSync(targetDir)) {
  console.error(`[process-qrcodes] 目标目录不存在: ${targetDir}`);
  process.exit(1);
}

const imagesDir = path.join(targetDir, 'images');

async function decodeQRCode(imgPath) {
  try {
    const { data, info } = await sharp(imgPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const code = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    if (code && code.data) {
      return code.data.trim();
    }
  } catch (err) {

  }
  return null;
}

async function resolveUrlTitle(url) {
  if (!url) return '';
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(6000) });
    const u = new URL(res.url);
    const resName = u.searchParams.get('resName');
    if (resName) {
      return decodeURIComponent(resName).trim();
    }

    const text = await res.text();
    const m = text.match(/readingMaterialsHeaderTitle:\s*['"](.*?)['"]/);
    if (m && m[1]) {
      return m[1].trim();
    }
  } catch (e) {

  }
  return '';
}

async function main() {
  console.log(`== 1. 扫描与检测图片目录: ${imagesDir} ==`);
  const qrImageMap = new Map();

  if (fs.existsSync(imagesDir)) {
    const files = fs.readdirSync(imagesDir);
    let checkedCount = 0;

    for (const file of files) {
      if (/\.(png|jpe?g|webp)$/i.test(file)) {
        checkedCount++;
        const imgPath = path.join(imagesDir, file);
        const url = await decodeQRCode(imgPath);
        if (url) {
          qrImageMap.set(file, url);
        }
      }
    }
    console.log(`检查了 ${checkedCount} 张图片，成功检测并提取出 ${qrImageMap.size} 个二维码。`);
  }

  console.log(`\n== 2. 在线解析二维码资源标题与微课名称 ==`);
  const urlTitleMap = new Map();
  const uniqueUrls = Array.from(new Set(qrImageMap.values()));
  console.log(`共有 ${uniqueUrls.length} 个独立 URL 待解析...`);

  const batchSize = 15;
  for (let i = 0; i < uniqueUrls.length; i += batchSize) {
    const batch = uniqueUrls.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (u) => {
        const title = await resolveUrlTitle(u);
        if (title) {
          urlTitleMap.set(u, title);
        }
      })
    );
    process.stdout.write(`  已完成解析: ${Math.min(i + batchSize, uniqueUrls.length)} / ${uniqueUrls.length}\r`);
  }
  console.log(`\n成功解析到 ${urlTitleMap.size} 个微课资源标题。`);

  console.log(`\n== 3. 扫描与改写 MDX 文件 ==`);
  const mdxFiles = fs.readdirSync(targetDir).filter((f) => f.endsWith('.mdx'));
  let updatedMdxCount = 0;
  let totalReplacements = 0;
  const convertedImageFiles = new Set();

  for (const mdxFile of mdxFiles) {
    const filePath = path.join(targetDir, mdxFile);
    let content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/);
    const toRemoveIndices = new Set();
    const lineReplacements = new Map();
    let fileModified = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const [imgName, url] of qrImageMap.entries()) {
        const imgPattern = new RegExp(`!\\[.*?\\]\\(images\\/${imgName.replace(/\./g, '\\.')}\\)`);
        if (imgPattern.test(line)) {
          convertedImageFiles.add(imgName);
          fileModified = true;

          let title = urlTitleMap.get(url) || '';
          let id = '';

          const prevLine = i > 0 ? lines[i - 1].trim() : '';

          const nextLine1 = i + 1 < lines.length ? lines[i + 1].trim() : '';
          const nextLine2 = i + 2 < lines.length ? lines[i + 2].trim() : '';

          const qrMatchNext = nextLine1.match(/^二维码\s*(\d+(?:\.\d+)*)?\s*(.*)$/);
          const qrMatchPrev = prevLine.match(/^二维码\s*(\d+(?:\.\d+)*)?\s*(.*)$/);

          if (qrMatchNext) {
            id = qrMatchNext[1] || '';
            if (qrMatchNext[2]) title = qrMatchNext[2].trim();
            toRemoveIndices.add(i + 1);
          } else if (qrMatchPrev) {
            id = qrMatchPrev[1] || '';
            if (qrMatchPrev[2]) title = qrMatchPrev[2].trim();
            toRemoveIndices.add(i - 1);
          } else {

            if (
              nextLine1 &&
              !nextLine1.startsWith('#') &&
              !nextLine1.startsWith('!') &&
              !nextLine1.startsWith('$') &&
              !nextLine1.startsWith('<') &&
              !nextLine1.startsWith('式') &&
              !nextLine1.startsWith('图') &&
              !nextLine1.startsWith('表') &&
              !nextLine1.startsWith('---') &&
              nextLine1.length <= 40
            ) {

              const cleanedNext1 = nextLine1.replace(/[\s\-_—·:：,，.。()（）[\]【】？?]/g, '');
              const cleanedOnline = title.replace(/[\s\-_—·:：,，.。()（）[\]【】？?]/g, '');

              if (!title) {
                title = nextLine1;
                toRemoveIndices.add(i + 1);

                if (
                  nextLine2 &&
                  !nextLine2.startsWith('#') &&
                  !nextLine2.startsWith('!') &&
                  !nextLine2.startsWith('$') &&
                  !nextLine2.startsWith('<') &&
                  !nextLine2.startsWith('---') &&
                  nextLine2.length <= 20 &&
                  !/[。；!！?？]$/.test(title)
                ) {
                  title += nextLine2;
                  toRemoveIndices.add(i + 2);
                }
              } else if (
                cleanedNext1 &&
                (cleanedOnline.includes(cleanedNext1) || cleanedNext1.includes(cleanedOnline) || nextLine1 === title)
              ) {

                toRemoveIndices.add(i + 1);

                if (nextLine2 && cleanedOnline.includes(cleanedNext1 + nextLine2.replace(/[\s\-_—·:：,，.。()（）[\]【】？?]/g, ''))) {
                  toRemoveIndices.add(i + 2);
                }
              }
            }
          }

          title = (title || '').replace(/^二维码\s*\d+(\.\d+)*\s*/, '').replace(/[\.\。\s]+$/, '').trim();
          const propId = id ? ` id="${id}"` : '';
          const propTitle = title ? ` title="${title.replace(/"/g, '&quot;')}"` : '';

          const componentTag = `<QRCodeVideo${propId}${propTitle} url="${url}" />`;
          lineReplacements.set(i, line.replace(imgPattern, componentTag));
          totalReplacements++;
          break;
        }
      }
    }

    if (fileModified) {
      const newLines = [];
      for (let i = 0; i < lines.length; i++) {
        if (toRemoveIndices.has(i)) {
          continue;
        }
        if (lineReplacements.has(i)) {
          newLines.push(lineReplacements.get(i));
        } else {
          newLines.push(lines[i]);
        }
      }

      let finalContent = newLines.join('\n');

      if (!finalContent.includes("import QRCodeVideo from '@/components/QRCodeVideo.astro'")) {
        const fmEndIndex = finalContent.indexOf('---', 3);
        if (fmEndIndex !== -1) {
          const insertPos = fmEndIndex + 3;
          finalContent =
            finalContent.slice(0, insertPos) +
            "\nimport QRCodeVideo from '@/components/QRCodeVideo.astro';" +
            finalContent.slice(insertPos);
        } else {
          finalContent = "import QRCodeVideo from '@/components/QRCodeVideo.astro';\n\n" + finalContent;
        }
      }

      fs.writeFileSync(filePath, finalContent, 'utf-8');
      updatedMdxCount++;
      console.log(`  [Updated MDX] ${mdxFile}`);
    }
  }

  console.log(`\n== 4. 清理已被替换的纯二维码图片 ==`);
  let deletedImgCount = 0;
  for (const imgName of convertedImageFiles) {
    const imgPath = path.join(imagesDir, imgName);
    if (fs.existsSync(imgPath)) {
      fs.unlinkSync(imgPath);
      deletedImgCount++;
    }
  }

  console.log(`\n== 处理完成 ==`);
  console.log(`· 替换卡片数量: ${totalReplacements} 个`);
  console.log(`· 更新 MDX 文件: ${updatedMdxCount} 个`);
  console.log(`· 清理纯二维码图片: ${deletedImgCount} 张`);
}

main().catch((err) => {
  console.error('[process-qrcodes] 执行报错:', err);
  process.exit(1);
});
