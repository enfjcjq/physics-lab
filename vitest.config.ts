import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["apps/desktop/src/__tests__/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        lines: 60,
        functions: 55,
        branches: 50,
      },
    },
  },
  resolve: {
    alias: {
      "@physics-lab/shared": path.resolve(__dirname, "packages/shared/src"),
      "@physics-lab/ai-parser": path.resolve(__dirname, "packages/ai-parser/src"),
    },
  },
});
