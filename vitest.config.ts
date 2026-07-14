import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@mapable/contracts": path.resolve(
        __dirname,
        "packages/contracts/src/index.ts"
      ),
      "@mapable/intelligence-kernel": path.resolve(
        __dirname,
        "packages/intelligence-kernel/src/index.ts"
      ),
      "@mapable/domain-transport": path.resolve(
        __dirname,
        "packages/domain-transport/src/index.ts"
      ),
      "@mapable/domain-provider": path.resolve(
        __dirname,
        "packages/domain-provider/src/index.ts"
      ),
      "@mapable/domain-workforce": path.resolve(
        __dirname,
        "packages/domain-workforce/src/index.ts"
      ),
      "@mapable/careos-contracts": path.resolve(
        __dirname,
        "packages/careos-contracts/src/index.ts"
      ),
      "@mapable/validation": path.resolve(
        __dirname,
        "packages/mapable-validation/src/index.ts"
      ),
      "@mapable/feature-flags": path.resolve(
        __dirname,
        "packages/mapable-feature-flags/src/index.ts"
      ),
      "@mapable/design-tokens": path.resolve(
        __dirname,
        "packages/mapable-design-tokens/src/index.ts"
      ),
      "@mapable/api-client": path.resolve(
        __dirname,
        "packages/mapable-api-client/src/index.ts"
      ),
      "@mapable/auth-client": path.resolve(
        __dirname,
        "packages/mapable-auth-client/src/index.ts"
      ),
      "@mapable/accessibility": path.resolve(
        __dirname,
        "packages/mapable-accessibility/src/index.ts"
      ),
    },
  },
});
