import type { APIRoute } from 'astro';
import { features } from '../config/features.config.mjs';

/**
 * 动态静态 robots.txt 路由
 * 构建期由 Astro SSG 自动渲染为 dist/robots.txt
 * 自动绑定当前配置的站点绝对域名，并屏蔽开发/私有接口与全书打印页
 */
export const GET: APIRoute = ({ site }) => {
  const siteUrl = site
    ? site.href.replace(/\/$/, '')
    : (features.seo?.config?.siteUrl || 'https://astrolib.cloud').replace(/\/$/, '');

  const robotsTxt = `# ==============================================================================
# AstroLib 搜索引擎爬虫配置文件 (RFC 9309)
# ==============================================================================

User-agent: *
Allow: /

# 屏蔽内部开发热重载与模块巡检端点
Disallow: /__edit__/
Disallow: /__inspector__/
Disallow: /__relation_graph__/
Disallow: /__chapter_export__/
Disallow: /api/

# 屏蔽高负载全书连续排版打印视图（避免浪费爬虫配额）
Disallow: /print

# 全站地图索引入口
Sitemap: ${siteUrl}/sitemap-index.xml
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
