import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("AccessOps migration and schema", () => {
  it("includes AccessOps schema models", () => {
    const schema = fs.readFileSync(path.join(process.cwd(), "prisma/schema.prisma"), "utf8");
    expect(schema).toMatch(/model AccessAsset \{/);
    expect(schema).toMatch(/model AccessStatusEvent \{/);
    expect(schema).toMatch(/model AccessOpsPartnerClient \{/);
  });

  it("includes the Wave 12 migration", () => {
    const migration = path.join(
      process.cwd(),
      "prisma/migrations/20260716300000_wave12_accessops_civic_digital_twin",
      "migration.sql",
    );
    expect(fs.existsSync(migration)).toBe(true);
  });
});
