
import { createMapableApiClient } from "@mapable/api-client";
import { loadMobilePublicEnv } from "@/types/env";
import { secureTokenStore } from "@/storage/secure-token-store";

let participantId: string | null = null;
let organisationId: string | null = null;

export function setMobileScope(input: {
  participantId?: string | null;
  organisationId?: string | null;
}) {
  if (input.participantId !== undefined) participantId = input.participantId;
  if (input.organisationId !== undefined) organisationId = input.organisationId;
}

export function getMobileApiClient() {
  const env = loadMobilePublicEnv();
  return createMapableApiClient({
    baseUrl: env.apiBaseUrl || "http://localhost:3000",
    appVersion: env.appVersion,
    getAccessToken: async () => (await secureTokenStore.get())?.accessToken ?? null,
    getParticipantId: async () => participantId,
    getOrganisationId: async () => organisationId,
  });
}
