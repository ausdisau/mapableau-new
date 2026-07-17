import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { CAPABILITY_SEEDS } from "@/lib/convergence-os/seed/capabilities";
import { AT_CONTINUITY_PILOT_TEMPLATE } from "@/lib/mission-portfolio/contracts/mission-template";
import {
  AI_PROHIBITED_ACTIONS,
  isAiActionProhibited,
  PROHIBITED_SCORE_KINDS,
  STATE_HONESTY_CHAIN,
} from "@/lib/mission-portfolio/contracts/participant-rights";
import {
  MISSION_VERTICALS,
  SHARED_MISSION_FEATURES,
} from "@/lib/mission-portfolio/contracts/verticals";

const ROOT = path.resolve(__dirname, "../..");

describe("Mission Portfolio registry", () => {
  it("registers ten verticals with unique owners, flags, and disabled claims", () => {
    expect(MISSION_VERTICALS).toHaveLength(10);
    const keys = MISSION_VERTICALS.map((v) => v.key);
    expect(new Set(keys).size).toBe(10);
    const flags = MISSION_VERTICALS.map((v) => v.masterFlag);
    expect(new Set(flags).size).toBe(10);
    for (const vertical of MISSION_VERTICALS) {
      expect(vertical.publicClaimAllowed).toBe(false);
      expect(vertical.maturity).toBe("concept");
      expect(vertical.canonicalDependencies.length).toBeGreaterThan(0);
      expect(vertical.owner.length).toBeGreaterThan(0);
      expect(vertical.masterFlag.startsWith("MAPABLE_")).toBe(true);
    }
  });

  it("registers shared features with maturity and disabled public claims", () => {
    expect(SHARED_MISSION_FEATURES.length).toBe(10);
    for (const feature of SHARED_MISSION_FEATURES) {
      expect(feature.publicClaimAllowed).toBe(false);
      expect(feature.masterFlag.endsWith("_ENABLED")).toBe(true);
    }
  });

  it("mirrors vertical capability keys in ConvergenceOS seeds", () => {
    const seedKeys = new Set(CAPABILITY_SEEDS.map((c) => c.capabilityKey));
    expect(seedKeys.has("mission.framework")).toBe(true);
    expect(seedKeys.has("mission.service_standard")).toBe(true);
    expect(seedKeys.has("mission.service_diff")).toBe(true);
    for (const vertical of MISSION_VERTICALS) {
      expect(seedKeys.has(vertical.capabilityKey)).toBe(true);
      const seed = CAPABILITY_SEEDS.find(
        (c) => c.capabilityKey === vertical.capabilityKey,
      );
      expect(seed?.honesty.featureEnabled).toBe(false);
      expect(seed?.honesty.productionSupported).toBe(false);
      expect(seed?.productionClaimStatus).toBe("unsupported");
    }
  });

  it("does not introduce CareOSMission as a Prisma model on main", () => {
    const schema = fs.readFileSync(
      path.join(ROOT, "prisma/schema.prisma"),
      "utf8",
    );
    expect(schema).not.toMatch(/model\s+CareOSMission\b/);
    expect(schema).not.toMatch(/model\s+MissionInstance\b/);
  });

  it("ships mission portfolio docs", () => {
    for (const rel of [
      "docs/mission-portfolio/README.md",
      "docs/mission-portfolio/DOMAIN_OWNERSHIP.md",
      "docs/mission-portfolio/VERTICAL_REGISTRY.md",
      "docs/mission-portfolio/PARTICIPANT_RIGHTS.md",
      "docs/mission-portfolio/DELIVERY_WAVES.md",
      "docs/mission-portfolio/BUILD_PARTNER_DEFER.md",
    ]) {
      expect(fs.existsSync(path.join(ROOT, rel))).toBe(true);
    }
  });

  it("encodes participant rights and AI prohibitions", () => {
    expect(AI_PROHIBITED_ACTIONS).toContain("approve_claims");
    expect(AI_PROHIBITED_ACTIONS).toContain("contact_emergency_services");
    expect(isAiActionProhibited("assign_workers")).toBe(true);
    expect(isAiActionProhibited("summarise")).toBe(false);
    expect(PROHIBITED_SCORE_KINDS).toContain("loneliness");
    expect(STATE_HONESTY_CHAIN[0]).toBe("discovered");
    expect(STATE_HONESTY_CHAIN.at(-1)).toBe("participant_outcome");
  });

  it("keeps AT Continuity pilot template non-clinical", () => {
    expect(AT_CONTINUITY_PILOT_TEMPLATE.prohibitedActions).toEqual(
      expect.arrayContaining(["prescribe_equipment", "clinical_treatment"]),
    );
    expect(
      AT_CONTINUITY_PILOT_TEMPLATE.accessibilityContract
        .allowsSmartphoneOnlyPathway,
    ).toBe(false);
  });
});
