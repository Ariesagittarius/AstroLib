import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const LAG_PAGES = path.join(ROOT, 'test/data/lag_pages');
const OUT_DIR = path.join(ROOT, 'src/content/docs/collections/math/linear_algebra_geometry/images');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

export const FIGURES_MAP = {
  'fig_3_1.png': { page: 'phys_82.jpg', rect: { left: 195, top: 1180, width: 260, height: 105 } },
  'fig_3_2.png': { page: 'phys_83.jpg', rect: { left: 325, top: 785, width: 160, height: 160 } },
  'fig_3_3.png': { page: 'phys_83.jpg', rect: { left: 660, top: 785, width: 175, height: 160 } },

  'fig_3_4.png': { page: 'phys_84.jpg', rect: { left: 215, top: 260, width: 175, height: 135 } },
  'fig_3_5.png': { page: 'phys_84.jpg', rect: { left: 490, top: 260, width: 185, height: 135 } },
  'fig_3_6.png': { page: 'phys_84.jpg', rect: { left: 760, top: 260, width: 170, height: 135 } },

  'fig_3_7.png': { page: 'phys_85.jpg', rect: { left: 295, top: 615, width: 190, height: 145 } },
  'fig_3_8.png': { page: 'phys_85.jpg', rect: { left: 595, top: 615, width: 235, height: 145 } },
  'fig_3_9.png': { page: 'phys_85.jpg', rect: { left: 740, top: 1190, width: 220, height: 110 } },

  'fig_3_10.png': { page: 'phys_86.jpg', rect: { left: 195, top: 1080, width: 265, height: 215 } },

  'fig_3_11.png': { page: 'phys_87.jpg', rect: { left: 460, top: 1170, width: 225, height: 215 } },

  'fig_3_12.png': { page: 'phys_89.jpg', rect: { left: 735, top: 185, width: 235, height: 180 } },
  'fig_3_13.png': { page: 'phys_89.jpg', rect: { left: 720, top: 760, width: 250, height: 170 } },

  'fig_3_14.png': { page: 'phys_90.jpg', rect: { left: 190, top: 205, width: 230, height: 155 } },

  'fig_3_15.png': { page: 'phys_91.jpg', rect: { left: 450, top: 245, width: 220, height: 160 } },
  'fig_3_16.png': { page: 'phys_91.jpg', rect: { left: 240, top: 755, width: 230, height: 155 } },
  'fig_3_17.png': { page: 'phys_91.jpg', rect: { left: 630, top: 755, width: 245, height: 155 } },

  'fig_3_18.png': { page: 'phys_93.jpg', rect: { left: 685, top: 1040, width: 280, height: 180 } },

  'fig_3_19.png': { page: 'phys_95.jpg', rect: { left: 690, top: 670, width: 270, height: 195 } },

  'fig_3_20.png': { page: 'phys_97.jpg', rect: { left: 425, top: 1070, width: 285, height: 215 } },

  'fig_3_21.png': { page: 'phys_100.jpg', rect: { left: 190, top: 730, width: 260, height: 170 } },

  'fig_3_22.png': { page: 'phys_101.jpg', rect: { left: 635, top: 255, width: 330, height: 175 } },
  'fig_3_23.png': { page: 'phys_101.jpg', rect: { left: 695, top: 1130, width: 265, height: 195 } }
};

async function cropAll() {
  console.log('Starting Chapter 3 figure cropping...');
  for (const [filename, info] of Object.entries(FIGURES_MAP)) {
    const srcPath = path.join(LAG_PAGES, info.page);
    const destPath = path.join(OUT_DIR, filename);

    console.log(`Cropping ${filename} from ${info.page} with rect:`, info.rect);
    const meta = await sharp(srcPath).metadata();
    if (info.rect.left + info.rect.width > meta.width || info.rect.top + info.rect.height > meta.height) {
      console.error(`Area out of bounds for ${filename}! Meta: ${meta.width}x${meta.height}, rect:`, info.rect);
      continue;
    }

    await sharp(srcPath)
      .extract(info.rect)
      .toFile(destPath);

    const stat = fs.statSync(destPath);
    console.log(`  [OK] ${filename} cropped from ${info.page} (${stat.size} bytes)`);
  }
  console.log('All Chapter 3 figures cropped successfully!');
}

cropAll().catch(err => {
  console.error('Error cropping:', err);
  process.exit(1);
});
