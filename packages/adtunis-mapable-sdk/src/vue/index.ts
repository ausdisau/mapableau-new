/**
 * Vue 3 Composition API stubs with the same state/error semantics as React hooks.
 * Optional peer dependency — no Vue app exists in MapAble today.
 */

import type { AdtunisClient } from "../client";
import { AdtunisClient as Client } from "../client";

export function useAdtunisSession(client?: AdtunisClient) {
  const api = client ?? new Client();
  return {
    client: api,
    async load() {
      return api.workspace();
    },
  };
}

export function useSpeechRecognition(client?: AdtunisClient) {
  const api = client ?? new Client();
  return {
    client: api,
    async status() {
      return api.speechStatus();
    },
    async recognize(audio: Blob) {
      return api.recognize(audio);
    },
  };
}

export function usePersonalVocabulary(client?: AdtunisClient) {
  return useAdtunisSession(client);
}

export function useCommunicationPreferences(client?: AdtunisClient) {
  return useAdtunisSession(client);
}

export function useAdtunisConsent(client?: AdtunisClient) {
  const session = useAdtunisSession(client);
  return {
    ...session,
    async saveConsent(consent: {
      transcription: boolean;
      personalisation: boolean;
      research: boolean;
    }) {
      return session.client.performAction({ type: "saveConsent", consent });
    },
  };
}

export function useAccessibleCommand(client?: AdtunisClient) {
  const session = useAdtunisSession(client);
  return {
    ...session,
    async run(expression: string, idempotencyKey: string) {
      await session.client.performAction({
        type: "confirmExpression",
        text: expression,
      });
      return session.client.confirmIntent({
        expression,
        idempotencyKey,
        confirmed: true,
      });
    },
  };
}
