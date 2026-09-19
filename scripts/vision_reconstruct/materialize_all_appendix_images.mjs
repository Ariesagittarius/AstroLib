import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const imagesDir = path.join(ROOT_DIR, 'src/content/docs/collections/math/engineering_analysis_rebuild/images');

const MAPPINGS = {

  'surface_1_z_xy.png': '2dfdc572f14a557e22bec1750c755f4b36b97c39c0bf9f44f584fad6ed050a3d.jpg',
  'surface_2_z_x2_y2.png': 'fd6b384d9fb7555116e20583eab8aeb14b313c073cf977181116b0d46ebcf2db.jpg',
  'surface_3_z_x2_y3.png': 'eff0e618935118b310f89e8f6d5c017f43a3aca8e0e3054b18afcba01ca5b81d.jpg',
  'surface_4_z_ln.png': '02cd4c108ec145bb7112283ea9d363ffbb5d3a7042b12e545fd3a7dd7d636f04.jpg',
  'surface_5_z_exp_cos.png': '65420c4182192db7a875880de25c677f1e85a5e2796dbefc73342a9cac5d7f5f.jpg',
  'surface_6_z_rational.png': 'a06c77d2320788ea72323b65d9575c8fd8e8b63163a4d0ca2bf180beeae421f1.jpg',
  'surface_7_z_cos_xy.png': 'db560b06e3f4c8e8c1b854e19dfd10efd7c652bb0fd0477b47a4888c00613854.jpg',
  'surface_8_f_sinc.png': '3ae3d68b9197e92e27c36bc88f05bec3c9a4a847037f9b027ddaa7636ad9be73.jpg',
  'solid_9_cylinders.png': 'aef5a32ba1b2f4e82e83af37caf92e5e49c54b304a51aeb03966e32759e37ccf.jpg',
  'solid_10_sphere_cone_planes.png': 'c2abcb7ad372c94252c56115ff7d7c0eabe4745678250f238519fa215c8c3127.jpg',
  'solid_11_sector.png': 'b80c0aefc229b76df324b93683e5f0feb1696829904fd3d48c379d0cbadb57dc.jpg',
  'solid_12_R_eq_2a.png': '2d931a4c44c79e3b5d158b41ffc19dfdb03def1b272667276df9d98855c96e82.jpg',
  'solid_13_R_gt_2a.png': '505ce2938e9acb751449d5e8941752f82820fbc2f555a74893ba826d92f362b2.jpg',
  'solid_14_sqrt2a_R_2a.png': 'e7d84ec6ce43d404c9679f92829870c4b3a89695fbaef9a4c6e8d4011eeb3ad4.jpg',
  'solid_15_R_le_sqrt2a.png': 'b34589a40cc5a47bfbea98209ef1b7750e0cbbfdd810201fa9e2be63a6689132.jpg',
  'solid_16_truncated_cone.png': '49398ea0626af92c4ed6d64ac8b16272cb207cacb0ef59d41bef3a9e7bb17f3c.jpg',
  'solid_17_cone_plane_bound.png': '2e92a864a8af887ab6d4a15a81db0be09bc55ed4e97ec774875b2415fe4908f1.jpg',

  'curve-18-folium.png': '28c211ff7c76de069e37311fe33be0fd45b21a9c91c3c7acf48e36f0afa670e4.jpg',
  'curve-19-parabola-general.png': '9b8112c9feb56a94757e2289d131049ecaeb98e61cc2ef086ffc09f55545f230.jpg',
  'curve-20-archimedean-spiral.png': 'b522b025d3df2ab01626184603e5f1cb89274ee87640cb9868450e0034475c0c.jpg',
  'curve-21-logarithmic-spiral.png': '14d519557a87cf1afd3b464df4e81e2be9c6c6e5141fa13b0c8360ecf6ad2acc.jpg',
  'curve-22-hyperbolic-spiral.png': 'fe2a3eedf1b306cde8ff468ea9f3d7d21b633de9ec58d5ae2d220b04f393228a.jpg',
  'curve-23-lemniscate-1.png': 'af57373974877a7528b0fdd3ed35f1c74a645be2afb2f95316576cf131b79a7f.jpg',
  'curve-24-lemniscate-2.png': '347f034e42da49ab74b2490799df3f43fd9e31008a0612d7faf59f7b20588019.jpg',
  'curve-25-rose-3-cos.png': '02d334189aaa7e5aaad779352b916396556b445b890ca2c02fe37fc2781df93e.jpg',
  'curve-26-rose-3-sin.png': '707f09e8e37179ed3fb5e319feacecb33551bd918390c039667fafb212ee677c.jpg',

  'complex_plane.png': '0f9f954e17dd926bc93a0c28e6bbe12160a9bc2a1b7ec15b93aefd6f3ef99093.jpg'
};

let materializedCount = 0;
for (const [targetName, srcHash] of Object.entries(MAPPINGS)) {
  const srcPath = path.join(imagesDir, srcHash);
  const dstPath = path.join(imagesDir, targetName);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, dstPath);
    materializedCount++;
    console.log(`  [OK] 实体化配图: ${srcHash} -> ${targetName}`);
  } else {
    console.warn(`  [WARN] 源切图不存在: ${srcHash}`);
  }
}

console.log(`\n🎉 实体化完成！共建立 ${materializedCount}/${Object.keys(MAPPINGS).length} 张语义高清配图。`);
