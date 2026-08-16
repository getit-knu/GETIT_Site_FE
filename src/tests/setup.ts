import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// vitest globals(afterEach 등)를 켜지 않은 프로젝트라 RTL 자동 cleanup이 동작하지 않는다.
// portal로 document.body에 직접 렌더되는 컴포넌트(Modal 등)는 이게 없으면 테스트 간 DOM이 누적된다.
afterEach(() => {
  cleanup();
});
