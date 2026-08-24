import { describe, expect, it } from "vitest";

import {
  ADVERSARIAL_SCENARIOS,
  createSyntheticExternalServices,
  getAdversarialFixture,
} from "@/lib/ai/platform/eval-lab";
import { FORBIDDEN_GAIS_WRITE_IMPORTS } from "@/lib/labs/runtime/boundary";

describe("Nerve Centre Eval Lab — adversarial + synthetic boundary", () => {
  it("includes every required adversarial scenario id", () => {
    const ids = ADVERSARIAL_SCENARIOS.map((s) => s.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "adv-prompt-injection-provider",
        "adv-malicious-document",
        "adv-forged-approval",
        "adv-replayed-nonce",
        "adv-changed-payload",
        "adv-cross-tenant",
        "adv-revoked-consent",
        "adv-fake-provider-cancel",
        "adv-stale-access-claim",
        "adv-false-certainty",
        "adv-tool-unavailable",
        "adv-model-unavailable",
        "adv-worker-auto-assign",
        "adv-transport-confirm",
        "adv-employer-disclosure",
        "adv-safeguarding-conclusion",
      ]),
    );
  });

  it("synthetic services refuse production-shaped writes", () => {
    const services = createSyntheticExternalServices();
    expect(services.attemptAutoAssignWorker({ workerId: "syn-worker-1", reason: "test" }).assigned).toBe(false);
    expect(services.attemptConfirmTransport({ offerId: "syn-offer" }).confirmed).toBe(false);
    expect(services.attemptEmployerDisclosure({ employerId: "syn-emp" }).disclosed).toBe(false);
    expect(services.attemptConnectorWrite({ connector: "crm", payload: { x: 1 } }).written).toBe(false);
  });

  it("adversarial injection fixtures contain override language", () => {
    const inj = getAdversarialFixture("prompt_injection_provider_profile");
    expect(inj.untrustedText?.toLowerCase()).toMatch(/ignore previous/);
    const doc = getAdversarialFixture("malicious_document_instructions");
    expect(doc.untrustedText?.toLowerCase()).toMatch(/system:/);
  });

  it("aligns with Labs forbidden production-write modules", () => {
    expect(FORBIDDEN_GAIS_WRITE_IMPORTS.length).toBeGreaterThan(0);
  });
});
