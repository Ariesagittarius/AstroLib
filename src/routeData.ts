import { defineRouteMiddleware } from "@astrojs/starlight/route-data";

export const onRequest = defineRouteMiddleware((context) => {
  const { starlightRoute } = context.locals;

  // 强行检查当前页面是否有大纲 (toc) 数据
  // 如果没有（例如纯组件分块页面），则手动注入一个虚拟的 Overview 项
  // 从而强制 Starlight 必须在所有页面上都渲染出右侧边栏面板容器 .right-sidebar-panel
  if (!starlightRoute.toc || starlightRoute.toc.items.length === 0) {
    starlightRoute.toc = {
      minHeadingLevel: 2,
      maxHeadingLevel: 3,
      items: [
        { depth: 2, slug: "overview", text: "Overview", children: [] }
      ]
    };
  }
});