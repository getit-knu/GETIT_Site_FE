import { describe, expect, it } from "vitest";

import { ADMIN_MENU, findActiveMenu } from "./adminMenu";

describe("ADMIN_MENU", () => {
  it("사이드바 메뉴는 9개다", () => {
    // 와이어프레임이 페이지마다 6개 또는 8개로 다르게 그려져 있어 8개로 통일했었는데,
    // 와이어프레임에 없던 프로젝트 관리(#222)가 새로 추가되며 9개가 됐다.
    expect(ADMIN_MENU).toHaveLength(9);
  });

  it("경로가 중복되지 않는다", () => {
    const paths = ADMIN_MENU.map((item) => item.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe("findActiveMenu", () => {
  it("정확히 일치하는 경로를 찾는다", () => {
    expect(findActiveMenu("/admin/questions")?.label).toBe("Q&A 관리");
  });

  it("하위 경로에서도 상위 메뉴를 찾는다", () => {
    // 강의 상세로 들어가도 사이드바는 `강의 관리` 가 활성이어야 한다.
    expect(findActiveMenu("/admin/lectures/12")?.label).toBe("강의 관리");
  });

  it("`/admin` 은 대시보드다", () => {
    expect(findActiveMenu("/admin")?.label).toBe("대시보드");
  });

  it("하위 경로가 대시보드로 잡히지 않는다", () => {
    // `/admin` 은 모든 어드민 경로의 접두사라, 짧은 것부터 찾으면 항상 대시보드가 걸린다.
    for (const path of ["/admin/users", "/admin/site", "/admin/settings"]) {
      expect(findActiveMenu(path)?.label).not.toBe("대시보드");
    }
  });

  it("`/administration` 처럼 이름만 겹치는 경로는 걸리지 않는다", () => {
    // startsWith("/admin") 만 보면 여기에 걸린다. 경계는 `/` 여야 한다.
    expect(findActiveMenu("/administration")).toBeUndefined();
  });

  it("어드민 밖 경로는 없다", () => {
    expect(findActiveMenu("/member")).toBeUndefined();
  });
});
