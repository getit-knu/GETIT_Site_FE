import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

import { devApiMock } from "./src/mocks/devApiMockPlugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devApiMock()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    // Claude Code가 만드는 git worktree(.claude/worktrees/*)는 저장소 전체의 복사본이라,
    // 제외하지 않으면 그 안의 테스트까지 이중으로 긁어온다 — 복사본은 자체 node_modules를
    // 가져 React가 중복 로드되면서 통째로 깨진다.
    exclude: [...configDefaults.exclude, "**/.claude/**"],
  },
});
