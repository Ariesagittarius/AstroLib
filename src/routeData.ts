import { defineRouteMiddleware } from "@astrojs/starlight/route-data";

export const onRequest = defineRouteMiddleware((context) => {
  const { starlightRoute } = context.locals;

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
