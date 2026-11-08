import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

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

function createIco(pngEntries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngEntries.length, 4);

  let currentOffset = 6 + pngEntries.length * 16;
  const dirEntries = [];

  for (const entry of pngEntries) {
    const dir = Buffer.alloc(16);
    dir.writeUInt8(entry.width >= 256 ? 0 : entry.width, 0);
    dir.writeUInt8(entry.height >= 256 ? 0 : entry.height, 1);
    dir.writeUInt8(0, 2);
    dir.writeUInt8(0, 3);
    dir.writeUInt16LE(1, 4);
    dir.writeUInt16LE(32, 6);
    dir.writeUInt32LE(entry.buffer.length, 8);
    dir.writeUInt32LE(currentOffset, 12);
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

  const trimmedBuffer = await sharp(inputPath).trim().toBuffer();
  const trimmedMeta = await sharp(trimmedBuffer).metadata();
  console.log(`Trimmed content bounding box: ${trimmedMeta.width}x${trimmedMeta.height}`);

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

  const logoWebp = await sharp(logoBaseBuffer)
    .resize({ width: 512 })
    .webp({ quality: 92, effort: 6, alphaQuality: 100 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'astrolib-logo.webp'), logoWebp);
  console.log(`Created public/astrolib-logo.webp (${logoWebp.length} bytes)`);

  const logoPng = await sharp(logoBaseBuffer)
    .resize({ width: 512 })
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'astrolib-logo.png'), logoPng);
  fs.writeFileSync(path.join(publicDir, 'astrolib-logo-google.png'), logoPng);
  console.log(`Created public/astrolib-logo.png (${logoPng.length} bytes)`);

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

  const fav512Png = await sharp(favSquareMaster)
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), fav512Png);
  console.log(`Created public/favicon.png (${fav512Png.length} bytes)`);

  const fav512Webp = await sharp(favSquareMaster)
    .resize(512, 512)
    .webp({ quality: 92, effort: 6, alphaQuality: 100 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.webp'), fav512Webp);
  console.log(`Created public/favicon.webp (${fav512Webp.length} bytes)`);

  const appleTouchPng = await sharp(favSquareMaster)
    .resize(180, 180)
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchPng);
  console.log(`Created public/apple-touch-icon.png (${appleTouchPng.length} bytes)`);

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

  const fav48Png = await sharp(favSquareMaster)
    .resize(48, 48)
    .png({ compressionLevel: 9 })
    .toBuffer();

  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: fav16Png },
    { width: 32, height: 32, buffer: fav32Png },
    { width: 48, height: 48, buffer: fav48Png },
  ]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log(`Created public/favicon.ico (${icoBuffer.length} bytes, 3 sizes)`);

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
