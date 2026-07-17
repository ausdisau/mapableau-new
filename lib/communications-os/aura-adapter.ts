import type { CommunicationRenderingResponse } from "@/lib/connected-capability";

import type { CommunicationPassportProjection } from "./types";
import { renderCommunicationPassport } from "./render";

/**
 * AURA presentation adapter interface.
 * AURA may render and explain; AURA may not infer consent or capacity.
 */
export interface AuraCommunicationPresentationAdapter {
  readonly name: "aura.communication.presentation";
  present(
    passport: CommunicationPassportProjection,
    mode: "plain_language" | "easy_read" | "one_question"
  ): CommunicationRenderingResponse;
  /** Hard boundary — always false. */
  canInferConsent: false;
  canInferCapacity: false;
  canSendExternalMessages: false;
}

export function createAuraCommunicationAdapter(): AuraCommunicationPresentationAdapter {
  return {
    name: "aura.communication.presentation",
    canInferConsent: false,
    canInferCapacity: false,
    canSendExternalMessages: false,
    present(passport, mode) {
      return renderCommunicationPassport(passport, {
        channel: "aura",
        presentation: mode,
      });
    },
  };
}
