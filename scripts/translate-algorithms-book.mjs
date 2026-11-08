#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { translationService } from '../src/services/translation/service.ts';

export const CHINESE_TITLES = {
  '00_preface.mdx': '前言',
  '00.1_books-and-algorithms.mdx': '0.1 书籍与算法',
  '00.2_enter-fibonacci.mdx': '0.2 走近斐波那契',
  '00.3_big-o-notation.mdx': '0.3 大O渐近表示法',
  '00.4_exercises.mdx': '第0章 习题',

  '01.1_basic-arithmetic.mdx': '1.1 基础算术',
  '01.2_modular-arithmetic.mdx': '1.2 模算术',
  '01.3_primality-testing.mdx': '1.3 素性测试',
  '01.4_cryptography.mdx': '1.4 密码学与RSA',
  '01.5_universal-hashing.mdx': '1.5 全域哈希',
  '01.6_exercises.mdx': '第1章 习题',

  '02.1_multiplication.mdx': '2.1 整数乘法算法',
  '02.2_recurrence-relations.mdx': '2.2 递推关系与主定理',
  '02.3_mergesort.mdx': '2.3 归并排序',
  '02.4_medians.mdx': '2.4 中位数与选择算法',
  '02.5_matrix-multiplication.mdx': '2.5 矩阵乘法',
  '02.6_the-fast-fourier-transform.mdx': '2.6 快速傅里叶变换',
  '02.7_exercises.mdx': '第2章 习题',

  '03.1_why-graphs.mdx': '3.1 为何研究图',
  '03.2_depth-first-search-in-undirected-graphs.mdx': '3.2 无向图中的深度优先搜索',
  '03.3_depth-first-search-in-directed-graphs.mdx': '3.3 有向图中的深度优先搜索',
  '03.4_strongly-connected-components.mdx': '3.4 强连通分量',
  '03.5_exercises.mdx': '第3章 习题',

  '04.1_distances.mdx': '4.1 距离',
  '04.2_breadth-first-search.mdx': '4.2 广度优先搜索',
  '04.3_lengths-on-edges.mdx': '4.3 边权重',
  '04.4_dijkstras-algorithm.mdx': '4.4 Dijkstra算法',
  '04.5_priority-queue-implementations.mdx': '4.5 优先队列实现',
  '04.6_shortest-paths-in-the-presence-of-negative-edges.mdx': '4.6 负权边下的最短路径',
  '04.7_shortest-paths-in-dags.mdx': '4.7 有向无环图中的最短路径',
  '04.8_exercises.mdx': '第4章 习题',

  '05.1_minimum-spanning-trees.mdx': '5.1 最小生成树',
  '05.2_huffman-encoding.mdx': '5.2 霍夫曼编码',
  '05.3_horn-formulas.mdx': '5.3 Horn公式',
  '05.4_set-cover.mdx': '5.4 集合覆盖',
  '05.5_exercises.mdx': '第5章 习题',

  '06.1_shortest-paths-in-dags-revisited.mdx': '6.1 重温DAG最短路径',
  '06.2_longest-increasing-subsequences.mdx': '6.2 最长递增子序列',
  '06.3_edit-distance.mdx': '6.3 编辑距离',
  '06.4_knapsack.mdx': '6.4 背包问题',
  '06.5_chain-matrix-multiplication.mdx': '6.5 矩阵链乘法',
  '06.6_shortest-paths.mdx': '6.6 所有点对最短路径',
  '06.7_independent-sets-in-trees.mdx': '6.7 树中的独立集',
  '06.8_exercises.mdx': '第6章 习题',

  '07.1_an-introduction-to-linear-programming.mdx': '7.1 线性规划导论',
  '07.2_flows-in-networks.mdx': '7.2 网络流',
  '07.3_bipartite-matching.mdx': '7.3 二分图匹配',
  '07.4_duality.mdx': '7.4 对偶性',
  '07.5_zero-sum-games.mdx': '7.5 零和博弈',
  '07.6_the-simplex-algorithm.mdx': '7.6 单纯形算法',
  '07.7_postscript-circuit-evaluation.mdx': '7.7 结语：电路求值',
  '07.8_exercises.mdx': '第7章 习题',

  '08.1_search-problems.mdx': '8.1 搜索问题',
  '08.2_np-complete-problems.mdx': '8.2 NP完全问题',
  '08.3_the-reductions.mdx': '8.3 规约证明',
  '08.4_exercises.mdx': '第8章 习题',

  '09.1_intelligent-exhaustive-search.mdx': '9.1 智能穷举搜索',
  '09.2_approximation-algorithms.mdx': '9.2 近似算法',
  '09.3_local-search-heuristics.mdx': '9.3 局部搜索启发式',
  '09.4_exercises.mdx': '第9章 习题',

  '10.1_qubits-superposition-and-measurement.mdx': '10.1 量子比特、叠加与测量',
  '10.2_the-plan.mdx': '10.2 量子算法蓝图',
  '10.3_the-quantum-fourier-transform.mdx': '10.3 量子傅里叶变换',
  '10.4_periodicity.mdx': '10.4 周期性寻找',
  '10.5_quantum-circuits.mdx': '10.5 量子电路',
  '10.6_factoring-as-periodicity.mdx': '10.6 因子分解归结为周期性',
  '10.7_the-quantum-algorithm-for-factoring.mdx': '10.7 Shor量子因式分解算法',
  '10.8_exercises.mdx': '第10章 习题',

  '11.1_historical-notes-and-further-reading.mdx': '历史注记与延伸阅读',
};

const SOURCE_DIR = path.resolve('src/content/docs/collections/cs/algorithms');
const TARGET_DIR = path.resolve('src/content/docs/collections/cs/algorithms/zh');

function parseArgs() {
  const args = process.argv.slice(2);
  let limit = Infinity;
  let filterPrefix = '';
  let specificFiles = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--limit=')) {
      limit = parseInt(args[i].split('=')[1], 10);
    } else if (args[i].startsWith('--prefix=')) {
      filterPrefix = args[i].split('=')[1];
    } else if (args[i].startsWith('--files=')) {
      specificFiles = args[i].split('=')[1].split(',');
    }
  }

  return { limit, filterPrefix, specificFiles };
}

function postProcessChineseMdx(text, fileName) {
  let processed = text;

  processed = processed.replace(/!\[(.*?)\]\(images\//g, '![$1](../images/');

  processed = processed
    .replace(/<Solution\s+title=["']Proof["']>/g, '<Solution title="证明">')
    .replace(/<Example\s+title=["']Example["']>/g, '<Example title="例题">')
    .replace(/<Knowledge\s+title=["']Definition["']>/g, '<Knowledge title="定义">')
    .replace(/<Knowledge\s+title=["']Theorem["']>/g, '<Knowledge title="定理">')
    .replace(/<Knowledge\s+title=["']Lemma["']>/g, '<Knowledge title="引理">');

  processed = processed.replace(/(\$(?:[^\$\r\n]+?)\$)(?=\$(?:[^\$\r\n]+?)\$)/g, '$1 ');

  processed = processed
    .replace(/（米）/g, '(m) ')
    .replace(/（页）/g, '(p) ')
    .replace(/（([a-zA-Z])）/g, '($1) ');

  processed = processed.replace(/<([a-zA-Z_][a-zA-Z0-9_]*\()/g, '&lt;$1');

  const zhTitle = CHINESE_TITLES[fileName];
  if (zhTitle) {
    processed = processed.replace(/^title:\s*['"].*?['"]/m, `title: '${zhTitle}'`);
  }

  return processed;
}

async function translateFile(fileName) {
  const srcPath = path.join(SOURCE_DIR, fileName);
  const tgtPath = path.join(TARGET_DIR, fileName);

  if (!fs.existsSync(srcPath)) {
    console.warn(`[Skip] 原始文件不存在: ${srcPath}`);
    return false;
  }

  console.log(`\n⏳ 开始翻译: ${fileName} -> zh/${fileName}`);
  const startTime = Date.now();
  const rawContent = fs.readFileSync(srcPath, 'utf-8');

  try {
    const result = await translationService.translate(rawContent, {
      provider: 'google',
      preserveStructure: true,
      sourceLang: 'en',
      targetLang: 'zh-CN',
    });

    if (!result.success) {
      console.error(`❌ 翻译失败 (${fileName}): ${result.error}`);
      return false;
    }

    const finalContent = postProcessChineseMdx(result.translatedText, fileName);
    fs.writeFileSync(tgtPath, finalContent, 'utf-8');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ 完成 [${duration}s] (保护标记: ${result.tokensPreserved} 提取 / ${result.tokensRestored} 还原)`);
    return true;
  } catch (err) {
    console.error(`❌ 异常 (${fileName}):`, err);
    return false;
  }
}

async function main() {
  const { limit, filterPrefix, specificFiles } = parseArgs();

  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  let allFiles = Object.keys(CHINESE_TITLES);
  if (specificFiles.length > 0) {
    allFiles = allFiles.filter((f) => specificFiles.includes(f));
  } else if (filterPrefix) {
    allFiles = allFiles.filter((f) => f.startsWith(filterPrefix));
  }

  const filesToProcess = allFiles.slice(0, limit);
  console.log(`🚀 启动 《Algorithms》 双语教材翻译流水线`);
  console.log(`📚 计划翻译章节数: ${filesToProcess.length} 篇 (总计 ${allFiles.length} 篇)`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < filesToProcess.length; i++) {
    const file = filesToProcess[i];
    console.log(`\n[${i + 1}/${filesToProcess.length}] 处理章节: ${file}`);
    const ok = await translateFile(file);
    if (ok) {
      successCount++;
    } else {
      failCount++;
    }

    if (i < filesToProcess.length - 1) {
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  console.log(`\n========================================`);
  console.log(`🎉 翻译流水线执行完毕！成功: ${successCount}，失败: ${failCount}`);
  console.log(`========================================\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
