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
          // 본문이 비어 있는 건 정상(GET 등)이지만, JSON으로 못 읽는 본문은 resolver까지
          // 보내지 않고 여기서 400으로 끊는다 — 예전엔 파싱 실패를 `undefined`로 뭉개서
          // 넘기는 바람에 본문을 쓰는 resolver가 예외를 던지고 응답이 안 나갔다.
          let body: unknown;
          if (raw !== "") {
            try {
              body = JSON.parse(raw);
            } catch {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  success: false,
                  data: null,
                  error: { code: "VALIDATION_FAILED", message: "요청 본문이 올바른 JSON이 아닙니다." },
                }),
              );
              return;
            }
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
