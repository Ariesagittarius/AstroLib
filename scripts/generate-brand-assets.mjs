import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Find input image
const possibleInputs = [
  path.join(projectRoot, '.tmp', 'ChatGPT Image 2026年9月15日 20_36_13.png'),
  'D:/Antigravity/project/AstroLib/.tmp/ChatGPT Image 2026年9月15日 20_36_13.png',
];

let inputPath = possibleInputs.find(p => fs.existsSync(p));
if (!inputPath) {
  const tmpDir = path.join(projectRoot, '.tmp');
  if (fs.existsSync(tmpDir)) {
    const files = fs.readdirSync(tmpDir).filter(f => f.endsWith('.png'));
    if (files.length > 0) {
      inputPath = path.join(tmpDir, files[0]);
    }
  }
}

if (!inputPath || !fs.existsSync(inputPath)) {
  console.error('Error: Source image not found at', possibleInputs);
  process.exit(1);
}

console.log('Using source image:', inputPath);

/**
 * Builds a multi-resolution ICO file buffer containing standard PNG images.
 * @param {Array<{ width: number, height: number, buffer: Buffer }>} pngEntries
 */
function createIco(pngEntries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(pngEntries.length, 4); // Number of images

  let currentOffset = 6 + pngEntries.length * 16;
  const dirEntries = [];

  for (const entry of pngEntries) {
    const dir = Buffer.alloc(16);
    dir.writeUInt8(entry.width >= 256 ? 0 : entry.width, 0);
    dir.writeUInt8(entry.height >= 256 ? 0 : entry.height, 1);
    dir.writeUInt8(0, 2); // Palette
    dir.writeUInt8(0, 3); // Reserved
    dir.writeUInt16LE(1, 4); // Planes
    dir.writeUInt16LE(32, 6); // Bits per pixel
    dir.writeUInt32LE(entry.buffer.length, 8); // Image size in bytes
    dir.writeUInt32LE(currentOffset, 12); // Image offset
    dirEntries.push(dir);
    currentOffset += entry.buffer.length;
  }

  return Buffer.concat([
    header,
    ...dirEntries,
    ...pngEntries.map(e => e.buffer),
  ]);
}

async function run() {
  const publicDir = path.join(projectRoot, 'public');

  // 1. Trim transparency to exact content boundaries
  const trimmedBuffer = await sharp(inputPath).trim().toBuffer();
  const trimmedMeta = await sharp(trimmedBuffer).metadata();
  console.log(`Trimmed content bounding box: ${trimmedMeta.width}x${trimmedMeta.height}`);

  // 2. Generate Header Logo (Horizontal rectangular ratio ~1.29:1 with 2% margin)
  const logoPaddingX = Math.round(trimmedMeta.width * 0.02);
  const logoPaddingY = Math.round(trimmedMeta.height * 0.02);
  const logoCanvasW = trimmedMeta.width + logoPaddingX * 2;
  const logoCanvasH = trimmedMeta.height + logoPaddingY * 2;

  const logoBaseBuffer = await sharp({
    create: {
      width: logoCanvasW,
      height: logoCanvasH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: trimmedBuffer,
        left: logoPaddingX,
        top: logoPaddingY,
      },
    ])
    .png()
    .toBuffer();

  // 2.1 astrolib-logo.webp (High-res 512px retina)
  const logoWebp = await sharp(logoBaseBuffer)
    .resize({ width: 512 })
    .webp({ quality: 92, effort: 6, alphaQuality: 100 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'astrolib-logo.webp'), logoWebp);
  console.log(`Created public/astrolib-logo.webp (${logoWebp.length} bytes)`);

  // 2.2 astrolib-logo.png (High-res 512px fallback)
  const logoPng = await sharp(logoBaseBuffer)
    .resize({ width: 512 })
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'astrolib-logo.png'), logoPng);
  fs.writeFileSync(path.join(publicDir, 'astrolib-logo-google.png'), logoPng);
  console.log(`Created public/astrolib-logo.png (${logoPng.length} bytes)`);

  // 3. Generate Favicon Master (1:1 square canvas with ~4% breathing margin)
  const favPadding = Math.round(trimmedMeta.width * 0.04);
  const squareSize = trimmedMeta.width + favPadding * 2;
  const favLeft = favPadding;
  const favTop = Math.round((squareSize - trimmedMeta.height) / 2);

  const favSquareMaster = await sharp({
    create: {
      width: squareSize,
      height: squareSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: trimmedBuffer,
        left: favLeft,
        top: favTop,
      },
    ])
    .png()
    .toBuffer();

  // 3.1 favicon.png (512x512)
  const fav512Png = await sharp(favSquareMaster)
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), fav512Png);
  console.log(`Created public/favicon.png (${fav512Png.length} bytes)`);

  // 3.2 favicon.webp (512x512)
  const fav512Webp = await sharp(favSquareMaster)
    .resize(512, 512)
    .webp({ quality: 92, effort: 6, alphaQuality: 100 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.webp'), fav512Webp);
  console.log(`Created public/favicon.webp (${fav512Webp.length} bytes)`);

  // 3.3 apple-touch-icon.png (180x180)
  const appleTouchPng = await sharp(favSquareMaster)
    .resize(180, 180)
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchPng);
  console.log(`Created public/apple-touch-icon.png (${appleTouchPng.length} bytes)`);

  // 3.4 favicon-32x32.png & webp
  const fav32Png = await sharp(favSquareMaster)
    .resize(32, 32)
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), fav32Png);

  const fav32Webp = await sharp(favSquareMaster)
    .resize(32, 32)
    .webp({ quality: 95, effort: 6, alphaQuality: 100 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.webp'), fav32Webp);
  console.log(`Created public/favicon-32x32.png and .webp`);

  // 3.5 favicon-16x16.png & webp
  const fav16Png = await sharp(favSquareMaster)
    .resize(16, 16)
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), fav16Png);

  const fav16Webp = await sharp(favSquareMaster)
    .resize(16, 16)
    .webp({ quality: 95, effort: 6, alphaQuality: 100 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.webp'), fav16Webp);
  console.log(`Created public/favicon-16x16.png and .webp`);

  // 3.6 favicon-48x48.png for ICO multi-resolution
  const fav48Png = await sharp(favSquareMaster)
    .resize(48, 48)
    .png({ compressionLevel: 9 })
    .toBuffer();

  // 3.7 favicon.ico (Multi-size: 16x16, 32x32, 48x48)
  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: fav16Png },
    { width: 32, height: 32, buffer: fav32Png },
    { width: 48, height: 48, buffer: fav48Png },
  ]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log(`Created public/favicon.ico (${icoBuffer.length} bytes, 3 sizes)`);

  // 3.8 favicon.svg (Vector container embedding crisp base64 PNG data)
  const fav64Png = await sharp(favSquareMaster)
    .resize(64, 64)
    .png({ compressionLevel: 9 })
    .toBuffer();
  const base64Data = fav64Png.toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <image width="32" height="32" href="data:image/png;base64,${base64Data}" />
</svg>
`;
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf-8');
  console.log(`Created public/favicon.svg (${svgContent.length} bytes)`);

  console.log('\nAll brand assets successfully generated!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
