/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { InterviewJourneyClient } from "@/components/pilot/starting-work/InterviewJourneyClient";

afterEach(cleanup);

describe("InterviewJourneyClient", () => {
  it("rejects empty meaning and invalidates confirmation on edit", () => {
    render(<InterviewJourneyClient />);
    const meaning = screen.getByLabelText("Suggested meaning");
    fireEvent.change(meaning, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm meaning" }));
    expect(screen.getByRole("alert").textContent).toMatch(/Enter a suggested meaning/i);

    fireEvent.change(meaning, { target: { value: "Need care before interview" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm meaning" }));
    expect(screen.getByText(/Confirmed: Need care before interview/)).toBeTruthy();

    fireEvent.change(meaning, { target: { value: "Changed draft" } });
    expect(screen.queryByText(/Confirmed:/)).toBeNull();
  });

  it("keeps list usable when switching evidence views", () => {
    render(<InterviewJourneyClient />);
    fireEvent.click(screen.getByRole("button", { name: "List only" }));
    expect(screen.getByText("Before leaving")).toBeTruthy();
    expect(screen.getByText("Pickup")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Map and list" }));
    expect(screen.getByText(/Illustrative route/)).toBeTruthy();
  });

  it("simulates handoff with no implicit field opt-ins", () => {
    render(<InterviewJourneyClient />);
    fireEvent.click(screen.getByRole("button", { name: "Ask my coordinator" }));
    fireEvent.click(screen.getByRole("button", { name: "Simulate handoff" }));
    expect(screen.getByText("Local handoff receipt")).toBeTruthy();
    expect(screen.getByText(/none \(generic help request\)/)).toBeTruthy();
  });
});
