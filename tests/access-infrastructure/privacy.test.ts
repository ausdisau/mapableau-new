import { describe, expect, it } from "vitest";

import { readFileSync } from "fs";
import { join } from "path";

/**
 * Static privacy guards for Access Passport leakage.
 * Runtime auth tests exercise requireApiSession; these ensure public place
 * capability handlers never reference passport fields.
 */
describe("Access Passport privacy contracts", () => {
  it("public place capabilities route does not load passport", () => {
    const src = readFileSync(
      join(
        process.cwd(),
        "app/api/access-infrastructure/places/[placeId]/capabilities/route.ts",
      ),
      "utf8",
    );
    expect(src).not.toMatch(/getOrCreateAccessPassport|getAccessPassportForUser|AccessPassport/);
    expect(src).not.toMatch(/getOrCreateAccessPassport|passport\.requirements/);
    expect(src).toMatch(/Never include Access Passport/i);
  });

  it("passport route requires API session", () => {
    const src = readFileSync(
      join(process.cwd(), "app/api/access-infrastructure/passport/route.ts"),
      "utf8",
    );
    expect(src).toMatch(/requireApiSession/);
    expect(src).toMatch(/owner-only/i);
  });

  it("compatibility response always sets decisionOwner PARTICIPANT", () => {
    const src = readFileSync(
      join(
        process.cwd(),
        "lib/access/infrastructure/compatibility-engine.ts",
      ),
      "utf8",
    );
    expect(src).toMatch(/decisionOwner:\s*"PARTICIPANT"/);
  });

  it("flags default off (env truthy only)", () => {
    const src = readFileSync(
      join(process.cwd(), "lib/access/infrastructure/flags.ts"),
      "utf8",
    );
    expect(src).toMatch(/envTruthy/);
    expect(src).not.toMatch(/return true/);
  });
});
