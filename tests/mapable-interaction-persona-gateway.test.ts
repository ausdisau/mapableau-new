import { describe, expect, it } from "vitest";

describe("MapAble Persona Kernel", () => {
  it("keeps AI identity, participant-approved memory and anti-dependency boundaries explicit", async () => {
    const { buildMapAblePersonaProfile } = await import(
      "@/lib/interaction/persona-kernel"
    );

    const profile = buildMapAblePersonaProfile(null);

    expect(profile.identity.aiDisclosureRequired).toBe(true);
    expect(profile.memory.source).toBe("participant_approved_only");
    expect(profile.memory.inferEmotionalStateForStorage).toBe(false);
    expect(profile.relationship.noExclusivity).toBe(true);
    expect(profile.relationship.noJealousyOrNeediness).toBe(true);
    expect(profile.relationship.humanRelationshipsWelcome).toBe(true);
    expect(profile.authority.execution).toBe("mapable_governed_only");
  });

  it("adapts presentation from existing participant setup without inferring ability", async () => {
    const { buildMapAblePersonaProfile } = await import(
      "@/lib/interaction/persona-kernel"
    );

    const profile = buildMapAblePersonaProfile({
      informationDensity: "simpler",
      interfaceMethods: ["AAC", "keyboard", "voice"],
    });

    expect(profile.communication.informationDensity).toBe("simpler");
    expect(profile.communication.interfaceMethods).toEqual([
      "AAC",
      "keyboard",
      "voice",
    ]);
    expect(profile.communication.adaptationBasis).toBe("participant_preference_only");
  });
});

describe("MapAble Interaction Gateway", () => {
  it("requires explicit external voice-processing consent before selecting ElevenLabs", async () => {
    const { planInteractionSession } = await import(
      "@/lib/interaction/session-planner"
    );

    const plan = planInteractionSession({
      requestedModality: "voice",
      preferredVoiceProvider: "elevenlabs_speech_engine",
      externalVoiceProcessingConsent: false,
      allowVoiceProviderFallback: false,
      providers: {
        elevenlabs: { enabled: true, configured: true },
        openaiRealtime: { enabled: true, configured: true },
      },
    });

    expect(plan.status).toBe("requires_consent");
    expect(plan.provider).toBeNull();
    expect(plan.externalProcessing).toBe(false);
    expect(plan.executionAuthority).toBe("mapable_governed_only");
  });

  it("selects ElevenLabs Speech Engine when it is explicitly preferred, consented and configured", async () => {
    const { planInteractionSession } = await import(
      "@/lib/interaction/session-planner"
    );

    const plan = planInteractionSession({
      requestedModality: "voice",
      preferredVoiceProvider: "elevenlabs_speech_engine",
      externalVoiceProcessingConsent: true,
      allowVoiceProviderFallback: false,
      providers: {
        elevenlabs: { enabled: true, configured: true },
        openaiRealtime: { enabled: true, configured: true },
      },
    });

    expect(plan.status).toBe("ready");
    expect(plan.provider).toBe("elevenlabs_speech_engine");
    expect(plan.transport).toBe("webrtc_ephemeral_token");
    expect(plan.externalProcessing).toBe(true);
    expect(plan.browserCredentialPolicy).toBe("ephemeral_only");
  });

  it("does not silently switch voice vendors when the preferred provider is unavailable", async () => {
    const { planInteractionSession } = await import(
      "@/lib/interaction/session-planner"
    );

    const plan = planInteractionSession({
      requestedModality: "voice",
      preferredVoiceProvider: "elevenlabs_speech_engine",
      externalVoiceProcessingConsent: true,
      allowVoiceProviderFallback: false,
      providers: {
        elevenlabs: { enabled: false, configured: false },
        openaiRealtime: { enabled: true, configured: true },
      },
    });

    expect(plan.status).toBe("provider_unavailable");
    expect(plan.provider).toBeNull();
    expect(plan.suggestedFallback).toBe("text");
  });

  it("keeps text and AAC paths inside MapAble without external voice processing", async () => {
    const { planInteractionSession } = await import(
      "@/lib/interaction/session-planner"
    );

    for (const requestedModality of ["text", "aac"] as const) {
      const plan = planInteractionSession({
        requestedModality,
        externalVoiceProcessingConsent: false,
        allowVoiceProviderFallback: false,
        providers: {
          elevenlabs: { enabled: true, configured: true },
          openaiRealtime: { enabled: true, configured: true },
        },
      });

      expect(plan.status).toBe("ready");
      expect(plan.provider).toBe("mapable_text");
      expect(plan.externalProcessing).toBe(false);
      expect(plan.executionAuthority).toBe("mapable_governed_only");
    }
  });
});
