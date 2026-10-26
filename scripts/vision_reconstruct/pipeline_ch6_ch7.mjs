import { spawn } from 'node:child_process';

function runStep(cmd, args) {
  return new Promise((resolve, reject) => {
    console.log(`\n======================================================`);
    console.log(`🚀 [Pipeline Step] ${cmd} ${args.join(' ')}`);
    console.log(`======================================================\n`);

    const proc = spawn(cmd, args, { stdio: 'inherit', shell: true });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command exited with code ${code}`));
    });
    proc.on('error', reject);
  });
}

async function main() {
  const startTime = Date.now();
  console.log(`\n=============================================================`);
  console.log(`🌟 启动第六章（6.5-6.8）与第七章（7.1-7.4）一体化长程推倒重建流水线`);
  console.log(`=============================================================\n`);

  try {

    await runStep('node', ['scripts/vision_reconstruct/reconstruct_chapters_5_6.mjs', '--from-section', '6.5']);

    await runStep('node', ['scripts/vision_reconstruct/reconstruct_chapter_7.mjs']);

    await runStep('node', ['scripts/scan-mdx.mjs', 'src/content/docs/collections/math/engineering_analysis_rebuild']);

    const totalMin = ((Date.now() - startTime) / 60000).toFixed(1);
    console.log(`\n🎉🎉🎉 [PIPELINE SUCCESS] 第六章与第七章全量视觉推倒重建与清洗已全部完成！总耗时 ${totalMin} 分钟。\n`);
  } catch (err) {
    console.error(`\n❌ [PIPELINE ERROR] 流水线执行中断:`, err.message);
    process.exit(1);
  }
}

main();
