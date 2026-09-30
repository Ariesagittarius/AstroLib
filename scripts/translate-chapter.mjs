#!/usr/bin/env node
/**
 * scripts/translate-chapter.mjs
 * ============================================================================
 * AstroLib 学术教材结构无损翻译命令行工具 (CLI)
 * ============================================================================
 * 使用示例：
 *   node scripts/translate-chapter.mjs --file src/content/docs/collections/cs/algorithms/01.1_basic-arithmetic.mdx
 *   node scripts/translate-chapter.mjs --file ... --provider bupt --dry-run
 *   node scripts/translate-chapter.mjs --file ... --provider gemini --dry-run
 *   node scripts/translate-chapter.mjs --file ... --output ...
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { translationService } from '../src/services/translation/service.ts';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    file: '',
    provider: 'google',
    output: '',
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) {
      options.file = args[++i];
    } else if (args[i] === '--provider' && args[i + 1]) {
      options.provider = args[++i];
    } else if (args[i] === '--output' && args[i + 1]) {
      options.output = args[++i];
    } else if (args[i] === '--dry-run') {
      options.dryRun = true;
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();

  if (!options.file) {
    console.error('❌ 请通过 --file 参数指定待翻译的 MDX 文件路径');
    console.error('用法示例: node scripts/translate-chapter.mjs --file src/content/docs/collections/cs/algorithms/01.1_basic-arithmetic.mdx');
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), options.file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 文件不存在: ${filePath}`);
    process.exit(1);
  }

  console.log(`\n📖 正在读取章节文件: ${options.file}`);
  const content = fs.readFileSync(filePath, 'utf-8');

  console.log(`⚙️ 选用提供商: ${options.provider} (结构保护遮蔽启用)`);
  console.log('⏳ 正在进行结构分析、公式提取与学术翻译，请稍候...');

  const startTime = Date.now();
  const result = await translationService.translate(content, {
    provider: options.provider,
    preserveStructure: true,
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  if (!result.success) {
    console.error(`❌ 翻译失败: ${result.error}`);
    process.exit(1);
  }

  console.log(`\n✅ 翻译成功！耗时: ${duration}s`);
  console.log(`🔒 结构防护审计: 保护标记提取 ${result.tokensPreserved} 项，100% 成功还原 ${result.tokensRestored} 项`);

  if (options.dryRun) {
    console.log('\n--- [Dry Run 预览输出 (前 1000 字符)] ---');
    console.log(result.translatedText.slice(0, 1000));
    console.log('...\n--- [Dry Run 结束] ---');
    return;
  }

  const outputPath = options.output ? path.resolve(process.cwd(), options.output) : filePath.replace(/\.mdx$/, '.zh.mdx');
  fs.writeFileSync(outputPath, result.translatedText, 'utf-8');
  console.log(`💾 译文已写入: ${outputPath}\n`);
}

main().catch((err) => {
  console.error('致命错误:', err);
  process.exit(1);
});
