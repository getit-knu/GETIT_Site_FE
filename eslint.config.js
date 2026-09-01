import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import importX from "eslint-plugin-import-x";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  // .claude: Claude Code의 git worktree(.claude/worktrees/*)가 저장소 복사본이라 이중 린트된다.
  globalIgnores(["dist", "**/generated.ts", ".claude"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      "import-x": importX,
    },
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "import-x/order": ["error", { "newlines-between": "always" }],
      "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },
]);
