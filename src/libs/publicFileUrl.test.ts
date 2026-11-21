import { afterEach, describe, expect, it, vi } from "vitest";

import { isOurPublicFileUrl } from "./publicFileUrl";

describe("isOurPublicFileUrl (#384)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("운영 API 서버의 공개 파일과 Azure 공개 저장소만 허용한다", () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.getit.io.kr");

    expect(isOurPublicFileUrl("https://api.getit.io.kr/api/public/files/public/c66a.png")).toBe(true);
    expect(isOurPublicFileUrl("https://getitpublic01.blob.core.windows.net/public-assets/public/a.png")).toBe(true);

    expect(isOurPublicFileUrl("https://tracker.example.com/pixel.gif")).toBe(false);
    expect(isOurPublicFileUrl("https://api.getit.io.kr.evil.com/api/public/files/a.png")).toBe(false);
    expect(isOurPublicFileUrl("https://api.getit.io.kr/api/admin/users")).toBe(false);
  });

  it("API 주소가 비어 있으면(dev 목) 같은 출처의 공개 파일 경로를 허용한다", () => {
    vi.stubEnv("VITE_API_BASE_URL", "");

    expect(isOurPublicFileUrl("/api/public/files/public/a.png")).toBe(true);
  });
});
