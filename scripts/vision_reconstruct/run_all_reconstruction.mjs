import { spawn } from 'node:child_process';

function runStep(cmd, args) {
  return new Promise((resolve, reject) => {
    console.log(`\n======================================================`);
    console.log(`🚀 [All Reconstruction Step] ${cmd} ${args.join(' ')}`);
    console.log(`======================================================\n`);

    const proc = spawn(cmd, args, { stdio: 'inherit', shell: true });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command ${cmd} ${args.join(' ')} exited with code ${code}`));
    });
    proc.on('error', reject);
  });
}

async function main() {
  const startTime = Date.now();
  console.log(`\n=============================================================`);
  console.log(`🌟 启动《工科数学分析》Gemini 3.5 Flash Lite 全流程一体化长程推倒重建`);
  console.log(`🌟 涵盖范围：第六章剩余 (6.7~6.8) + 第七章全量 (7.1~7.4) + 第一章全量 (1.1~1.5)`);
  console.log(`=============================================================\n`);

  try {
    // Step 1: Chapter 6 remaining sections (6.7 to 6.8)
    console.log(`\n>>> [Step 1/3] 开始处理第六章剩余章节 (6.7 ~ 6.8)...`);
    await runStep('node', ['scripts/vision_reconstruct/reconstruct_chapters_5_6.mjs', '--from-section', '6.7']);

    // Step 2: Chapter 7 full reconstruction (7.1 to 7.4)
    console.log(`\n>>> [Step 2/3] 开始处理第七章全量章节 (7.1 ~ 7.4)...`);
    await runStep('node', ['scripts/vision_reconstruct/reconstruct_chapter_7.mjs']);

    // Step 3: Chapter 1 full reconstruction (1.1 to 1.5)
    console.log(`\n>>> [Step 3/3] 开始处理第一章全量章节 (1.1 ~ 1.5)...`);
    await runStep('node', ['scripts/vision_reconstruct/reconstruct_chapter_1.mjs']);

    const totalMin = ((Date.now() - startTime) / 60000).toFixed(1);
    console.log(`\n🎉🎉🎉 [ALL SUCCESS] 第六章剩余、第七章与第一章全量视觉推倒重建与清洗全部完成！总耗时 ${totalMin} 分钟。\n`);
  } catch (err) {
    console.error(`\n❌ [RUN ALL ERROR] 流水线执行中断:`, err.message);
    process.exit(1);
  }
}

main();
