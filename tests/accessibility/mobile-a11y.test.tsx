/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LargeTextInput } from "@/components/forms/LargeTextInput";
import { FormErrorSummary } from "@/components/forms/FormErrorSummary";

describe("mobile forms accessibility", () => {
  it("renders real labels", () => {
    render(
      <LargeTextInput
        id="test-field"
        label="Your name"
        value=""
        onChange={() => {}}
      />
    );
    expect(screen.getByLabelText("Your name")).toBeTruthy();
  });

  it("error summary is focusable when visible", () => {
    render(
      <FormErrorSummary errors={["Name is required"]} visible />
    );
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("Name is required")).toBeTruthy();
  });
});

describe("SafeAreaContainer", () => {
  it("applies safe area padding class when bottom nav", async () => {
    const { SafeAreaContainer } = await import(
      "@/components/layout/SafeAreaContainer"
    );
    const { container } = render(
      <SafeAreaContainer withBottomNav>
        <p>Content</p>
      </SafeAreaContainer>
    );
    const el = container.firstChild as HTMLElement | null;
    expect(el?.className).toContain("safe-area-inset-bottom");
  });
});
