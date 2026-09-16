import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  assertGovernedCategory,
  clearAgencyMemoryStore,
  communicationPreferenceValue,
  confirmMemory,
  deleteMemory,
  detectConflicts,
  exportAgencyMemory,
  getAgencyMemorySnapshot,
  getAuditVersions,
  getMemoryItem,
  inferEdgesFromCorrelation,
  isProhibitedCategory,
  listUsableForPersonalisation,
  proposeMemory,
  providerExclusionRespected,
  rebuildPreferenceGraph,
  retrieveScopedMemory,
  revokeMemory,
  updateControls,
} from "@/lib/ai/platform/agency-memory";
import { buildAgencyMemoryContextSlice } from "@/lib/ai/platform/context-fabric";

describe("Agency Memory — core governance", () => {
  beforeEach(() => {
    clearAgencyMemoryStore();
    process.env.MAPABLE_AGENCY_MEMORY_ENABLED = "true";
    process.env.MAPABLE_AGENCY_MEMORY_MODEL_CONTEXT_ENABLED = "true";
  });

  afterEach(() => {
    clearAgencyMemoryStore();
    delete process.env.MAPABLE_AGENCY_MEMORY_ENABLED;
    delete process.env.MAPABLE_AGENCY_MEMORY_MODEL_CONTEXT_ENABLED;
    delete process.env.MAPABLE_CONTEXT_FABRIC_ENABLED;
  });

  it("model inference cannot persist as confirmed preference", () => {
    expect(() =>
      proposeMemory({
        participantId: "p1",
        tenantId: "t1",
        actorId: "p1",
        category: "communication",
        statement: "Prefers SMS (model guess)",
        source: "model_proposed",
        consentScopes: ["profile.write"],
        visibility: "participant_only",
        evidenceRefs: [],
        autoConfirmIfParticipantExplicit: true,
      }),
    ).toThrow(/INFERENCE_CANNOT_CONFIRM/);

    const proposed = proposeMemory({
      participantId: "p1",
      tenantId: "t1",
      actorId: "p1",
      category: "communication",
      statement: "Prefers SMS (model guess)",
      source: "model_proposed",
      consentScopes: ["profile.write"],
      visibility: "participant_only",
      evidenceRefs: [],
      autoConfirmIfParticipantExplicit: false,
    });
    expect(proposed.confirmationState).toBe("proposed");
    expect(
      listUsableForPersonalisation({
        participantId: "p1",
        tenantId: "t1",
      }),
    ).toHaveLength(0);
  });

  it("participant confirmation enables personalisation use", () => {
    const proposed = proposeMemory({
      participantId: "p1",
      tenantId: "t1",
      actorId: "p1",
      category: "communication",
      statement: "Please contact me by SMS",
      source: "model_proposed",
      consentScopes: ["profile.write"],
      visibility: "participant_only",
      evidenceRefs: [],
      autoConfirmIfParticipantExplicit: false,
    });
    const confirmed = confirmMemory({
      memoryId: proposed.memoryId,
      participantId: "p1",
      tenantId: "t1",
      actorId: "p1",
    });
    expect(confirmed.confirmationState).toBe("confirmed");
    expect(confirmed.source).toBe("participant_confirmed");
    const usable = listUsableForPersonalisation({
      participantId: "p1",
      tenantId: "t1",
    });
    expect(usable).toHaveLength(1);
    expect(usable[0]!.memoryId).toBe(proposed.memoryId);
  });

  it("revocation removes future personalisation use", () => {
    const item = proposeMemory({
      participantId: "p1",
      tenantId: "t1",
      actorId: "p1",
      category: "transport",
      statement: "I need a wheelchair-accessible vehicle",
      source: "participant_explicit",
      consentScopes: ["transport.manage"],
      visibility: "participant_only",
      evidenceRefs: [],
      autoConfirmIfParticipantExplicit: true,
    });
    expect(item.confirmationState).toBe("confirmed");
    revokeMemory({
      memoryId: item.memoryId,
      participantId: "p1",
      tenantId: "t1",
      actorId: "p1",
    });
    expect(
      listUsableForPersonalisation({
        participantId: "p1",
        tenantId: "t1",
      }),
    ).toHaveLength(0);
  });

  it("deletion works and preserves audit metadata versions", () => {
    const item = proposeMemory({
      participantId: "p1",
      tenantId: "t1",
      actorId: "p1",
      category: "access",
      statement: "I use a mobility aid",
      source: "participant_explicit",
      consentScopes: ["profile.write"],
      visibility: "participant_only",
      evidenceRefs: [],
      autoConfirmIfParticipantExplicit: true,
    });
    deleteMemory({
      memoryId: item.memoryId,
      participantId: "p1",
      tenantId: "t1",
      actorId: "p1",
    });
    const after = getMemoryItem({
      memoryId: item.memoryId,
      participantId: "p1",
      tenantId: "t1",
    });
    expect(after?.deletedAt).toBeTruthy();
    const audit = getAuditVersions(item.memoryId);
    expect(audit.length).toBeGreaterThanOrEqual(1);
    expect(
      listUsableForPersonalisation({
        participantId: "p1",
        tenantId: "t1",
      }),
    ).toHaveLength(0);
  });

  it("provider exclusion is respected", () => {
    proposeMemory({
      participantId: "p1",
      tenantId: "t1",
      actorId: "p1",
      category: "provider_exclusion",
      statement: "Do not use Provider Acme",
      structuredValue: { providerId: "provider-acme" },
      source: "participant_explicit",
      consentScopes: ["profile.write"],
      visibility: "participant_only",
      evidenceRefs: [],
      autoConfirmIfParticipantExplicit: true,
    });
    const usable = listUsableForPersonalisation({
      participantId: "p1",
      tenantId: "t1",
    });
    expect(providerExclusionRespected(usable, "provider-acme")).toBe(true);
    expect(providerExclusionRespected(usable, "provider-other")).toBe(false);
  });

  it("communication preference is respected", () => {
    proposeMemory({
      participantId: "p1",
      tenantId: "t1",
      actorId: "p1",
      category: "communication",
      statement: "Prefer email",
      structuredValue: { key: "preferred_contact_method", value: "email" },
      source: "participant_explicit",
      consentScopes: ["profile.write"],
      visibility: "participant_only",
      evidenceRefs: [],
      autoConfirmIfParticipantExplicit: true,
    });
    const usable = listUsableForPersonalisation({
      participantId: "p1",
      tenantId: "t1",
    });
    expect(communicationPreferenceValue(usable)).toBe("email");
  });

  it("delegate cannot exceed authority / family opinion is not preference", () => {
    expect(() =>
      proposeMemory({
        participantId: "p1",
        tenantId: "t1",
        actorId: "family-1",
        category: "privacy",
        statement: "Family thinks they prefer phone",
        source: "delegate_proposed",
        consentScopes: [],
        visibility: "participant_only",
        evidenceRefs: [],
        autoConfirmIfParticipantExplicit: false,
        delegate: {
          delegateId: "family-1",
          authorityDomain: "finance",
          requiresParticipantConfirmation: true,
          suppliedAs: "delegate_opinion",
        },
      }),
    ).toThrow(/DELEGATE_EXCEEDS_AUTHORITY/);

    const opinion = proposeMemory({
      participantId: "p1",
      tenantId: "t1",
      actorId: "family-1",
      category: "care",
      statement: "Mum thinks morning visits are better",
      source: "delegate_proposed",
      consentScopes: ["care.manage"],
      visibility: "participant_and_authorised_delegate",
      evidenceRefs: [],
      autoConfirmIfParticipantExplicit: true,
      delegate: {
        delegateId: "family-1",
        authorityDomain: "care",
        requiresParticipantConfirmation: true,
        suppliedAs: "delegate_opinion",
      },
    });
    expect(opinion.confirmationState).toBe("proposed");
    expect(
      listUsableForPersonalisation({
        participantId: "p1",
        tenantId: "t1",
      }),
    ).toHaveLength(0);
  });

  it("Jobs disclosure preference remains purpose-specific", () => {
    expect(() =>
      proposeMemory({
        participantId: "p1",
        tenantId: "t1",
        actorId: "p1",
        category: "disclosure",
        statement: "Do not disclose disability on applications",
        source: "participant_explicit",
        consentScopes: ["jobs.preferences"],
        visibility: "participant_only",
        evidenceRefs: [],
        autoConfirmIfParticipantExplicit: true,
      }),
    ).toThrow(/PURPOSE_REQUIRED/);

    proposeMemory({
      participantId: "p1",
      tenantId: "t1",
      actorId: "p1",
      category: "disclosure",
      statement: "Do not disclose disability on applications",
      purpose: "job_application_acme",
      source: "participant_explicit",
      consentScopes: ["jobs.preferences"],
      visibility: "participant_only",
      evidenceRefs: [],
      autoConfirmIfParticipantExplicit: true,
    });

    expect(
      listUsableForPersonalisation({
        participantId: "p1",
        tenantId: "t1",
      }),
    ).toHaveLength(0);

    expect(
      listUsableForPersonalisation({
        participantId: "p1",
        tenantId: "t1",
        purposes: ["job_application_acme"],
      }),
    ).toHaveLength(1);

    expect(
      listUsableForPersonalisation({
        participantId: "p1",
        tenantId: "t1",
        purposes: ["unrelated_purpose"],
      }),
    ).toHaveLength(0);
  });

  it("AI disabled still allows manual preference management", () => {
    updateControls({
      participantId: "p1",
      tenantId: "t1",
      actorId: "p1",
      aiUseDisabled: true,
    });
    const item = proposeMemory({
      participantId: "p1",
      tenantId: "t1",
      actorId: "p1",
      category: "interaction",
      statement: "Use plain language",
      source: "participant_explicit",
      consentScopes: ["profile.write"],
      visibility: "participant_only",
      evidenceRefs: [],
      autoConfirmIfParticipantExplicit: true,
    });
    expect(item.confirmationState).toBe("confirmed");
    expect(
      listUsableForPersonalisation({
        participantId: "p1",
        tenantId: "t1",
        forModelContext: true,
      }),
    ).toHaveLength(0);
    expect(
      listUsableForPersonalisation({
        participantId: "p1",
        tenantId: "t1",
        forModelContext: false,
      }),
    ).toHaveLength(1);
  });

  it("memory graph is inaccessible cross-tenant", () => {
    proposeMemory({
      participantId: "p1",
      tenantId: "tenant-a",
      actorId: "p1",
      category: "communication",
      statement: "SMS only",
      source: "participant_explicit",
      consentScopes: ["profile.write"],
      visibility: "participant_only",
      evidenceRefs: [],
      autoConfirmIfParticipantExplicit: true,
    });
    expect(
      listUsableForPersonalisation({
        participantId: "p1",
        tenantId: "tenant-b",
      }),
    ).toHaveLength(0);
    expect(
      rebuildPreferenceGraph({
        participantId: "p1",
        tenantId: "tenant-b",
      }).edges,
    ).toHaveLength(0);
  });

  it("rejects prohibited inferred trait categories", () => {
    expect(isProhibitedCategory("personality")).toBe(true);
    expect(isProhibitedCategory("capacity")).toBe(true);
    expect(isProhibitedCategory("loneliness")).toBe(true);
    expect(isProhibitedCategory("deservingness")).toBe(true);
    expect(() => assertGovernedCategory("motivation")).toThrow(
      /PROHIBITED_CATEGORY/,
    );
    expect(() => assertGovernedCategory("risk_tolerance")).toThrow(
      /PROHIBITED_CATEGORY/,
    );
    expect(() =>
      proposeMemory({
        participantId: "p1",
        tenantId: "t1",
        actorId: "p1",
        // @ts-expect-error intentional prohibited category probe
        category: "personality",
        statement: "Outgoing",
        source: "model_proposed",
        consentScopes: [],
        visibility: "participant_only",
        evidenceRefs: [],
        autoConfirmIfParticipantExplicit: false,
      }),
    ).toThrow(/PROHIBITED_CATEGORY|CATEGORY_NOT_ALLOWED/);
  });

  it("does not infer preference graph edges from correlation", () => {
    expect(() => inferEdgesFromCorrelation()).toThrow(
      /INFERRED_EDGES_FORBIDDEN/,
    );
  });

  it("surfaces conflicts when semantics are unclear", () => {
    proposeMemory({
      participantId: "p1",
      tenantId: "t1",
      actorId: "p1",
      category: "communication",
      statement: "Call me",
      source: "participant_explicit",
      consentScopes: ["profile.write"],
      visibility: "participant_only",
      evidenceRefs: [],
      autoConfirmIfParticipantExplicit: true,
    });
    proposeMemory({
      participantId: "p1",
      tenantId: "t1",
      actorId: "p1",
      category: "communication",
      statement: "Never call me",
      source: "participant_explicit",
      consentScopes: ["profile.write"],
      visibility: "participant_only",
      evidenceRefs: [],
      autoConfirmIfParticipantExplicit: true,
    });
    // Different statements — no automatic conflict on statement equality.
    // Same structured key conflict:
    proposeMemory({
      participantId: "p2",
      tenantId: "t1",
      actorId: "p2",
      category: "communication",
      statement: "SMS",
      structuredValue: { key: "preferred_contact_method", value: "sms" },
      source: "participant_explicit",
      consentScopes: ["profile.write"],
      visibility: "participant_only",
      evidenceRefs: [],
      autoConfirmIfParticipantExplicit: true,
    });
    proposeMemory({
      participantId: "p2",
      tenantId: "t1",
      actorId: "p2",
      category: "communication",
      statement: "Email",
      structuredValue: { key: "preferred_contact_method", value: "email" },
      source: "participant_explicit",
      consentScopes: ["profile.write"],
      visibility: "participant_only",
      evidenceRefs: [],
      autoConfirmIfParticipantExplicit: true,
    });
    const conflicts = detectConflicts({
      participantId: "p2",
      tenantId: "t1",
    });
    expect(conflicts.some((c) => c.resolution === "most_recent_supersedes")).toBe(
      true,
    );
  });

  it("Context Fabric injects only scoped confirmed memory", () => {
    process.env.MAPABLE_CONTEXT_FABRIC_ENABLED = "true";
    proposeMemory({
      participantId: "p1",
      tenantId: "t1",
      actorId: "p1",
      category: "communication",
      statement: "SMS please",
      source: "participant_explicit",
      consentScopes: ["profile.write"],
      visibility: "participant_only",
      evidenceRefs: [],
      autoConfirmIfParticipantExplicit: true,
    });
    proposeMemory({
      participantId: "p1",
      tenantId: "t1",
      actorId: "p1",
      category: "care",
      statement: "Morning visits",
      source: "model_proposed",
      consentScopes: ["care.manage"],
      visibility: "participant_only",
      evidenceRefs: [],
      autoConfirmIfParticipantExplicit: false,
    });
    const bundle = buildAgencyMemoryContextSlice({
      participantId: "p1",
      tenantId: "t1",
      maxItems: 8,
    });
    expect(bundle.records).toHaveLength(1);
    expect(String(bundle.records[0]!.payload.statement)).toContain("SMS");
  });

  it("scoped retrieval never returns full graph dump", () => {
    for (let i = 0; i < 12; i++) {
      proposeMemory({
        participantId: "p1",
        tenantId: "t1",
        actorId: "p1",
        category: "interaction",
        statement: `Pref ${i}`,
        source: "participant_explicit",
        consentScopes: ["profile.write"],
        visibility: "participant_only",
        evidenceRefs: [],
        autoConfirmIfParticipantExplicit: true,
      });
    }
    const scoped = retrieveScopedMemory({
      participantId: "p1",
      tenantId: "t1",
      maxItems: 5,
    });
    expect(scoped.length).toBeLessThanOrEqual(5);
  });

  it("snapshot presentation includes required My MapAble sections", () => {
    proposeMemory({
      participantId: "p1",
      tenantId: "t1",
      actorId: "p1",
      category: "privacy",
      statement: "Keep my preferences private",
      source: "participant_explicit",
      consentScopes: ["privacy.preferences"],
      visibility: "participant_only",
      evidenceRefs: [],
      autoConfirmIfParticipantExplicit: true,
    });
    const snap = getAgencyMemorySnapshot({
      participantId: "p1",
      tenantId: "t1",
    });
    const titles = snap.presentation.sections.map((s) => s.title);
    expect(titles).toEqual(
      expect.arrayContaining([
        "My Preferences",
        "What MapAble Remembers",
        "Why",
        "Where Used",
        "Who Can See",
      ]),
    );
  });

  it("export includes confirmed memory in structured and human-readable form", () => {
    proposeMemory({
      participantId: "p1",
      tenantId: "t1",
      actorId: "p1",
      category: "transport",
      statement: "Need hoist vehicle",
      source: "participant_explicit",
      consentScopes: ["transport.manage"],
      visibility: "participant_only",
      evidenceRefs: [],
      autoConfirmIfParticipantExplicit: true,
    });
    const bundle = exportAgencyMemory({
      participantId: "p1",
      tenantId: "t1",
    });
    expect(bundle.items).toHaveLength(1);
    expect(bundle.humanReadable).toContain("Need hoist vehicle");
    expect(bundle.graph.edges.every((e) => e.explicit)).toBe(true);
  });
});
