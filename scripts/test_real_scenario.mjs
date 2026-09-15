import fs from 'node:fs';

const routes = [
  '/collections/math/engineering_analysis/11_集合映射与函数/',
  '/collections/math/engineering_analysis/12_数列的极限/',
  '/collections/math/engineering_analysis/13_函数的极限/',
  '/collections/math/engineering_analysis/14_无穷小量与无穷大量/',
  '/collections/math/engineering_analysis/15_连续函数/',
  '/collections/math/engineering_analysis/61_多元数量值函数积分的概念与性质/',
  '/collections/math/engineering_analysis/62_二重积分的计算/',
  '/collections/math/engineering_analysis/63_三重积分的计算/',
  '/collections/math/engineering_analysis/64_含参变量的积分与反常重积分/',
  '/collections/math/engineering_analysis/65_重积分的应用/',
  '/collections/math/engineering_analysis/66_第一型线积分与面积分/',
  '/collections/math/engineering_analysis/67_第二型线积分与面积分/',
  '/collections/math/engineering_analysis/68_各种积分的联系及其在场论中的应用/',
  '/collections/math/engineering_analysis/71_常数项级数/',
  '/collections/math/engineering_analysis/72_函数项级数/',
  '/collections/math/engineering_analysis/73_幂级数/',
  '/collections/math/engineering_analysis/74_fourier级数/'
];

async function main() {
  console.log('\n======================================================');
  console.log('🌐 开始【真实情景实测】：第 5、6 章路由与渲染巡检');
  console.log('======================================================\n');

  let passedCount = 0;
  for (const r of routes) {
    const url = 'http://localhost:4321' + encodeURI(r);
    try {
      const res = await fetch(url);
      const html = await res.text();
      const hasKatexError = html.includes('katex-error');
      const hasTrigger = html.includes('exercise-trigger') || html.includes('ExerciseTrigger') || html.includes('课后真题与自测练习');
      const is200 = res.status === 200;

      const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
      let match;
      const images = [];
      while ((match = imgRegex.exec(html)) !== null) {
        images.push(match[1]);
      }

      if (is200 && !hasKatexError) {
        passedCount++;
        console.log(`✅ [HTTP 200] ${decodeURI(r)}`);
        console.log(`   - KaTeX 红字: 0 处`);
        console.log(`   - 习题触发器: ${hasTrigger ? '已就绪' : '未挂载'}`);
        console.log(`   - 检测到图片元素: ${images.length} 处`);

        let imgFails = 0;
        for (const img of images) {
          const imgUrl = img.startsWith('http') ? img : 'http://localhost:4321' + img;
          const imgRes = await fetch(imgUrl);
          if (imgRes.status !== 200) {
            console.error(`     ❌ [IMG 404] ${imgUrl}`);
            imgFails++;
          }
        }
        if (imgFails === 0) {
          console.log(`   - 图片资源请求: 全部 HTTP 200 OK (0 处碎图)`);
        }
      } else {
        console.error(`❌ [HTTP ${res.status}] ${decodeURI(r)}`);
        if (hasKatexError) console.error(`   - 发现 KaTeX 渲染红字异常!`);
      }
    } catch (err) {
      console.error(`❌ [Connection Error] ${r}:`, err.message);
    }
  }

  console.log(`\n======================================================`);
  console.log(`📊 巡检结果：${passedCount} / ${routes.length} 章节通过端到端实测！`);
  console.log('======================================================\n');
}

main();
