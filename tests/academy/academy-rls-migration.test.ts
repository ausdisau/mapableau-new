import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("Academy RLS migration", () => {
  const sql = readFileSync(
    join(
      process.cwd(),
      "prisma/migrations/20260714020000_mapable_academy_mvp/migration.sql",
    ),
    "utf8",
  );

  it("enables RLS on academy tables", () => {
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("academy_enrolments");
    expect(sql).toContain("academy_credentials");
    expect(sql).toContain("academy_assessment_attempts");
  });

  it("defines learner-own and public catalogue policies", () => {
    expect(sql).toContain("academy_enrolments_own");
    expect(sql).toContain("academy_course_versions_public_read");
    expect(sql).toContain("app.current_user_id");
  });

  it("does not FORCE RLS (so Prisma table owners keep working)", () => {
    expect(sql).not.toContain("FORCE ROW LEVEL SECURITY");
  });
});
