import { describe, expect, it } from "vitest";

import {
  provenanceToRoutingCompatibility,
  sourceClassToEvidenceProvenance,
} from "@mapable/contracts";
import { mapConclusionToCompatibility } from "@/lib/access/infrastructure/compatibility";
import { getHarbourGraph, projectGraphToList } from "@/lib/access/intelligence-next";

describe("false-safe unknown vs inaccessible routing projection", () => {
  it("maps unknown and stale provenance to uncertain routing compatibility", () => {
    expect(provenanceToRoutingCompatibility("unknown")).toBe("uncertain");
    expect(provenanceToRoutingCompatibility("stale")).toBe("uncertain");
    expect(provenanceToRoutingCompatibility("inferred")).toBe("uncertain");
  });

  it("does not treat unknown as incompatible without positive evidence", () => {
    expect(
      provenanceToRoutingCompatibility("unknown", true),
    ).toBe("uncertain");
    expect(
      provenanceToRoutingCompatibility("verified", true),
    ).toBe("incompatible");
  });

  it("maps infrastructure conclusion states unknown-not-inaccessible", () => {
    expect(mapConclusionToCompatibility("operational_status_unknown")).toBe(
      "uncertain",
    );
    expect(mapConclusionToCompatibility("stale")).toBe("uncertain");
    expect(mapConclusionToCompatibility("cannot_confirm")).toBe("uncertain");
    expect(mapConclusionToCompatibility("incompatible")).toBe("incompatible");
  });

  it("exposes routing uncertainty on graph list items with unknown temporal state", () => {
    const graph = getHarbourGraph();
    const items = projectGraphToList(graph);
    const unknownLift = items.find((item) =>
      item.label.toLowerCase().includes("lift"),
    );

    expect(unknownLift).toBeDefined();
    expect(unknownLift?.temporalState).toBe("unknown");
    expect(unknownLift?.provenance.routingUncertainty).toBe(true);
    expect(unknownLift?.provenance.provenance).toBe("unknown");
  });

  it("never auto-promotes AI source class to verified provenance", () => {
    expect(sourceClassToEvidenceProvenance("ai_inferred")).toBe("inferred");
    expect(sourceClassToEvidenceProvenance("ai_inferred")).not.toBe("verified");
  });
});
