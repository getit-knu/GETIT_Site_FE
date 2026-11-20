import { afterEach, describe, expect, it } from "vitest";

import { clearReturnPath, rememberReturnPath, takeReturnPath } from "./loginReturn";

afterEach(() => {
  sessionStorage.clear();
});

describe("loginReturn", () => {
  it("적어 둔 경로를 한 번만 꺼낸다", () => {
    rememberReturnPath("/");

    expect(takeReturnPath()).toBe("/");
    expect(takeReturnPath()).toBeNull();
  });

  it.each(["//evil.com", "/\\evil.com", "https://evil.com", "evil"])("외부로 나가는 경로 %s 는 받지 않는다", (path) => {
    rememberReturnPath(path);

    expect(takeReturnPath()).toBeNull();
  });

  it("저장소가 변조돼 외부 주소가 들어 있어도 꺼내지 않는다", () => {
    sessionStorage.setItem("getit.loginReturnPath", "//evil.com");

    expect(takeReturnPath()).toBeNull();
  });

  it("지우면 꺼낼 게 없다", () => {
    rememberReturnPath("/projects");
    clearReturnPath();

    expect(takeReturnPath()).toBeNull();
  });
});
