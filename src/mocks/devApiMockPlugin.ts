import type { Plugin } from "vite";

import { createMockApi } from "./mockApi";

/**
 * dev 서버 전용 목 API. `VITE_API_BASE_URL`이 비어 있으면 axios 요청이 same-origin
 * `/api/*`로 오는데, 그대로 두면 SPA 폴백(index.html)이 200으로 응답해
 * MALFORMED_RESPONSE가 된다 — 여기서 가로채 계약 모양의 JSON을 준다.
 *
 * `apply: "serve"`라 빌드 산출물에는 절대 들어가지 않는다.
 */
export function devApiMock(): Plugin {
  return {
    name: "getit-dev-api-mock",
    apply: "serve",
    configureServer(server) {
      const api = createMockApi();

      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        if (!url.pathname.startsWith("/api/")) return next();

        let raw = "";
        req.on("data", (chunk: Buffer) => {
          raw += chunk.toString();
        });
        req.on("end", () => {
          let body: unknown;
          try {
            body = raw === "" ? undefined : JSON.parse(raw);
          } catch {
            body = undefined;
          }

          const hit = api.resolve(req.method ?? "GET", url.pathname, url.searchParams, body);
          const response = hit ?? {
            status: 404,
            body: {
              success: false,
              data: null,
              error: { code: "RESOURCE_NOT_FOUND", message: `목에 없는 경로: ${url.pathname}` },
            },
          };

          res.statusCode = response.status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(response.body));
        });
      });
    },
  };
}
