import { describe, expect, it } from "vitest";

import {
  computePairwiseSubjectId,
  isProhibitedRawSubject,
} from "@/lib/identity-federation/privacy";

describe("pairwise subject identifiers", () => {
  it("differs per verifier for the same participant", () => {
    const a = computePairwiseSubjectId({
      participantId: "participant-1",
      entityId: "verifier-a",
    });
    const b = computePairwiseSubjectId({
      participantId: "participant-1",
      entityId: "verifier-b",
    });
    expect(a).not.toEqual(b);
  });

  it("is stable per (participant, entity)", () => {
    const a1 = computePairwiseSubjectId({
      participantId: "participant-1",
      entityId: "verifier-a",
    });
    const a2 = computePairwiseSubjectId({
      participantId: "participant-1",
      entityId: "verifier-a",
    });
    expect(a1).toEqual(a2);
  });

  it("differs per participant against the same verifier", () => {
    const a = computePairwiseSubjectId({
      participantId: "participant-1",
      entityId: "verifier-a",
    });
    const b = computePairwiseSubjectId({
      participantId: "participant-2",
      entityId: "verifier-a",
    });
    expect(a).not.toEqual(b);
  });
});

describe("prohibited raw subject detection", () => {
  it("flags raw user IDs (u_ prefix)", () => {
    expect(isProhibitedRawSubject("u_abc123")).toBe(true);
  });

  it("flags user_ prefixed IDs", () => {
    expect(isProhibitedRawSubject("user_abc123")).toBe(true);
  });

  it("flags email addresses", () => {
    expect(isProhibitedRawSubject("alice@example.com")).toBe(true);
  });

  it("flags NDIS-shaped 9-11 digit numbers", () => {
    expect(isProhibitedRawSubject("430123456")).toBe(true);
    expect(isProhibitedRawSubject("43012345678")).toBe(true);
  });

  it("does not flag opaque pairwise hashes", () => {
    const hash = computePairwiseSubjectId({
      participantId: "p",
      entityId: "e",
    });
    expect(isProhibitedRawSubject(hash)).toBe(false);
  });
});
