import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

import { devApiMock } from "./src/mocks/devApiMockPlugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devApiMock()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
  },
});
