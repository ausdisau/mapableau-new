import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("Wave 13 migration and schema", () => {
  it("keeps the Wave 13 migration file present", () => {
    const migration = path.join(
      process.cwd(),
      "prisma/migrations/20260716310000_wave13_public_interest_governance/migration.sql",
    );
    expect(fs.existsSync(migration)).toBe(true);
  });

  it("keeps public-interest governance models in Prisma schema", () => {
    const schema = fs.readFileSync(
      path.join(process.cwd(), "prisma/schema.prisma"),
      "utf8",
    );
    expect(schema).toContain("model GovernedSystem");
    expect(schema).toContain("model AlgorithmRegisterEntry");
    expect(schema).toContain("model DecisionNotice");
    expect(schema).toContain("model AppealCase");
    expect(schema).toContain("model IndependentReview");
    expect(schema).toContain("model CommunityRecommendation");
  });
});
