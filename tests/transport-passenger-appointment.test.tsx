/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CarePassengerEntry } from "@/components/care/CarePassengerEntry";
import {
  APPOINTMENT_DRAFT_KEY,
  APPOINTMENT_PLAN_PATH,
  PASSENGER_PATH,
  sampleCareAppointment,
  storeAppointmentDraft,
  takeAppointmentDraft,
} from "@/lib/transport/passenger-appointment";

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("Care to passenger handoff", () => {
  it("only copies the Sydney calendar date and time once", () => {
    const appointment = {
      date: "2027-02-01",
      time: "10:30",
      reason: "private",
      provider: "private",
    };
    storeAppointmentDraft(appointment);
    expect(JSON.parse(sessionStorage.getItem(APPOINTMENT_DRAFT_KEY)!)).toEqual({
      date: appointment.date,
      time: appointment.time,
    });
    expect(takeAppointmentDraft()).toEqual({
      date: appointment.date,
      time: appointment.time,
    });
    expect(takeAppointmentDraft()).toBeNull();
    expect(sampleCareAppointment(new Date("2026-11-27T14:30:00Z"))).toEqual({
      date: "2026-11-29",
      time: "10:30",
    });
  });
  it("discards malformed dates and works when browser storage is unavailable", () => {
    for (const draft of [
      { date: "2027-02-30", time: "10:30" },
      { date: "2027-02-28", time: "25:00" },
    ]) {
      sessionStorage.setItem(APPOINTMENT_DRAFT_KEY, JSON.stringify(draft));
      expect(takeAppointmentDraft()).toBeNull();
      expect(sessionStorage.getItem(APPOINTMENT_DRAFT_KEY)).toBeNull();
    }
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("unavailable");
    });
    expect(() =>
      storeAppointmentDraft({ date: "2027-02-10", time: "10:30" }),
    ).not.toThrow();
  });
  it("makes My trips a simple link and stages the appointment only when Plan transport is chosen", () => {
    render(<CarePassengerEntry />);
    expect(
      screen.getByRole("link", { name: "My trips" }).getAttribute("href"),
    ).toBe(PASSENGER_PATH);
    const plan = screen.getByRole("link", { name: "Plan transport" });
    expect(plan.getAttribute("href")).toBe(APPOINTMENT_PLAN_PATH);
    expect(sessionStorage.length).toBe(0);
    // Prevent JSDOM from following the Next link after its click handler runs.
    plan.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(plan);
    expect(takeAppointmentDraft()).toEqual(sampleCareAppointment(new Date()));
  });
});
