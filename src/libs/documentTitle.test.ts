import { describe, expect, it } from "vitest";

import { formatTitle, HOME_TITLE, SITE_NAME } from "./documentTitle";

describe("formatTitle", () => {
  it("구체적인 쪽을 앞에 둔다", () => {
    // 브라우저 탭은 폭이 좁아 오른쪽부터 잘린다. 사이트 이름이 앞이면 탭 열 개가
    // 전부 "GET IT…" 이 되어 지금과 달라지는 게 없다.
    expect(formatTitle("프로젝트 쇼케이스")).toBe("프로젝트 쇼케이스 · GET IT");
  });

  it("영역을 주면 화면 이름과 사이트 이름 사이에 넣는다", () => {
    // 부원 대시보드와 어드민 대시보드가 둘 다 "대시보드" 라 이게 없으면 구별할 수 없다.
    expect(formatTitle("대시보드", "부원")).toBe("대시보드 · 부원 · GET IT");
    expect(formatTitle("대시보드", "관리자")).toBe("대시보드 · 관리자 · GET IT");
  });

  it("정식 표기는 띄어쓰기가 있는 GET IT 이다", () => {
    expect(SITE_NAME).toBe("GET IT");
    expect(HOME_TITLE.startsWith("GET IT · ")).toBe(true);
  });
});
