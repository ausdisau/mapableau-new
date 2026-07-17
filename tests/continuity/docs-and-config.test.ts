import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Wave 11 doc set and config", () => {
  const docsDir = path.join(process.cwd(), "docs", "continuity");
  const REQUIRED_DOCS = [
    "wave-11-architecture-and-risk-plan.md",
    "wave-11-integrity-baseline.md",
    "wave-11-life-event-taxonomy.md",
    "wave-11-signal-taxonomy.md",
    "wave-11-continuity-graph.md",
    "wave-11-impact-and-detection.md",
    "wave-11-case-lifecycle.md",
    "wave-11-recovery-plans.md",
    "wave-11-recovery-execution.md",
    "wave-11-standing-instructions.md",
    "wave-11-essential-support-boundary.md",
    "wave-11-emergency-boundary.md",
    "wave-11-civic-feed-registry.md",
    "wave-11-domain-adapters.md",
    "wave-11-communications.md",
    "wave-11-escalation.md",
    "wave-11-capacity-reservations.md",
    "wave-11-outcomes.md",
    "wave-11-aura-service-recovery-specialist.md",
    "wave-11-test-plan.md",
    "wave-11-operations-runbook.md",
    "wave-11-not-emergency.md",
  ];

  for (const f of REQUIRED_DOCS) {
    it(`docs/continuity/${f} exists`, () => {
      expect(fs.existsSync(path.join(docsDir, f))).toBe(true);
    });
  }

  it("README mentions Wave 11 life events & service recovery", () => {
    const readme = fs.readFileSync(path.join(process.cwd(), "README.md"), "utf8");
    expect(readme.toLowerCase()).toMatch(/wave 11/);
    expect(readme.toLowerCase()).toMatch(/life event|service recovery|continuity/);
  });

  it(".env.example mentions Wave 11", () => {
    const env = fs.readFileSync(path.join(process.cwd(), ".env.example"), "utf8");
    expect(env).toMatch(/Wave 11/i);
  });

  it("package.json exposes the continuity:* scripts", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
    const scripts = pkg.scripts as Record<string, string>;
    const required = [
      "continuity:audit-orchestration",
      "continuity:audit-cancellations",
      "continuity:audit-queries",
      "continuity:audit-idempotency",
      "continuity:audit-placeholders",
      "continuity:audit-consent",
      "continuity:test-graph",
      "continuity:test-impact",
      "continuity:test-options",
      "continuity:test-simulation",
      "continuity:test-execution",
      "continuity:test-emergency-boundary",
      "continuity:test-accessibility",
      "continuity:evaluate",
      "continuity:audit-orchestration-links",
      "continuity:audit-direct-cancellation-propagation",
      "continuity:migrate-reschedule-requests",
      "continuity:backfill-continuity-nodes",
      "continuity:backfill-continuity-dependencies",
      "continuity:audit-unscoped-recovery-queries",
      "continuity:audit-recovery-idempotency",
      "continuity:audit-placeholder-operational-data",
      "continuity:audit-continuity-consent",
      "continuity:audit-provider-failure-paths",
    ];
    for (const key of required) {
      expect(scripts[key], key).toBeTruthy();
    }
  });
});
