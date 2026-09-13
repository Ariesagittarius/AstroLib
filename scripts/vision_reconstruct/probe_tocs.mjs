import { streamGeminiVision } from './gemini_vision_client.mjs';

async function main() {
  console.log('--- 查看上册目录第 17 页 (附录目录) ---');
  const res1 = await streamGeminiVision(
    '请完整转录图片中“附录”及其下所有条目的标题、页码，以及后面的所有内容：',
    ['test/data/probe_pages/shangce_phys_17.jpg']
  );
  console.log(res1.text);

  console.log('\n--- 查看下册目录 (查找下册是否有附录) ---');
  // 下册目录一般在 xiace_phys_10 ~ 14 左右，我们检查 xiace_phys_13 和 14
  const res2 = await streamGeminiVision(
    '请完整转录图片中的下册章节目录条目（尤其是第7章之后的附录、习题答案等条目）：',
    ['test/data/probe_pages/xiace_phys_13.jpg', 'test/data/probe_pages/xiace_phys_14.jpg']
  );
  console.log(res2.text);
}

main().catch(console.error);
