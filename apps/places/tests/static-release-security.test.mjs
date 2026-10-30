import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  validatePublicIndex,
  validateBuildTree,
} from "../scripts/verify-static-release.mjs";

const provider = {
  id: "1234567890abcdef12", name: "Example Care Organisation",
  state: "NSW", postcode: "2075", suburb: "St Ives",
  categories: ["Daily Personal Activities"],
};
const index = {
  schema: "mapable.offline-provider-directory.v1",
  generatedAt: "2026-10-30T00:00:00.000Z",
  source: "bundled snapshot", disclaimer: "Not verified",
  inputRows: 2, excludedRows: 1,
  providerCount: 1, providers: [provider],
};

test("only known, purpose-limited public fields may reach the web build", () => {
  assert.deepEqual(validatePublicIndex(index), {providers: 1, sourceRows: 2});
  assert.throws(() => validatePublicIndex({
    ...index, providers: [{ ...provider, email: "person@example.test" }],
  }), /Unexpected provider field/);
  assert.throws(() => validatePublicIndex({
    ...index, providers: [{ ...provider, latitude: -33.73 }],
  }), /Unexpected provider field/);
  assert.throws(() => validatePublicIndex({
    ...index, providers: [{ ...provider, name: "person@example.com" }],
  }), /Potentially private/);
  assert.throws(() => validatePublicIndex({
    ...index, providerCount: 2,
  }), /count/);
});

test("static release cannot include secrets, source maps, or source dataset", () => {
  const tmp = mkdtempSync(join(tmpdir(), "mapable-static-boundary-"));
  try {
    writeFileSync(join(tmp, "index.html"), "<html></html>");
    assert.equal(validateBuildTree(tmp).files, 1);
    writeFileSync(join(tmp, ".env.local"), "SECRET=testing");
    assert.throws(() => validateBuildTree(tmp), /Private\/build-only/);
    rmSync(join(tmp, ".env.local"));
    writeFileSync(join(tmp, "main.js.map"), "{}");
    assert.throws(() => validateBuildTree(tmp), /Private\/build-only/);
    rmSync(join(tmp, "main.js.map"));
    mkdirSync(join(tmp, "assets"));
    writeFileSync(join(tmp, "assets", "main.js"), "console.log('safe')");
    assert.equal(validateBuildTree(tmp).files, 2);
  } finally {
    rmSync(tmp, {recursive: true, force: true});
  }
});

test("static hosts do not serve phantom authenticated APIs as HTTP 200 HTML", () => {
  const wasmer = readFileSync(new URL("../wasmer.toml", import.meta.url), "utf8");
  const apache = readFileSync(new URL("../deploy/cpanel/.htaccess", import.meta.url), "utf8");
  assert.equal(/--page-fallback/.test(wasmer), false);
  assert.equal(/RewriteRule\s+\^\s+index\.html/i.test(apache), false);
  assert.match(apache, /Content-Security-Policy/);
  assert.match(apache, /geolocation=\(\)/);
});
