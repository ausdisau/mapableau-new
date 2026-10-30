import { afterEach, describe, expect, it } from "vitest";

import { isAssessmentRegistrationEnabled } from "@/lib/config/assessment-release";

const key = "MAPABLE_ASSESSMENT_REGISTRATION_ENABLED";
const original = process.env[key];

afterEach(() => {
  if (original === undefined) delete process.env[key];
  else process.env[key] = original;
});

describe("assessment release hold", () => {
  it("defaults off when unset", () => {
    delete process.env[key];
    expect(isAssessmentRegistrationEnabled()).toBe(false);
  });
  it("does not enable for truthy-looking values", () => {
    for (const value of ["1", "yes", "TRUE", "false"]) {
      process.env[key] = value;
      expect(isAssessmentRegistrationEnabled()).toBe(false);
    }
  });
  it("enables only when explicitly set to true", () => {
    process.env[key] = "true";
    expect(isAssessmentRegistrationEnabled()).toBe(true);
  });
});
