/**
 * Lightweight eslint-plugin-import resolver for tsconfig path aliases only.
 *
 * Unlike eslint-import-resolver-alias, unmatched imports return { found: false }
 * without calling Node's Module._findPath (which throws on packages whose
 * package.json "exports" omit a main entry). Node / other resolvers then handle
 * those imports. This avoids loading a TypeScript programme.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".json", ""];

/** @type {Record<string, string>} exact package aliases → repo-relative targets */
const EXACT = {
  "@mapable/contracts": "packages/contracts/src/index.ts",
  "@mapable/intelligence-kernel": "packages/intelligence-kernel/src/index.ts",
  "@mapable/domain-transport": "packages/domain-transport/src/index.ts",
  "@mapable/domain-provider": "packages/domain-provider/src/index.ts",
  "@mapable/domain-workforce": "packages/domain-workforce/src/index.ts",
};

/**
 * @param {string} source
 * @param {string} file
 * @param {Record<string, unknown>} [_config]
 * @returns {{ found: boolean, path?: string }}
 */
function resolve(source, file, _config) {
  const root = process.cwd();

  if (Object.prototype.hasOwnProperty.call(EXACT, source)) {
    const abs = path.join(root, EXACT[source]);
    if (fs.existsSync(abs)) {
      return { found: true, path: abs };
    }
    return { found: false };
  }

  let mapped = null;
  if (source.startsWith("@/")) {
    mapped = path.join(root, source.slice(2));
  } else if (source.startsWith("@server/")) {
    mapped = path.join(root, "server", source.slice("@server/".length));
  } else {
    // Not a path alias — let the node resolver handle it.
    return { found: false };
  }

  for (const ext of EXTENSIONS) {
    const candidate = mapped + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return { found: true, path: candidate };
    }
  }

  // Directory index
  for (const ext of [".ts", ".tsx", ".js", ".jsx"]) {
    const index = path.join(mapped, "index" + ext);
    if (fs.existsSync(index)) {
      return { found: true, path: index };
    }
  }

  return { found: false };
}

module.exports = {
  interfaceVersion: 2,
  resolve,
};
