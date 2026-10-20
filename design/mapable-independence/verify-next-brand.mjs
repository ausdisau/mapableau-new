// Targeted render contract check, not a substitute for the canonical Next build.
// Next's Link is replaced only to render its child image/link semantics offline.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const localRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const canonicalRoot = resolve(process.argv[2] ?? localRoot);
const outdir = resolve(localRoot, "generated-artifacts/mapable-brand");
await mkdir(outdir, { recursive: true });
const outfile = resolve(outdir, "next-brand-check.cjs");
await build({
  stdin: {
    contents: `
      export { MapAbleLogo } from "./components/brand/MapAbleLogo";
      export { MapAbleBrandLockup } from "./components/brand/MapAbleBrandLockup";
    `,
    resolveDir: canonicalRoot,
    loader: "tsx",
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  jsx: "automatic",
  packages: "external",
  external: ["react", "react/jsx-runtime"],
  alias: { "@": canonicalRoot },
  outfile,
  plugins: [{
    name: "offline-next-link",
    setup(bundler) {
      bundler.onResolve({ filter: /^next\/link$/ }, () => ({ path: "link", namespace: "offline" }));
      bundler.onLoad({ filter: /.*/, namespace: "offline" }, () => ({
        contents: `import React from "react"; export default function Link({href, children, ...props}) { return React.createElement("a", {...props, href}, children); }`,
        loader: "js",
      }));
    },
  }],
});
const require = createRequire(import.meta.url);
const { MapAbleLogo, MapAbleBrandLockup } = require(outfile);
const src = "/brand/mapable-independence.png";
let renders = 0;
for (const variant of ["full", "mark", "text"]) {
  const html = renderToStaticMarkup(React.createElement(MapAbleLogo, { variant, href: "/dashboard" }));
  assert.match(html, /href="\/dashboard"/);
  assert.match(html, /aria-label="MapAble home"/);
  assert.match(html, /width="1254" height="1254"/);
  assert.ok(html.includes(`src="${src}"`));
  assert.equal((html.match(/<img\b/g) ?? []).length, 1);
  assert.ok(!html.includes("<span"), "No recreated wordmark/tagline");
  renders++;
}
for (const size of ["header", "hero"]) {
  const html = renderToStaticMarkup(React.createElement(MapAbleBrandLockup, { size, href: "/" }));
  assert.ok(html.includes(`src="${src}"`));
  assert.match(html, /width="1254" height="1254"/);
  assert.ok(!html.includes("<span"), "No recreated tagline pill");
  assert.equal((html.match(/<img\b/g) ?? []).length, 1);
  renders++;
}
const artwork = await readFile(resolve(canonicalRoot, "public/brand/mapable-independence.png"));
assert.equal(createHash("sha256").update(artwork).digest("hex"), "7f2a5694180adc72d6978c2e1e17185c07b26e03f3bedcb1310a695d6c6311fc");
const manifest = JSON.parse(await readFile(resolve(canonicalRoot, "public/manifest.webmanifest"), "utf8"));
assert.ok(manifest.icons.some(icon => icon.src === src && icon.type === "image/png" && icon.sizes === "1254x1254"));
const layout = await readFile(resolve(canonicalRoot, "app/layout.tsx"), "utf8");
assert.ok(layout.includes('import "@/design/mapable-independence/styles.css"'));
assert.ok(!layout.includes('type: "image/svg+xml"'), "Logo metadata must match PNG bytes");
console.log(`PASS: ${renders} canonical logo/lockup renders, unchanged artwork SHA-256, manifest dimensions/MIME, root stylesheet import. Next routing and full build are not exercised.`);
