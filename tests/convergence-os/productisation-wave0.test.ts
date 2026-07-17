import { describe, expect, it } from "vitest";
import { CAPABILITY_SEEDS } from "@/lib/convergence-os/seed/capabilities";
import {
  PR_ACTION_LEDGER,
  SUPERSEDED_CLOSE_TARGETS,
  assertSupersededCloseTargetsInLedger,
  ledgerEntriesByAction,
} from "@/lib/convergence-os/seed/pr-action-ledger";
import {
  PUBLIC_CLAIM_REGISTRY,
  assertNoProductionClaimsWithoutEvidence,
} from "@/lib/convergence-os/seed/public-claims";
import { PRODUCTISATION_MERGE_TRAIN } from "@/lib/convergence-os/trains/productisation-merge-train";
import { FOUNDATION_MERGE_TRAIN } from "@/lib/convergence-os/trains/foundation-merge-train";
import { readdirSync } from "node:fs";
import { join } from "node:path";

describe("Productisation Wave 0 registries", () => {
  it("keeps foundation train and adds productisation train", () => {
    expect(FOUNDATION_MERGE_TRAIN.trainKey).toBe("foundation_governance_prep_v1");
    expect(PRODUCTISATION_MERGE_TRAIN.trainKey).toBe(
      "productisation_connected_service_v1",
    );
    expect(PRODUCTISATION_MERGE_TRAIN.trainType).toBe("PRODUCTISATION");
    expect(PRODUCTISATION_MERGE_TRAIN.steps.length).toBeGreaterThanOrEqual(15);
  });

  it("requires superseded PRs to be close actions", () => {
    expect(() => assertSupersededCloseTargetsInLedger()).not.toThrow();
    for (const n of SUPERSEDED_CLOSE_TARGETS) {
      const entry = PR_ACTION_LEDGER.find((e) => e.number === n);
      expect(entry?.action).toBe("close");
      expect(entry?.productionClaimAllowed).toBe(false);
    }
    expect(ledgerEntriesByAction("close").map((e) => e.number).sort()).toEqual(
      [...SUPERSEDED_CLOSE_TARGETS].sort(),
    );
  });

  it("forbids public production claims without maturity evidence", () => {
    expect(() => assertNoProductionClaimsWithoutEvidence()).not.toThrow();
    expect(PUBLIC_CLAIM_REGISTRY.every((c) => !c.publicClaimAllowed)).toBe(true);
    expect(
      PUBLIC_CLAIM_REGISTRY.some((c) =>
        c.prohibitedWording.some((w) => w.toLowerCase().includes("guaranteed")),
      ),
    ).toBe(true);
  });

  it("records honest maturity for productisation capabilities", () => {
    const readiness = CAPABILITY_SEEDS.find(
      (c) => c.capabilityKey === "workforce.readiness",
    );
    const companion = CAPABILITY_SEEDS.find(
      (c) => c.capabilityKey === "mobile.companion",
    );
    const ops = CAPABILITY_SEEDS.find(
      (c) => c.capabilityKey === "provider.ops_attention",
    );
    const passport = CAPABILITY_SEEDS.find(
      (c) => c.capabilityKey === "communication.passport",
    );
    expect(readiness?.honesty.productionSupported).toBe(false);
    expect(companion?.honesty.productionSupported).toBe(false);
    expect(ops?.readWrite).toBe("read");
    expect(passport?.participantApprovalRequired).toBe(true);
  });

  it("has unique capability keys", () => {
    const keys = CAPABILITY_SEEDS.map((c) => c.capabilityKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("has unique migration directory timestamps under prisma/migrations", () => {
    const root = join(process.cwd(), "prisma/migrations");
    const dirs = readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory() && /^\d{14}/.test(d.name))
      .map((d) => d.name.slice(0, 14));
    const unique = new Set(dirs);
    expect(unique.size).toBe(dirs.length);
  });

  it("merge train closes superseded before product merges", () => {
    const closeSteps = PRODUCTISATION_MERGE_TRAIN.steps.filter((s) =>
      s.action.startsWith("close"),
    );
    const firstProduct = PRODUCTISATION_MERGE_TRAIN.steps.find(
      (s) => s.prNumber === 310 || s.prNumber === 273,
    );
    expect(closeSteps.length).toBeGreaterThanOrEqual(4);
    expect(closeSteps[0]!.stepOrder).toBeLessThan(firstProduct!.stepOrder);
  });
});
