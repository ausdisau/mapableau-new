/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_CARE_AAC_PHRASES } from "@mapable/adtunis-aac";
import { CareComposer } from "@mapable/adtunis-ui";

describe("CareComposer accessibility contract", () => {
  it("exposes status, heading, and 44px-class controls", () => {
    render(
      <CareComposer
        recording={false}
        recognitionReady={false}
        speechStatusDetail="Simulated ASR detail"
        candidate={null}
        draft=""
        aacPhrases={DEFAULT_CARE_AAC_PHRASES}
        onDraftChange={vi.fn()}
        onStartRecording={vi.fn()}
        onStopRecording={vi.fn()}
        onSelectAac={vi.fn()}
        onConfirm={vi.fn()}
        onRetry={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /care message composer/i }),
    ).toBeTruthy();
    expect(screen.getByRole("status")).toBeTruthy();
    const start = screen.getByRole("button", { name: /start recording/i });
    expect(start.className).toContain("min-h-11");
    expect(screen.getByLabelText(/editable message/i)).toBeTruthy();
  });
});
