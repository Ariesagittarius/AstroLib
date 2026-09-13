import { streamGeminiVision } from './gemini_vision_client.mjs';

async function main() {
  const pages = [340, 344, 351, 352, 355, 357, 364];
  const imgPaths = pages.map(p => 'test/data/probe_pages/shangce_phys_' + p + '.jpg');
  const res = await streamGeminiVision(
    '请逐页说明这7页的大标题与内容概要（如是否为附录1、附录2、附录3、附录4、附录5、附录6、答案）：',
    imgPaths
  );
  console.log(res.text);
}

main().catch(console.error);
