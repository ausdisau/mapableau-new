/** @vitest-environment jsdom */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import "./fixtures/passenger-browser-crypto";

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
import {
  clearPracticeTrips,
  readPracticeTrips,
  writeEncryptedPracticeValue,
  unsealPracticeValue,
  updatePracticeTrips,
} from "@/lib/transport/passenger-storage";

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
async function click(name: string) {
  const button = await screen.findByRole("button", { name });
  await waitFor(() =>
    expect((button as HTMLButtonElement).disabled).toBe(false),
  );
  await act(async () => {
    fireEvent.click(button);
    await readPracticeTrips();
  });
}
async function request() {
  render(<PassengerPractice fromAppointment={false} />);
  await click("Plan a trip");
  fireEvent.change(screen.getByLabelText("Communication preference"), {
    target: { value: communications[2] },
  });
  await click("Send practice request");
  expect(screen.getByRole("heading", { name: "Request sent" })).toBeTruthy();
  await click("Review sample quote");
}

describe("Replit passenger journey", () => {
  it("reviews the sample quote and shares and withdraws preferences only with an assigned practice driver", async () => {
    await request();
    expect(screen.getByText("$29–$42 AUD")).toBeTruthy();
    expect(screen.queryByText("What your driver can see")).toBeNull();
    await click("Accept quote");
    await click("Assign practice driver");
    expect(
      screen.queryByText(communications[2], { selector: "blockquote" }),
    ).toBeNull();
    await click("Preview sharing");
    expect(
      screen.getByText(communications[2], { selector: "blockquote" }),
    ).toBeTruthy();
    expect((await readPracticeTrips())[0].shared).toBe(false);
    await click("Share for this trip");
    expect((await readPracticeTrips())[0].shared).toBe(true);
    await click("Withdraw sharing");
    expect(
      screen.queryByText(communications[2], { selector: "blockquote" }),
    ).toBeNull();
    await click("Preview sharing");
    await click("Share for this trip");
    for (const action of [
      "Show driver on the way",
      "Confirm pickup",
      "Mark arrival",
      "Complete journey",
    ])
      await click(action);
    expect(
      screen.getByRole("heading", { name: "Journey complete" }),
    ).toBeTruthy();
    const finished = (await readPracticeTrips())[0];
    expect(finished.shared).toBe(false);
    expect(changeStage(finished, "assigned")).toBe(finished);
  });
  it("previews only the selected access arrangements when communication is left blank", async () => {
    render(<PassengerPractice fromAppointment={false} />);
    await click("Plan a trip");
    fireEvent.click(screen.getByLabelText("Space for a mobility aid"));
    fireEvent.change(screen.getByLabelText("Supporter travel"), {
      target: { value: "yes" },
    });
    await click("Send practice request");
    await click("Review sample quote");
    await click("Accept quote");
    await click("Assign practice driver");
    await click("Preview sharing");
    expect(document.querySelector("blockquote")?.textContent).toBe(
      "Space for a mobility aid",
    );
    await click("Share for this trip");
    const [record] = await readPracticeTrips();
    expect(record.shared).toBe(true);
    expect(record.communication).toBe("No preference");
    await click("Withdraw sharing");
    expect(document.querySelector("blockquote")).toBeNull();
  });
  it("preserves declined offers after refresh and confirms cancellations", async () => {
    await request();
    await click("Decline offer");
    expect(
      screen.getByRole("heading", { name: "Offer declined" }),
    ).toBeTruthy();
    cleanup();
    render(<PassengerPractice fromAppointment={false} />);
    expect(
      await screen.findByRole("button", { name: /Offer declined/ }),
    ).toBeTruthy();
    await click("Plan a trip");
    await click("Send practice request");
    await click("Cancel trip");
    await click("Keep trip");
    expect(screen.getByRole("heading", { name: "Request sent" })).toBeTruthy();
    await click("Cancel trip");
    await click("Confirm cancellation");
    expect(screen.getByRole("heading", { name: "Cancelled" })).toBeTruthy();
    await click("Back to my trips");
    await click("Clear practice trips");
    await click("Keep trips");
    expect(localStorage.getItem(PRACTICE_TRIPS_KEY)).not.toBeNull();
    await click("Clear practice trips");
    await click("Clear saved trips");
    expect(localStorage.getItem(PRACTICE_TRIPS_KEY)).toBeNull();
    expect(screen.getByText("Your trips will appear here")).toBeTruthy();
  });
  it("loads the editable Care date and time without putting them in an account link", async () => {
    await storeAppointmentDraft({ date: "2090-06-03", time: "16:25" });
    render(<PassengerPractice fromAppointment />);
    await screen.findByText("The appointment date and time are ready to edit.");
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
  it("applies Sydney peak boundaries and correctly labels the next-day pickup window", async () => {
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
  it("encrypts practice records, binds them to their purpose and preserves concurrent writes", async () => {
    const template: PracticeTrip = {
      ...newDraft(),
      date: "2027-01-01",
      id: "one",
      stage: "requested",
      shared: false,
    };
    const add = (id: string) =>
      updatePracticeTrips((records) => [...records, { ...template, id }]);
    await Promise.all([add("one"), add("two")]);
    const raw = localStorage.getItem(PRACTICE_TRIPS_KEY)!;
    expect(raw).toMatch(/^v1\./);
    expect(raw).not.toContain("Parramatta");
    expect(await readPracticeTrips()).toHaveLength(2);
    await expect(unsealPracticeValue("another purpose", raw)).rejects.toThrow();
    await writeEncryptedPracticeValue(
      localStorage,
      PRACTICE_TRIPS_KEY,
      JSON.stringify(await readPracticeTrips()),
    );
    expect(localStorage.getItem(PRACTICE_TRIPS_KEY)).not.toBe(raw);
    localStorage.setItem(PRACTICE_TRIPS_KEY, JSON.stringify([template]));
    expect(await readPracticeTrips()).toEqual([template]);
    expect(localStorage.getItem(PRACTICE_TRIPS_KEY)).toMatch(/^v1\./);
  });
  it("removes a stale sharing decision if the browser rejects a withdrawal write", async () => {
    const trip: PracticeTrip = {
      ...newDraft(),
      id: "sample",
      date: "2027-05-20",
      stage: "assigned",
      communication: communications[1],
      shared: true,
    };
    await updatePracticeTrips(() => [trip]);
    const blocked = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("quota");
      });
    try {
      await expect(
        updatePracticeTrips((records) =>
          records.map((t) => ({ ...t, shared: false })),
        ),
      ).rejects.toThrow("quota");
      expect(localStorage.getItem(PRACTICE_TRIPS_KEY)).toBeNull();
      expect((await readPracticeTrips())[0].shared).toBe(false);
    } finally {
      blocked.mockRestore();
      await clearPracticeTrips();
    }
  });
  it("restores whitelisted practice choices and clears sharing for ended trips", async () => {
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
    expect(
      restoreTrips(
        JSON.stringify([{ ...trip, stage: { toString: null } }, trip]),
      ),
    ).toEqual([trip]);
    expect(changeStage(trip, "cancelled").shared).toBe(false);
  });
});
