import { readUIMessageStream } from "ai";
import { describe, expect, it } from "vitest";

import {
  buildRegistrationAgentStreamData,
  createRegistrationChatResponseStream,
} from "@/lib/registration/conversation/stream-assistant";
import { runRegistrationTurn } from "@/lib/registration/run-registration-turn";
import { REGISTRATION_START_SENTINEL } from "@/lib/registration/validation";

describe("registration chat stream", () => {
  it("buildRegistrationAgentStreamData maps turn agent meta", () => {
    const turn = runRegistrationTurn(
      REGISTRATION_START_SENTINEL,
      { name: "", email: "", password: "" },
      { agentSessionId: "register-test", agentTurnIndex: 0 },
    );
    const data = buildRegistrationAgentStreamData(turn);
    expect(data).toMatchObject({
      sessionId: "register-test",
      status: "needs_clarification",
      clarificationSlot: "name",
    });
  });

  it("createRegistrationChatResponseStream emits agent before state", async () => {
    const turn = runRegistrationTurn(
      REGISTRATION_START_SENTINEL,
      { name: "", email: "", password: "" },
      { agentSessionId: "register-test", agentTurnIndex: 0 },
    );
    const stream = createRegistrationChatResponseStream({ turn });

    const parts: string[] = [];
    for await (const message of readUIMessageStream({ stream })) {
      for (const part of message.parts) {
        parts.push(part.type);
      }
    }

    const agentIndex = parts.indexOf("data-registrationAgent");
    const stateIndex = parts.indexOf("data-registrationState");
    expect(agentIndex).toBeGreaterThanOrEqual(0);
    expect(stateIndex).toBeGreaterThan(agentIndex);
  });
});
