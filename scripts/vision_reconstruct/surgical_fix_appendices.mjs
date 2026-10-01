import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const rebuildDir = path.join(ROOT_DIR, 'src/content/docs/collections/math/engineering_analysis_rebuild');
const imagesDir = path.join(rebuildDir, 'images');

const A1_MAPPINGS = {
  'figure_1_1.png': 'ad5bd10a13b697f47f4ae0b06400bea1bcca586ee0167c20f0b6786c6e337b21.jpg',
  'figure_1_2.png': '3c5444046a314b7a1aa7860a6c95e1a211b7c23563f73ddf3e7cff5376ee707b.jpg',
  'figure_1_3.png': 'f26323b1071a52b9615590fe9c26783aaf44f0d756b119e8fdb478c6b62044e8.jpg',
  'figure_1_4.png': 'ee24403b46704664ba3e96ebd53e105635aabb821f304dd8e81781b3bf3bbd80.jpg',
  'figure_1_5.png': 'cc3bef128a25b92d6628aaf01c322e56725d09540eda9a1b3ec076ef8ff73756.jpg',

  'curve-1-power.png': '12c8f0d7a80237fe01d29dff1f5ad9406c06a15c5b764e43ecb8967fd9293551.jpg',
  'curve-2-exponential.png': '6f08d4a82165bd420b6fbec1d0e41e50e2ab7041bc6a868717d5353745b63790.jpg',
  'curve-3-logarithmic.png': 'c8ce938804dbf7a9d52f068ac789eafcccbbe76ef6472b6f80449eaceb60dd06.jpg',
  'curve-4-sin.png': 'd184adf14d7fe57338f5cbce4fe75f6f9515e12069c74a46058d9265fa840181.jpg',
  'curve-5-cos.png': '26e8cad787ecfe78c9f56d25f887db1e2654200b8b3ad6dc260f3c512ff83e4f.jpg',
  'curve-6-tan.png': 'dc7ffa9ebe8cfca87ed501f23ad06608742fdddc9a05a39abf8deda109905c09.jpg',
  'curve-7-cot.png': '7512dd98ecc496bf4894318d29b240d294e88d05fed195131137607b9f72be08.jpg',
  'curve-8-sec.png': 'e170a540a3b2a0ad1bab6d25e0d1de5b2ba01459a63f35454ec785fe188e4b00.jpg',
  'curve-9-csc.png': '1d480e6c3b3a7adba094cef0942495a18008d166f11462784841d8af32d804f7.jpg',
  'curve-10-semicubic-parabola.png': '4b8d53106093b4a5646af1f9ccf38d0799327946c46eca3d832063033917ece3.jpg',
  'curve-11-witch-of-agnesi.png': 'c57192d881498c20bf17e6c86863943f312c14a965612de255beb9a15ed4d326.jpg',
  'curve-12-probability.png': 'add71dab0d9773ac48c86f610dde8cca7c928a1615046319afa19b6c36e1fe1e.jpg',
  'curve-13-catenary.png': 'f3065b43a214f8ed1df304dc1ffe3d71c774b68ab6f0453ec5f4607acebc6b2b.jpg',
  'curve-14-cycloid.png': '533ad377b1093784f4a8c31b979c6267efa90d17c9c32be1c0cd7058b8e4a86d.jpg',
  'curve-15-cissoid.png': '9e592b0a04f0596dd969b0063f0956f3d2ec507b8042278c0fa985f86e7e5719.jpg',
  'curve-16-astroid.png': '69ea7f64424ba84f91f36d6f8ac69f30f1e031271463937c5c9109396eb7ac81.jpg',
  'curve-17-cardioid.png': '967abf69044125bbe2dd8ed3b1f95d18b952233159212e5ab0b117d13933282f.jpg'
};

for (const [targetName, srcHash] of Object.entries(A1_MAPPINGS)) {
  const src = path.join(imagesDir, srcHash);
  const dst = path.join(imagesDir, targetName);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    console.log(`[A1 Image OK] ${targetName}`);
  } else {
    console.warn(`[A1 Image Missing] ${srcHash}`);
  }
}

const a1File = path.join(rebuildDir, 'a1_附录1-2_参数表示极坐标与常见曲线.mdx');
let a1Content = fs.readFileSync(a1File, 'utf-8');
a1Content = a1Content.replace(/\\overparen/g, '\\wideparen');
fs.writeFileSync(a1File, a1Content, 'utf-8');
console.log('[A1 Fix OK] 修复 \\overparen -> \\wideparen');

const a2File = path.join(rebuildDir, 'a2_附录3-4_三角函数公式与反三角函数.mdx');
let a2Content = fs.readFileSync(a2File, 'utf-8');

a2Content = a2Content.replace(/\\begin\{(aligned|cases)\}([\s\S]*?)\\end\{\1\}/g, (match, env, body) => {
  const fixedBody = body.replace(/\\tag\{([^{}]+)\}/g, '& ($1)');
  return `\\begin{${env}}${fixedBody}\\end{${env}}`;
});

a2Content = a2Content.replace(/\$\$([\s\S]*?)\$\$/g, (match, body) => {
  const tags = [...body.matchAll(/\\tag\{([^{}]+)\}/g)];
  if (tags.length > 1) {

    let count = 0;
    return '$$\n' + body.replace(/\\tag\{([^{}]+)\}/g, (m, tagVal) => {
      count++;
      return count === 1 ? `\\tag{${tagVal}}` : `\\quad (${tagVal})`;
    }) + '\n$$';
  }
  return match;
});

fs.writeFileSync(a2File, a2Content, 'utf-8');
console.log('[A2 Fix OK] 修复 a2 中 aligned 内部多重 \\tag 问题');

console.log('\n🎉 外科手术修复完成！');
