/// <reference types="@cloudflare/workers-types" />

interface Env {
  ASSETS: Fetcher;
  CACHE?: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    let pathname = url.pathname;

    // Handle root path
    if (pathname === "/") {
      pathname = "/index.html";
    }

    // Try to serve static assets from .next/static
    if (pathname.startsWith("/_next/")) {
      const staticResponse = await env.ASSETS.fetch(
        new Request(new URL(pathname, request.url), request)
      );
      if (staticResponse.status === 200) {
        return staticResponse;
      }
    }

    // Try to serve from public directory
    if (!pathname.startsWith("/_") && !pathname.includes(".")) {
      // This might be a page route - try the HTML version
      const htmlPath = `${pathname}.html`;
      const htmlResponse = await env.ASSETS.fetch(
        new Request(new URL(htmlPath, request.url), request)
      );
      if (htmlResponse.status === 200) {
        return htmlResponse;
      }
    }

    // Try the exact path
    const response = await env.ASSETS.fetch(request);

    // If not found, try index.html (for SPA routing)
    if (response.status === 404) {
      return await env.ASSETS.fetch(
        new Request(new URL("/index.html", request.url), request)
      );
    }

    return response;
  },
};
