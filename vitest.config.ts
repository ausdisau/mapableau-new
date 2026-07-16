import path from "path";
import { defineConfig } from "vitest/config";

const packages = path.resolve(__dirname, "packages");

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@mapable/access-fit": path.join(packages, "access-fit/src/index.ts"),
      "@mapable/access-routing": path.join(
        packages,
        "access-routing/src/index.ts",
      ),
      "@mapable/access-consent": path.join(
        packages,
        "access-consent/src/index.ts",
      ),
      "@mapable/access-react": path.join(packages, "access-react/src/index.ts"),
      "@mapable/access-test-fixtures": path.join(
        packages,
        "access-test-fixtures/src/index.ts",
      ),
      "@mapable/access-types": path.join(packages, "access-types/src/index.ts"),
      "@mapable/access-client": path.join(
        packages,
        "access-client/src/index.ts",
      ),
      "@mapable/access-widget": path.join(
        packages,
        "access-widget/src/index.ts",
      ),
    },
  },
});
