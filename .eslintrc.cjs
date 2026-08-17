/**
 * ESLint config — intentionally without parserOptions.project.
 *
 * Evidence (PR #476/#477): sharding alone still OOM'd (~4GB, exit 134) because
 * attaching the broad ./tsconfig.json programme multiplied memory. No enabled
 * rule requires typed parser services (extends recommended, not
 * recommended-type-checked). Full-project type safety remains `pnpm type-check`.
 *
 * Path aliases are resolved via eslint-import-resolver-alias (not the TypeScript
 * programme loader) so import/no-unresolved stays at error without reintroducing
 * heap cost.
 */
/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:jsx-a11y/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["@typescript-eslint", "import", "jsx-a11y"],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "import/order": [
      "error",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
        ],
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
      },
    ],
    "import/no-unresolved": "error",
    "import/no-named-as-default": "off",
    "import/no-named-as-default-member": "off",
    "@next/next/no-img-element": "off",
    "react-hooks/exhaustive-deps": "off",
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
  },
  settings: {
    "import/resolver": {
      alias: {
        map: [
          ["@", "."],
          ["@server", "./server"],
          ["@mapable/contracts", "./packages/contracts/src/index.ts"],
          [
            "@mapable/intelligence-kernel",
            "./packages/intelligence-kernel/src/index.ts",
          ],
          [
            "@mapable/domain-transport",
            "./packages/domain-transport/src/index.ts",
          ],
          [
            "@mapable/domain-provider",
            "./packages/domain-provider/src/index.ts",
          ],
          [
            "@mapable/domain-workforce",
            "./packages/domain-workforce/src/index.ts",
          ],
        ],
        extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
      },
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
    },
  },
  ignorePatterns: [
    "node_modules/",
    ".next/",
    ".next/types/**",
    "out/",
    "build/",
    "dist/",
    "*.config.js",
    "*.config.ts",
    "next-env.d.ts",
  ],
};
