/**
 * Pure Node 22 contract checks (no Vitest, no path aliases, no Zod runtime).
 * Full behavioural coverage lives in engine.test.ts under Vitest.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  isMyDayResilienceEnabled,
  MY_DAY_RESILIENCE_PERMANENT_DENY,
} from "../../lib/my-day-resilience/flags.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("production cannot enable the simulator even when flag is true", () => {
  assert.equal(
    isMyDayResilienceEnabled({
      NODE_ENV: "production",
      MAPABLE_MY_DAY_RESILIENCE_ENABLED: "true",
    }),
    false,
  );
  assert.equal(
    isMyDayResilienceEnabled({
      NODE_ENV: "test",
      MAPABLE_MY_DAY_RESILIENCE_ENABLED: "true",
    }),
    true,
  );
});

test("permanent deny constants are hard-false", () => {
  for (const [key, value] of Object.entries(MY_DAY_RESILIENCE_PERMANENT_DENY)) {
    assert.equal(value, false, key);
  }
});

test("care adapter reuses participant-preview and never references matching-service", () => {
  const care = readFileSync(
    path.join(root, "lib/my-day-resilience/care-adapter.ts"),
    "utf8",
  );
  assert.match(care, /reviewFictionalWorker/);
  assert.match(care, /participant-preview/);
  assert.doesNotMatch(care, /matching\/matching-service/);
  assert.match(care, /canExecute: false/);
});

test("engine blocks irreversible execute notes and preserves consent withdrawal", () => {
  const engine = readFileSync(
    path.join(root, "lib/my-day-resilience/engine.ts"),
    "utf8",
  );
  assert.match(engine, /EXECUTE_BOOKING/);
  assert.match(engine, /irreversible_blocked/);
  assert.match(engine, /consent_withdrawn/);
  assert.match(engine, /CrossTenantAccessError/);
  assert.match(engine, /canBook: false/);
  assert.doesNotMatch(engine, /matching\/matching-service/);
});

test("UI keeps non-map list path, live regions and demo banner", () => {
  const ui = readFileSync(
    path.join(root, "components/my-day-resilience/MyDayResilienceSimulator.tsx"),
    "utf8",
  );
  assert.match(ui, /aria-live="polite"/);
  assert.match(ui, /no map required/);
  assert.match(ui, /DEMO ONLY/);
  assert.match(ui, /min-h-11/);
  assert.match(ui, /Request human help/);
});

test("page is flag-gated with notFound", () => {
  const page = readFileSync(
    path.join(root, "app/dashboard/my-day-resilience/page.tsx"),
    "utf8",
  );
  assert.match(page, /isMyDayResilienceEnabled/);
  assert.match(page, /notFound/);
  assert.match(page, /robots: \{ index: false/);
});
