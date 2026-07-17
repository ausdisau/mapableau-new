import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("AccessOps docs and config", () => {
  it("documents Wave 12 and mandatory disclaimers", () => {
    const doc = fs.readFileSync(
      path.join(process.cwd(), "docs/accessops/wave-12-accessops.md"),
      "utf8",
    );
    expect(doc).toMatch(/Accreditation is not live operational status/);
    expect(doc).toMatch(/Routes are advisory/);
  });

  it("adds disabled-by-default env flags and package scripts", () => {
    const env = fs.readFileSync(path.join(process.cwd(), ".env.example"), "utf8");
    expect(env).toMatch(/ACCESSOPS_OPEN_DATA_EXPORTS_ENABLED=false/);
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
    expect(pkg.scripts["accessops:evaluate"]).toContain("--dry-run");
  });
});
