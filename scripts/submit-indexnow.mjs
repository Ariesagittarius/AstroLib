#!/usr/bin/env node
/**
 * scripts/submit-indexnow.mjs
 * ============================================================================
 * Bing & 搜索引擎 IndexNow 批量实时推送脚本
 * ============================================================================
 *
 * 原理：
 * 1. IndexNow 是由微软 Bing 发起并被 Yandex、Naver 采纳的主动推送协议；
 * 2. 本脚本自动读取生产构建产物中的 sitemap，提取全站所有 URL 清单；
 * 3. 自动检验/创建 IndexNow 验证密钥文件（{key}.txt）；
 * 4. 向 IndexNow API 批量提交，使 Bingbot 在数分钟内完成收录与更新重爬。
 *
 * 用法：
 *   node scripts/submit-indexnow.mjs
 *   node scripts/submit-indexnow.mjs --key=YOUR_32_HEX_KEY
 *   node scripts/submit-indexnow.mjs --dry-run
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { features } from '../src/config/features.config.mjs';

const siteUrl = (features.seo?.config?.siteUrl || process.env.SITE_URL || 'https://astrolib.cloud').replace(/\/$/, '');
const host = new URL(siteUrl).host;

// 解析 CLI 参数
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const keyArg = args.find(a => a.startsWith('--key='))?.split('=')[1];

let apiKey = keyArg || features.seo?.config?.indexNowKey || process.env.INDEXNOW_KEY;

if (!apiKey) {
  if (isDryRun) {
    apiKey = 'sample-indexnow-key-for-dry-run';
    console.log('[IndexNow] dry-run 模式：使用占位密钥测试流程。');
  } else {
    console.error('\n[IndexNow] 错误：未配置 IndexNow API 密钥！');
    console.log('请通过以下任意一种方式提供密钥：');
    console.log('  1. 环境变量: INDEXNOW_KEY="你的32位密钥"');
    console.log('  2. CLI 参数: npm run seo:indexnow -- --key=你的32位密钥');
    console.log('  3. 特性配置: src/config/features.config.mjs 中的 seo.config.indexNowKey');
    console.log('并在 public/ 目录下放置对应的 <你的32位密钥>.txt 文件以供 Bing 校验所有权。\n');
    process.exit(1);
  }
}

// 检查 public/{apiKey}.txt 验证文件是否存在（仅在正式提交时检查）
if (!isDryRun) {
  const keyFilePath = path.resolve('public', `${apiKey}.txt`);
  if (!fs.existsSync(keyFilePath)) {
    console.warn(`\n[IndexNow] 警告：未找到 public/${apiKey}.txt 认证文件！`);
    console.warn(`Bing 要求在站点根路径提供 https://${host}/${apiKey}.txt 返回密钥文本以验证所有权。`);
    console.log(`[IndexNow] 正在为您自动创建 public/${apiKey}.txt ...`);
    try {
      fs.writeFileSync(keyFilePath, apiKey, 'utf-8');
      console.log(`[IndexNow] 已成功创建 public/${apiKey}.txt`);
    } catch (e) {
      console.warn(`[IndexNow] 写入 public/${apiKey}.txt 失败:`, e.message);
    }
  }
}

// 提取全站 URL 列表
let urlList = [];

// 优先从 dist/sitemap-0.xml 中提取真实的构建产物 URL
const sitemapPath = path.resolve('dist', 'sitemap-0.xml');
if (fs.existsSync(sitemapPath)) {
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
  const locMatches = [...sitemapContent.matchAll(/<loc>(.*?)<\/loc>/g)];
  urlList = locMatches.map(m => m[1]);
  console.log(`[IndexNow] 成功从 dist/sitemap-0.xml 提取 ${urlList.length} 个 URL`);
}

// 若无构建产物，回退到基础站点路由
if (urlList.length === 0) {
  console.log('[IndexNow] 提示：未检测到 dist/ 生产构建产物，推送核心基础路由。建议先运行 npm run build。');
  urlList = [
    `${siteUrl}/`,
    `${siteUrl}/library/`,
    `${siteUrl}/sitemap/`,
    `${siteUrl}/dev/`,
  ];
}

const payload = {
  host,
  key: apiKey,
  keyLocation: `${siteUrl}/${apiKey}.txt`,
  urlList,
};

console.log(`\n==================================================`);
console.log(`[IndexNow] 准备推送至 Bing & IndexNow 平台:`);
console.log(`  站点域名 (Host) : ${host}`);
console.log(`  验证密钥 (Key)  : ${apiKey}`);
console.log(`  待推送 URL 数量  : ${urlList.length}`);
console.log(`==================================================\n`);

if (isDryRun) {
  console.log('[IndexNow] --dry-run 模式：跳过实际 HTTP 发送。');
  process.exit(0);
}

async function submitIndexNow() {
  const endpoints = [
    { name: 'Bing IndexNow 网关', url: 'https://www.bing.com/indexnow' },
    { name: 'IndexNow 联合网关', url: 'https://api.indexnow.org/indexnow' },
  ];

  let successCount = 0;
  for (const ep of endpoints) {
    try {
      console.log(`[IndexNow] 正在发送 HTTP POST 请求至 ${ep.name} (${ep.url}) ...`);
      const response = await fetch(ep.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 200 || response.status === 202) {
        console.log(`[IndexNow] 恭喜！成功推送 ${urlList.length} 个页面至 ${ep.name}（状态码: ${response.status}）！`);
        successCount++;
      } else {
        const respText = await response.text();
        console.warn(`[IndexNow] ${ep.name} 返回状态码: ${response.status}，详情: ${respText}`);
      }
    } catch (err) {
      console.warn(`[IndexNow] 连接 ${ep.name} 失败:`, err.message);
    }
  }

  if (successCount > 0) {
    console.log(`\n[IndexNow] 核心抓取网关已接受推送，Bingbot 将在数分钟内启动抓取队列。\n`);
  }
}

submitIndexNow();
