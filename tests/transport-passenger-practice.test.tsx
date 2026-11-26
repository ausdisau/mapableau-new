/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PassengerPractice } from "@/components/transport/passenger/PassengerPractice";
import { storeAppointmentDraft } from "@/lib/transport/passenger-appointment";
import {
  changeStage,
  communications,
  newDraft,
  places,
  PRACTICE_TRIPS_KEY,
  restoreTrips,
  sampleQuote,
  validateDraft,
  type PracticeTrip,
} from "@/lib/transport/passenger-practice";

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
const click = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name, exact: true }));
function request() {
  render(<PassengerPractice fromAppointment={false} />);
  click("Plan a trip");
  fireEvent.change(screen.getByLabelText("Communication preference"), {
    target: { value: communications[2] },
  });
  click("Send practice request");
  expect(screen.getByRole("heading", { name: "Request sent" })).toBeTruthy();
  click("Review sample quote");
}

describe("Replit passenger journey", () => {
  it("reviews the sample quote and shares and withdraws preferences only with an assigned practice driver", () => {
    request();
    expect(screen.getByText("$29–$42 AUD")).toBeTruthy();
    expect(screen.queryByText("What your driver can see")).toBeNull();
    click("Accept quote");
    click("Assign practice driver");
    expect(
      screen.queryByText(communications[2], { selector: "blockquote" }),
    ).toBeNull();
    click("Preview sharing");
    expect(
      screen.getByText(communications[2], { selector: "blockquote" }),
    ).toBeTruthy();
    expect(
      restoreTrips(localStorage.getItem(PRACTICE_TRIPS_KEY))[0].shared,
    ).toBe(false);
    click("Share for this trip");
    expect(
      restoreTrips(localStorage.getItem(PRACTICE_TRIPS_KEY))[0].shared,
    ).toBe(true);
    click("Withdraw sharing");
    expect(
      screen.queryByText(communications[2], { selector: "blockquote" }),
    ).toBeNull();
    click("Preview sharing");
    click("Share for this trip");
    for (const action of [
      "Show driver on the way",
      "Confirm pickup",
      "Mark arrival",
      "Complete journey",
    ])
      click(action);
    expect(
      screen.getByRole("heading", { name: "Journey complete" }),
    ).toBeTruthy();
    const finished = restoreTrips(localStorage.getItem(PRACTICE_TRIPS_KEY))[0];
    expect(finished.shared).toBe(false);
    expect(changeStage(finished, "assigned")).toBe(finished);
  });
  it("previews only the selected access arrangements when communication is left blank", () => {
    render(<PassengerPractice fromAppointment={false} />);
    click("Plan a trip");
    fireEvent.click(screen.getByLabelText("Space for a mobility aid"));
    fireEvent.change(screen.getByLabelText("Supporter travel"), {
      target: { value: "yes" },
    });
    click("Send practice request");
    click("Review sample quote");
    click("Accept quote");
    click("Assign practice driver");
    click("Preview sharing");
    expect(document.querySelector("blockquote")?.textContent).toBe(
      "Space for a mobility aid",
    );
    click("Share for this trip");
    const [record] = restoreTrips(localStorage.getItem(PRACTICE_TRIPS_KEY));
    expect(record.shared).toBe(true);
    expect(record.communication).toBe("No preference");
    click("Withdraw sharing");
    expect(document.querySelector("blockquote")).toBeNull();
  });
  it("preserves declined offers after refresh and confirms cancellations", () => {
    request();
    click("Decline offer");
    expect(
      screen.getByRole("heading", { name: "Offer declined" }),
    ).toBeTruthy();
    cleanup();
    render(<PassengerPractice fromAppointment={false} />);
    expect(screen.getByRole("button", { name: /Offer declined/ })).toBeTruthy();
    click("Plan a trip");
    click("Send practice request");
    click("Cancel trip");
    click("Keep trip");
    expect(screen.getByRole("heading", { name: "Request sent" })).toBeTruthy();
    click("Cancel trip");
    click("Confirm cancellation");
    expect(screen.getByRole("heading", { name: "Cancelled" })).toBeTruthy();
  });
  it("loads the editable Care date and time without putting them in an account link", () => {
    storeAppointmentDraft({ date: "2090-06-03", time: "16:25" });
    render(<PassengerPractice fromAppointment />);
    expect(
      (screen.getByLabelText("Travel date") as HTMLInputElement).value,
    ).toBe("2090-06-03");
    expect(
      (screen.getByLabelText("Pickup time") as HTMLInputElement).value,
    ).toBe("16:25");
    expect(
      [
        "Signed-in trip request",
        "Signed-in trip dashboard",
        "Contact MapAble",
      ].map((name) => screen.getByRole("link", { name }).getAttribute("href")),
    ).toEqual(["/transport/request", "/transport/dashboard", "/contact"]);
  });
  it("applies Sydney peak boundaries and correctly labels the next-day pickup window", () => {
    for (const time of ["07:00", "08:59", "15:00", "17:59"])
      expect(sampleQuote(time).fare).toBe("$34–$48 AUD");
    for (const time of ["06:59", "09:00", "14:59", "18:00"])
      expect(sampleQuote(time).fare).toBe("$29–$42 AUD");
    expect(sampleQuote("23:30").window).toBe("23:30–00:30 next day");
    const now = new Date("2026-11-26T23:30:00Z");
    expect(
      validateDraft({ ...newDraft(), date: "2026-11-27", time: "10:29" }, now),
    ).toMatch(/future/);
    expect(
      validateDraft({ ...newDraft(), date: "2026-11-27", time: "10:31" }, now),
    ).toBe("");
    expect(
      validateDraft({ ...newDraft(), destination: places[0] }, now),
    ).toMatch(/different/);
  });
  it("restores whitelisted practice choices and clears sharing for ended trips", () => {
    const trip: PracticeTrip = {
      ...newDraft(),
      date: "2027-01-01",
      stage: "assigned",
      id: "sample-1",
      shared: true,
      communication: communications[1],
    };
    const [clean] = restoreTrips(
      JSON.stringify([
        {
          ...trip,
          stage: "complete",
          access: ["free text"],
          clinicalNote: "ignore",
        },
      ]),
    );
    expect(clean).toEqual({
      ...trip,
      stage: "complete",
      access: [],
      shared: false,
    });
    expect(
      restoreTrips(
        JSON.stringify([
          { ...trip, stage: "constructor" },
          { ...trip, communication: "unrecognised" },
        ]),
      ),
    ).toEqual([]);
    expect(changeStage(trip, "cancelled").shared).toBe(false);
  });
});
