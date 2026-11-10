import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

test("skip link and main landmark exist on key pages", () => {
  const layout = fs.readFileSync(path.join(root, "app/layout.tsx"), "utf8");
  assert.match(layout, /skip-link/);
  assert.match(layout, /#main-content/);

  for (const file of [
    "app/page.tsx",
    "app/dashboard/page.tsx",
    "app/account/page.tsx",
    "app/sign-in/[[...sign-in]]/page.tsx",
    "app/sign-up/[[...sign-up]]/page.tsx",
  ]) {
    const src = fs.readFileSync(path.join(root, file), "utf8");
    assert.match(src, /id=["']main-content["']/, `${file} missing main-content`);
  }
});

test("globals.css supports reduced motion and focus visibility", () => {
  const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /clamp\(/);
});

test("ClerkProvider is inside body (Core 3 requirement)", () => {
  const layout = fs.readFileSync(path.join(root, "app/layout.tsx"), "utf8");
  const bodyIdx = layout.indexOf("<body");
  const clerkIdx = layout.indexOf("<ClerkProvider");
  assert.ok(bodyIdx >= 0 && clerkIdx > bodyIdx);
});

test("SignedIn/SignedOut are not used (Core 3)", () => {
  const page = fs.readFileSync(path.join(root, "app/page.tsx"), "utf8");
  assert.doesNotMatch(page, /SignedIn|SignedOut/);
  assert.match(page, /Show/);
});
