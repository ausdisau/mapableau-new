import { describe, expect, it } from "vitest";

import { runRegistrationTurn } from "@/lib/registration/run-registration-turn";
import {
  REGISTRATION_PASSWORD_SENTINEL,
  REGISTRATION_START_SENTINEL,
} from "@/lib/registration/validation";

const baseOptions = {
  agentSessionId: "register-test",
  agentTurnIndex: 0,
};

describe("runRegistrationTurn", () => {
  it("starts with a welcome prompt for name", () => {
    const turn = runRegistrationTurn(
      REGISTRATION_START_SENTINEL,
      { name: "", email: "", password: "" },
      baseOptions,
    );

    expect(turn.agent.status).toBe("needs_clarification");
    expect(turn.agent.clarificationSlot).toBe("name");
    expect(turn.replyText).toMatch(/full name/i);
  });

  it("accepts a valid name and asks for email", () => {
    const turn = runRegistrationTurn(
      "Alex Rivera",
      { name: "", email: "", password: "" },
      baseOptions,
    );

    expect(turn.fields.name).toBe("Alex Rivera");
    expect(turn.agent.clarificationSlot).toBe("email");
    expect(turn.agent.filledSlots?.name).toBe(true);
  });

  it("rejects email-shaped name input", () => {
    const turn = runRegistrationTurn(
      "alex@example.com",
      { name: "", email: "", password: "" },
      baseOptions,
    );

    expect(turn.agent.clarificationSlot).toBe("name");
    expect(turn.fields.name).toBe("");
  });

  it("accepts email and moves to password slot", () => {
    const turn = runRegistrationTurn(
      "alex@example.com",
      { name: "Alex", email: "", password: "" },
      { ...baseOptions, priorFields: { name: "Alex", email: "" } },
    );

    expect(turn.fields.email).toBe("alex@example.com");
    expect(turn.agent.clarificationSlot).toBe("password");
  });

  it("locks email for pending worker invites", () => {
    const turn = runRegistrationTurn(
      "Sam Taylor",
      { name: "", email: "", password: "" },
      {
        ...baseOptions,
        invite: {
          email: "worker@provider.test",
          organisationName: "Care Co",
          emailMasked: "w***@provider.test",
          status: "pending",
        },
      },
    );

    expect(turn.fields.name).toBe("Sam Taylor");
    expect(turn.fields.email).toBe("worker@provider.test");
    expect(turn.agent.clarificationSlot).toBe("password");
    expect(turn.agent.inviteContext?.organisationName).toBe("Care Co");
  });

  it("rejects invalid email addresses", () => {
    const turn = runRegistrationTurn(
      "not-an-email",
      { name: "Sam", email: "", password: "" },
      {
        ...baseOptions,
        priorFields: { name: "Sam", email: "" },
      },
    );

    expect(turn.agent.clarificationSlot).toBe("email");
    expect(turn.fields.email).toBe("");
  });

  it("completes when password meets requirements", () => {
    const turn = runRegistrationTurn(
      REGISTRATION_PASSWORD_SENTINEL,
      { name: "Alex", email: "alex@example.com", password: "secretpass" },
      {
        ...baseOptions,
        priorFields: { name: "Alex", email: "alex@example.com" },
        sessionPassword: "secretpass",
      },
    );

    expect(turn.agent.status).toBe("complete");
    expect(turn.passwordCollected).toBe(true);
  });

  it("rejects short passwords", () => {
    const turn = runRegistrationTurn(
      REGISTRATION_PASSWORD_SENTINEL,
      { name: "Alex", email: "alex@example.com", password: "short" },
      {
        ...baseOptions,
        priorFields: { name: "Alex", email: "alex@example.com" },
        priorPasswordCollected: false,
        sessionPassword: "short",
      },
    );

    expect(turn.agent.status).toBe("needs_clarification");
    expect(turn.agent.clarificationSlot).toBe("password");
    expect(turn.passwordCollected).toBe(false);
  });
});
