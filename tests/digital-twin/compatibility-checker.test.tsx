/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

import { CompatibilityChecker } from "@/components/digital-twin/CompatibilityChecker";
import {
  DEMO_PLACE_WORKPLACE,
  DEMO_PROFILE_WHEELCHAIR,
} from "@/lib/digital-twin/sample-data";

describe("CompatibilityChecker a11y", () => {
  it("uses fieldset and legend for check mode", () => {
    render(
      <CompatibilityChecker
        place={DEMO_PLACE_WORKPLACE}
        features={[]}
        pathSegments={[]}
        demoProfiles={[DEMO_PROFILE_WHEELCHAIR]}
      />
    );
    expect(screen.getByRole("group", { name: /Choose check mode/i })).toBeTruthy();
  });

  it("has aria-live region for results", () => {
    const { container } = render(
      <CompatibilityChecker
        place={DEMO_PLACE_WORKPLACE}
        features={[]}
        pathSegments={[]}
        demoProfiles={[DEMO_PROFILE_WHEELCHAIR]}
      />
    );
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).toBeTruthy();
  });
});
