import { describe, expect, it } from "vitest";

import { bridgeRagToCompatibilityDisplay } from "@/lib/access/signals/compatibility-bridge";
import { isAccessSignalsEnabled } from "@/lib/access/signals/flags";
import { importGaisLegacyRow } from "@/lib/access/signals/gais-compatibility";
import {
  makeSyntheticRemediationQueue,
  remediationImpliesGreen,
} from "@/lib/access/signals/remediation";

describe("Access Signals flags, GAIS, remediation", () => {
  it("defaults off and production hard-off", () => {
    expect(
      isAccessSignalsEnabled({} as NodeJS.ProcessEnv),
    ).toBe(false);
    expect(
      isAccessSignalsEnabled({
        MAPABLE_ACCESS_SIGNALS_ENABLED: "true",
        NODE_ENV: "production",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe(false);
    expect(
      isAccessSignalsEnabled({
        MAPABLE_ACCESS_SIGNALS_ENABLED: "true",
        VERCEL_ENV: "production",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe(false);
    expect(
      isAccessSignalsEnabled({
        MAPABLE_ACCESS_SIGNALS_ENABLED: "true",
        NODE_ENV: "development",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe(true);
  });

  it("GAIS legacy imports are Unknown + unverified_legacy_import", () => {
    const result = importGaisLegacyRow({
      sourceRecordId: "src-1",
      kind: "feature",
      geometryPresent: true,
    });
    expect(result.accepted).toBe(true);
    expect(result.evaluation?.status).toBe("unknown");
    expect(result.observation?.flags).toContain("unverified_legacy_import");
  });

  it("rejects aggregate rows and never Greens icon-only or layer hints", () => {
    expect(
      importGaisLegacyRow({
        sourceRecordId: "agg",
        kind: "aggregate",
        geometryPresent: false,
      }).accepted,
    ).toBe(false);
    expect(
      importGaisLegacyRow({
        sourceRecordId: "icon",
        kind: "icon_only",
        geometryPresent: false,
      }).evaluation?.status,
    ).toBe("unknown");
    expect(
      importGaisLegacyRow({
        sourceRecordId: "stairs",
        kind: "feature",
        layerHint: "stairs soft profile",
        geometryPresent: true,
      }).evaluation?.status,
    ).toBe("unknown");
  });

  it("compatibility bridge never writes records", () => {
    for (const rag of ["red", "amber", "green", "unknown"] as const) {
      expect(bridgeRagToCompatibilityDisplay(rag).writesCompatibilityRecord).toBe(
        false,
      );
    }
  });

  it("closed remediation never implies Green", () => {
    const closed = makeSyntheticRemediationQueue().find(
      (item) => item.status === "closed",
    )!;
    expect(remediationImpliesGreen(closed)).toBe(false);
    expect(closed.requiresFollowUpAssessment).toBe(true);
  });
});
