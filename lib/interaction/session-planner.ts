export type InteractionModality = "text" | "aac" | "voice";
export type VoiceProvider =
  | "elevenlabs_speech_engine"
  | "openai_realtime";

export type InteractionProviderAvailability = {
  enabled: boolean;
  configured: boolean;
};

export type InteractionSessionPlanInput = {
  requestedModality: InteractionModality;
  preferredVoiceProvider?: VoiceProvider;
  externalVoiceProcessingConsent: boolean;
  allowVoiceProviderFallback: boolean;
  providers: {
    elevenlabs: InteractionProviderAvailability;
    openaiRealtime: InteractionProviderAvailability;
  };
};

export type InteractionSessionPlan = {
  status: "ready" | "requires_consent" | "provider_unavailable";
  provider: "mapable_text" | VoiceProvider | null;
  transport: "mapable_internal" | "webrtc_ephemeral_token" | null;
  externalProcessing: boolean;
  browserCredentialPolicy: "none" | "ephemeral_only";
  executionAuthority: "mapable_governed_only";
  suggestedFallback: "text" | null;
};

function providerReady(provider: InteractionProviderAvailability): boolean {
  return provider.enabled && provider.configured;
}

function readyVoicePlan(provider: VoiceProvider): InteractionSessionPlan {
  return {
    status: "ready",
    provider,
    transport: "webrtc_ephemeral_token",
    externalProcessing: true,
    browserCredentialPolicy: "ephemeral_only",
    executionAuthority: "mapable_governed_only",
    suggestedFallback: null,
  };
}

/**
 * Select an interaction transport without granting the provider any MapAble
 * execution authority. External voice processing is opt-in and provider
 * fallback is never silent.
 */
export function planInteractionSession(
  input: InteractionSessionPlanInput,
): InteractionSessionPlan {
  if (input.requestedModality !== "voice") {
    return {
      status: "ready",
      provider: "mapable_text",
      transport: "mapable_internal",
      externalProcessing: false,
      browserCredentialPolicy: "none",
      executionAuthority: "mapable_governed_only",
      suggestedFallback: null,
    };
  }

  if (!input.externalVoiceProcessingConsent) {
    return {
      status: "requires_consent",
      provider: null,
      transport: null,
      externalProcessing: false,
      browserCredentialPolicy: "none",
      executionAuthority: "mapable_governed_only",
      suggestedFallback: "text",
    };
  }

  const preferred = input.preferredVoiceProvider ?? "elevenlabs_speech_engine";
  const preferredReady =
    preferred === "elevenlabs_speech_engine"
      ? providerReady(input.providers.elevenlabs)
      : providerReady(input.providers.openaiRealtime);

  if (preferredReady) return readyVoicePlan(preferred);

  if (input.allowVoiceProviderFallback) {
    const fallback: VoiceProvider =
      preferred === "elevenlabs_speech_engine"
        ? "openai_realtime"
        : "elevenlabs_speech_engine";
    const fallbackReady =
      fallback === "elevenlabs_speech_engine"
        ? providerReady(input.providers.elevenlabs)
        : providerReady(input.providers.openaiRealtime);

    if (fallbackReady) return readyVoicePlan(fallback);
  }

  return {
    status: "provider_unavailable",
    provider: null,
    transport: null,
    externalProcessing: false,
    browserCredentialPolicy: "none",
    executionAuthority: "mapable_governed_only",
    suggestedFallback: "text",
  };
}
