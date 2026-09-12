// @vitest-environment jsdom

import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ParticipantSupportPlanCard } from "@/components/crisis/ParticipantSupportPlanCard";

afterEach(cleanup);

function makePreview() {
  render(<ParticipantSupportPlanCard />);

  fireEvent.change(screen.getByLabelText(/^things i can try$/i), {
    target: { value: "Move somewhere quieter." },
  });
  fireEvent.change(screen.getByLabelText(/^people i choose to ask for support$/i), {
    target: { value: "Alex" },
  });
  fireEvent.change(screen.getByLabelText(/^how i communicate$/i), {
    target: { value: "Please give me extra time to use AAC." },
  });

  fireEvent.click(screen.getByLabelText(/include things i can try/i));
  fireEvent.click(screen.getByLabelText(/include how i communicate/i));
  fireEvent.click(screen.getByRole("button", { name: /make private preview/i }));
}

describe("purpose-bound support-plan sharing UI", () => {
  it("prepares an exact recipient, purpose and expiry without sending", () => {
    makePreview();

    expect(screen.getByText(/prepare a sharing envelope/i)).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/who is this prepared for/i), {
      target: { value: "chosen_person" },
    });
    fireEvent.change(screen.getByLabelText(/exact recipient name or service/i), {
      target: { value: "Alex" },
    });
    fireEvent.change(screen.getByLabelText(/why i want to share this/i), {
      target: { value: "ask_for_support" },
    });
    fireEvent.change(
      screen.getByLabelText(/how long should this prepared envelope last/i),
      { target: { value: "one_hour" } },
    );

    fireEvent.click(
      screen.getByRole("button", { name: /prepare sharing envelope/i }),
    );

    const envelope = screen.getByTestId("support-plan-share-envelope");
    expect(within(envelope).getByText(/prepared only — not sent/i)).toBeTruthy();
    expect(within(envelope).getByText(/recipient: alex/i)).toBeTruthy();
    expect(within(envelope).getByText(/purpose: ask for support/i)).toBeTruthy();
    expect(within(envelope).getByText(/expires:/i)).toBeTruthy();
    expect(within(envelope).getByText("Move somewhere quieter.")).toBeTruthy();
    expect(
      within(envelope).getByText("Please give me extra time to use AAC."),
    ).toBeTruthy();
    expect(within(envelope).queryByText("Alex", { exact: true })).toBeNull();
    expect(
      within(envelope).getByText(/does not create permission to send/i),
    ).toBeTruthy();
    expect(
      within(envelope).getByText(/external acceptance has not been confirmed/i),
    ).toBeTruthy();
    expect(
      within(envelope).queryByRole("button", { name: /^send/i }),
    ).toBeNull();
  });

  it("requires a named recipient before preparing an envelope", () => {
    makePreview();

    fireEvent.click(
      screen.getByRole("button", { name: /prepare sharing envelope/i }),
    );

    expect(screen.getByRole("alert").textContent).toMatch(/recipient/i);
    expect(screen.queryByTestId("support-plan-share-envelope")).toBeNull();
  });

  it("revokes the local envelope without claiming recall or deletion", () => {
    makePreview();

    fireEvent.change(screen.getByLabelText(/exact recipient name or service/i), {
      target: { value: "Alex" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /prepare sharing envelope/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /revoke this prepared envelope/i }),
    );

    const envelope = screen.getByTestId("support-plan-share-envelope");
    expect(within(envelope).getByText(/status: revoked/i)).toBeTruthy();
    expect(within(envelope).getByText(/was never sent/i)).toBeTruthy();
    expect(within(envelope).getByText(/does not claim external deletion or recall/i)).toBeTruthy();
  });

  it("invalidates a prepared envelope when the participant changes the preview", () => {
    makePreview();

    fireEvent.change(screen.getByLabelText(/exact recipient name or service/i), {
      target: { value: "Alex" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /prepare sharing envelope/i }),
    );
    expect(screen.getByTestId("support-plan-share-envelope")).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/^things i can try$/i), {
      target: { value: "Sit near the window." },
    });

    expect(screen.queryByTestId("support-plan-share-envelope")).toBeNull();
    expect(screen.queryByText(/prepare a sharing envelope/i)).toBeNull();
  });
});
