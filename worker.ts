/// <reference types="@cloudflare/workers-types" />

interface Env {
  ASSETS: Fetcher;
  CACHE?: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    let pathname = url.pathname;

    // 루트 경로 처리
    if (pathname === "/") {
      pathname = "/index.html";
    }

    try {
      // 정적 자산에서 파일 가져오기
      const staticResponse = await env.ASSETS.fetch(new Request(new URL(pathname, request.url), request));

      if (staticResponse.status === 200) {
        const response = new Response(staticResponse.body, staticResponse);

        // 캐싱 헤더 설정
        if (pathname.includes("/_next/")) {
          response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
        } else if (pathname.endsWith(".html")) {
          response.headers.set("Cache-Control", "public, max-age=3600");
        }

        return response;
      }

      // 파일 없음 시 index.html로 폴백 (SPA 라우팅)
      if (!pathname.includes(".")) {
        const indexResponse = await env.ASSETS.fetch(new Request(new URL("/index.html", request.url), request));
        return new Response(indexResponse.body, {
          status: 200,
          headers: indexResponse.headers,
        });
      }

      return new Response("404 Not Found", { status: 404 });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response("500 Internal Server Error", { status: 500 });
    }
  },
};
