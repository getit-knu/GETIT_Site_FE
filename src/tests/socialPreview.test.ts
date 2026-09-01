import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { HOME_TITLE } from "../libs/documentTitle";

/*
 * 링크 미리보기는 **화면 어디에도 안 나온다.** 지워져도, 주소가 상대 경로로 바뀌어도,
 * 이미지가 사라져도 사이트는 멀쩡히 돌아가고 아무 테스트도 깨지지 않는다. 카카오톡에
 * 링크를 붙여 본 사람만 알게 되는데, 그때는 이미 신입생에게 파란 주소만 간 뒤다.
 * 그래서 원본을 직접 읽어 규칙만 지킨다.
 */
const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

function metaContent(key: string): string | null {
  // prettier 가 긴 태그를 여러 줄로 접으므로 속성 사이 줄바꿈을 허용해야 한다.
  const found = new RegExp(`<meta\\s+(?:property|name)="${key}"\\s+content="([^"]*)"`, "s").exec(html);
  return found?.[1] ?? null;
}

describe("링크 미리보기 메타", () => {
  it("미리보기에 필요한 태그가 다 있다", () => {
    for (const key of ["og:type", "og:site_name", "og:title", "og:description", "og:image", "twitter:card"]) {
      expect(metaContent(key), `${key} 가 없다`).not.toBeNull();
    }
    expect(html).toMatch(/name="description"/);
  });

  it("og:image 는 절대 주소다", () => {
    // 크롤러는 상대 경로를 풀어 주지 않는다. `/og.png` 로 적으면 썸네일이 안 뜬다.
    expect(metaContent("og:image")).toMatch(/^https:\/\//);
  });

  it("적어 둔 이미지 크기가 실제 파일과 맞는다", () => {
    // 카카오·페이스북은 이 값을 믿고 자리를 먼저 잡는다. 어긋나면 미리보기가 찌그러진다.
    const png = readFileSync(resolve(process.cwd(), "public/og.png"));
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    // PNG IHDR: 16바이트 뒤에 폭·높이가 빅엔디언 4바이트씩 온다.
    expect(String(png.readUInt32BE(16))).toBe(metaContent("og:image:width"));
    expect(String(png.readUInt32BE(20))).toBe(metaContent("og:image:height"));
  });

  it("og.png 가 카카오 권장 상한(5MB) 안에 있다", () => {
    expect(statSync(resolve(process.cwd(), "public/og.png")).size).toBeLessThan(5 * 1024 * 1024);
  });

  it("첫 화면 제목과 og:title 이 같은 문구를 쓴다", () => {
    // 탭에 뜨는 이름과 카톡에 뜨는 이름이 다르면 같은 사이트로 보이지 않는다.
    expect(metaContent("og:title")).toBe(HOME_TITLE.replace("&", "&amp;"));
    expect(html).toContain(`<title>${HOME_TITLE.replace("&", "&amp;")}</title>`);
  });
});
