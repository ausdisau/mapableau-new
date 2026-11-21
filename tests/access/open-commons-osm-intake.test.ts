import { describe, expect, it } from "vitest";

import {
  normaliseOsmAccessCandidate,
  proposeOsmSurveyQuestions,
} from "@/lib/access/open-commons/osm-access-candidate";
import { isOpenAccessCommonsPreviewEnabled } from "@/lib/access/open-commons/flags";

describe("Open Access Commons — OSM bridge", () => {
  it("is default-off and cannot run in production", () => {
    expect(isOpenAccessCommonsPreviewEnabled({})).toBe(false);
    expect(isOpenAccessCommonsPreviewEnabled({
      MAPABLE_OPEN_COMMONS_PREVIEW_ENABLED: "true",
      NODE_ENV: "test",
    })).toBe(true);
    expect(isOpenAccessCommonsPreviewEnabled({
      MAPABLE_OPEN_COMMONS_PREVIEW_ENABLED: "true",
      VERCEL_ENV: "production",
    })).toBe(false);
  });

  it("preserves OSM lineage without inferring physical access", () => {
    const result = normaliseOsmAccessCandidate({
      type: "way", id: 123, version: 2,
      timestamp: "2026-11-01T10:00:00Z",
      tags: { wheelchair: "yes", surface: "asphalt", incline: "5%" },
    });
    expect(result.sourceUrl).toBe("https://www.openstreetmap.org/way/123");
    expect(result.sourceLicence).toBe("ODbL-1.0");
    expect(result.sourceLastEditedAt).toBe("2026-11-01T10:00:00.000Z");
    expect(result.observedAt).toBeNull();
    expect(result.verificationState).toBe("not_assessed");
    expect(result.routeSafety).toBe("not_assessed");
    expect(result.participantSpecificFit).toBe("not_assessed");
    expect(result.sourceTags.map((tag) => tag.key)).toEqual([
      "wheelchair", "surface", "incline",
    ]);
    expect(result.autoPublishesToOsm).toBe(false);
  });

  it("rejects invalid object identifiers and types", () => {
    expect(() => normaliseOsmAccessCandidate({ type: "way", id: -1, tags: {} }))
      .toThrow("Invalid OSM element identifier");
    expect(() => normaliseOsmAccessCandidate({
      type: "node", id: Number.MAX_SAFE_INTEGER + 1, tags: {},
    })).toThrow("Invalid OSM element identifier");
    expect(() => normaliseOsmAccessCandidate({
      type: "invalid" as "node", id: 1, tags: {},
    })).toThrow("Invalid OSM element kind");
  });

  it("does not relay personal notes, addresses or contact fields", () => {
    const result = normaliseOsmAccessCandidate({
      type: "node", id: 9,
      tags: {
        wheelchair: "limited",
        note: "private support arrangements",
        "health:diagnosis": "never share",
        "contact:phone": "private number",
        width: "x".repeat(100),
      },
    });
    expect(result.sourceTags.map((tag) => tag.key)).toEqual(["wheelchair"]);
    expect(JSON.stringify(result)).not.toContain("private support");
    expect(JSON.stringify(result)).not.toContain("health:diagnosis");
  });

  it("preserves unknown as unknown", () => {
    const candidate = normaliseOsmAccessCandidate({
      type: "relation", id: 15, tags: { wheelchair: "unknown" },
    });
    expect(candidate.sourceTags[0]?.rawValue).toBe("unknown");
    expect(candidate.routeSafety).toBe("not_assessed");
  });

  it("suggests relevant crossing questions without writing to OSM", () => {
    const candidate = normaliseOsmAccessCandidate({
      type: "way", id: 300, tags: { highway: "crossing" },
    });
    const questions = proposeOsmSurveyQuestions(candidate);
    expect(questions.map((q) => q.focusTag)).toEqual(["kerb", "tactile_paving"]);
    expect(questions.every((q) => q.autoWrite === false)).toBe(true);
    expect(questions[0]?.question).toContain("unknown or skip");
  });

  it("only asks for missing path attributes", () => {
    const candidate = normaliseOsmAccessCandidate({
      type: "way", id: 42, tags: { highway: "footway", surface: "concrete" },
    });
    expect(proposeOsmSurveyQuestions(candidate).map((q) => q.focusTag)).toEqual(["incline"]);
  });

  it("does not create ungrounded questions without a path or entrance context", () => {
    const candidate = normaliseOsmAccessCandidate({
      type: "node", id: 18, tags: { wheelchair: "yes" },
    });
    expect(proposeOsmSurveyQuestions(candidate)).toEqual([]);
  });

  it("does not mistake source edits for accessibility observations", () => {
    const candidate = normaliseOsmAccessCandidate({
      type: "node", id: 19, timestamp: "bad input", tags: { kerb: "flush" },
    });
    expect(candidate.sourceLastEditedAt).toBeNull();
    expect(candidate.observedAt).toBeNull();
  });
});
