import { createUIMessageStream } from "ai";

import type {
  RegistrationAgentData,
  RegistrationStateData,
} from "@/types/registration-chat";

import type { RegistrationTurn } from "../run-registration-turn";

export function buildRegistrationAgentStreamData(
  turn: RegistrationTurn,
): RegistrationAgentData {
  return turn.agent;
}

export function buildRegistrationStateStreamData(
  turn: RegistrationTurn,
): RegistrationStateData {
  return {
    fields: turn.fields,
    passwordCollected: turn.passwordCollected,
  };
}

export function createRegistrationChatResponseStream(options: {
  turn: RegistrationTurn;
}) {
  const { turn } = options;

  return createUIMessageStream({
    execute: async ({ writer }) => {
      writer.write({
        type: "data-registrationAgent",
        id: "registration-agent",
        data: buildRegistrationAgentStreamData(turn),
      });

      writer.write({
        type: "data-registrationState",
        id: "registration-state",
        data: buildRegistrationStateStreamData(turn),
      });

      const textId = "registration-assistant-text";
      writer.write({ type: "text-start", id: textId });
      writer.write({
        type: "text-delta",
        id: textId,
        delta: turn.replyText,
      });
      writer.write({ type: "text-end", id: textId });
    },
  });
}
