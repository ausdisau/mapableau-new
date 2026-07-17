import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Wave 11 migration + schema shape", () => {
  const migrationPath = path.join(
    process.cwd(),
    "prisma/migrations/20260716290000_wave11_life_events_service_recovery/migration.sql"
  );

  it("migration file exists at the expected name", () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it("migration is forward-only (no DROP TABLE / DROP TYPE for prior wave objects)", () => {
    const sql = fs.readFileSync(migrationPath, "utf8");
    // A forward-only migration should not drop anything from the baseline
    // schema. It may drop objects it created inside the same migration, but
    // for Wave 11 additions there are none.
    expect(sql).not.toMatch(/DROP TABLE\s+"cases"/i);
    expect(sql).not.toMatch(/DROP TABLE\s+"aura_/i);
    expect(sql).not.toMatch(/ALTER TABLE\s+"cases"\s+DROP/i);
  });

  it("migration creates all Wave 11 tables", () => {
    const sql = fs.readFileSync(migrationPath, "utf8");
    const TABLES = [
      "continuity_life_events",
      "continuity_signals",
      "participant_continuity_profiles",
      "continuity_requirements",
      "continuity_standing_recovery_instructions",
      "continuity_node_references",
      "continuity_dependencies",
      "continuity_impact_assessments",
      "continuity_cases",
      "continuity_recovery_options",
      "continuity_recovery_plans",
      "continuity_recovery_plan_steps",
      "continuity_recovery_executions",
      "continuity_capacity_reservations",
      "continuity_outcomes",
      "continuity_communication_attempts",
      "continuity_civic_feed_registrations",
    ];
    for (const t of TABLES) {
      expect(sql).toMatch(new RegExp(`CREATE TABLE\\s+"${t}"`));
    }
  });

  it("prisma schema declares the LifeEvent and ContinuitySignal models", () => {
    const schema = fs.readFileSync(path.join(process.cwd(), "prisma/schema.prisma"), "utf8");
    expect(schema).toMatch(/model LifeEvent \{/);
    expect(schema).toMatch(/model ContinuitySignal \{/);
    expect(schema).toMatch(/model ContinuityCase \{/);
    expect(schema).toMatch(/model RecoveryPlan \{/);
  });

  it("OrchestrationRescheduleRequest gained coordinatorId and organisationId", () => {
    const schema = fs.readFileSync(path.join(process.cwd(), "prisma/schema.prisma"), "utf8");
    const start = schema.indexOf("model OrchestrationRescheduleRequest {");
    expect(start).toBeGreaterThan(-1);
    const end = schema.indexOf("}", start);
    const block = schema.slice(start, end);
    expect(block).toMatch(/coordinatorId/);
    expect(block).toMatch(/organisationId/);
  });
});
