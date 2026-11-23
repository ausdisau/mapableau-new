/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConsentScopeDrawer } from "@/components/transport/ConsentScopeDrawer";
import { HumanGateConfirmationCard } from "@/components/transport/HumanGateConfirmationCard";
import { LiveTripTelemetryBar } from "@/components/transport/LiveTripTelemetryBar";
import { SafePickupZoneOverlay } from "@/components/transport/SafePickupZoneOverlay";
import {
  TransportBookingWorkspace,
  buildMobilitySummaryLines,
  canSubmitTransportRequest,
  shouldShowBookingMap,
  validateTransportJourneyFields,
} from "@/components/transport/TransportBookingWorkspace";
import {
  boardingAlertNotEnabledMessage,
  initialTransportSocketState,
} from "@/lib/realtime/use-transport-socket";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

vi.mock("next/dynamic", () => ({
  default: () => {
    function MockDynamic() {
      return React.createElement("div", { "data-testid": "dynamic-map" }, "map");
    }
    return MockDynamic;
  },
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("transport booking human gate", () => {
  it("blocks submit until human gate is confirmed", () => {
    expect(canSubmitTransportRequest(false)).toBe(false);
    expect(canSubmitTransportRequest(true)).toBe(true);
  });

  it("renders confirmation checkbox and requires toggle", () => {
    const onChange = vi.fn();
    render(
      React.createElement(HumanGateConfirmationCard, {
        confirmed: false,
        onConfirmedChange: onChange,
        summaryLines: ["Pickup: Parramatta"],
      })
    );
    expect(screen.getByText(/Confirm human gate/i)).toBeTruthy();
    expect(screen.getByText(/will not auto-assign/i)).toBeTruthy();
    expect(screen.getByText("Pickup: Parramatta")).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("validates required journey fields before leaving step 1", () => {
    expect(
      validateTransportJourneyFields({
        pickupAddress: "",
        dropoffAddress: "2 Dest",
        scheduledStart: "2026-11-22T09:00",
      })
    ).toMatch(/pickup/i);
    expect(
      validateTransportJourneyFields({
        pickupAddress: "1 Pickup",
        dropoffAddress: "",
        scheduledStart: "2026-11-22T09:00",
      })
    ).toMatch(/drop-off/i);
    expect(
      validateTransportJourneyFields({
        pickupAddress: "1 Pickup",
        dropoffAddress: "2 Dest",
        scheduledStart: "",
      })
    ).toMatch(/scheduled start/i);
    expect(
      validateTransportJourneyFields({
        pickupAddress: "1 Pickup",
        dropoffAddress: "2 Dest",
        scheduledStart: "2026-11-22T09:00",
      })
    ).toBeNull();
  });

  it("blocks step jump and submit without journey fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          mobilityRequirements: {},
          fromProfile: false,
        })
      )
    );
    render(React.createElement(TransportBookingWorkspace));
    fireEvent.click(screen.getByRole("button", { name: /04/i }));
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      expect.stringMatching(/pickup address/i)
    );
    expect(screen.getByLabelText(/Pickup address/i)).toBeTruthy();
  });

  it("clears human-gate confirmation when journey details change", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).includes("/api/transport/mobility-prefill")) {
          return Response.json({
            mobilityRequirements: {},
            fromProfile: false,
          });
        }
        return Response.json({}, { status: 404 });
      })
    );
    render(React.createElement(TransportBookingWorkspace));
    fireEvent.change(screen.getByLabelText(/Pickup address/i), {
      target: { value: "1 Pickup Street" },
    });
    fireEvent.change(screen.getByLabelText(/Drop-off address/i), {
      target: { value: "2 Destination Road" },
    });
    fireEvent.change(screen.getByLabelText(/Scheduled start/i), {
      target: { value: "2026-11-22T09:00" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Continue to access needs/i })
    );
    fireEvent.click(screen.getByRole("button", { name: /Continue to consent/i }));
    fireEvent.click(screen.getByRole("button", { name: /Continue to confirm/i }));
    const confirm = screen.getByRole("checkbox", { name: /I confirm/i });
    fireEvent.click(confirm);
    expect((confirm as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /Back/i }));
    fireEvent.change(screen.getByLabelText(/Access notes at pickup/i), {
      target: { value: "Buzz unit 4" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue to confirm/i }));
    expect(
      (screen.getByRole("checkbox", { name: /I confirm/i }) as HTMLInputElement)
        .checked
    ).toBe(false);
  });
});

describe("mobility confirmation summary", () => {
  it("lists ramp and assistance needs beyond wheelchair and hoist", () => {
    expect(
      buildMobilitySummaryLines({
        requiresRamp: true,
        assistanceAnimalPresent: true,
        needsExtraBoardingTime: true,
      })
    ).toEqual([
      "Ramp required",
      "Assistance animal present",
      "Extra boarding time needed",
    ]);
  });
});

describe("consent clinical warning", () => {
  it("shows clinical-data warning banner", () => {
    render(
      React.createElement(ConsentScopeDrawer, {
        checkedIds: [],
        onChange: () => undefined,
      })
    );
    expect(screen.getByText(/clinical diagnoses/i)).toBeTruthy();
    expect(screen.getByText(/never auto-shared/i)).toBeTruthy();
  });
});

it("prefills mobility checkboxes and confirmation from the accessibility profile", async () => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/api/transport/mobility-prefill")) {
      return Response.json({
        mobilityRequirements: {
          requiresWheelchairAccessible: true,
          requiresHoist: true,
        },
        fromProfile: true,
        profileShared: true,
      });
    }
    if (url === "/api/transport/trips" && init?.method === "POST") {
      return Response.json({ trip: { id: "trip-prefill-1" } }, { status: 201 });
    }
    return Response.json({}, { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);

  render(React.createElement(TransportBookingWorkspace));
  fireEvent.change(screen.getByLabelText(/Pickup address/i), {
    target: { value: "1 Pickup Street" },
  });
  fireEvent.change(screen.getByLabelText(/Drop-off address/i), {
    target: { value: "2 Destination Road" },
  });
  fireEvent.change(screen.getByLabelText(/Scheduled start/i), {
    target: { value: "2026-11-22T09:00" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: /Continue to access needs/i })
  );

  await waitFor(() => {
    expect(
      screen.getByRole("checkbox", { name: /Wheelchair-accessible vehicle/i })
    ).toHaveProperty("checked", true);
  });
  expect(
    screen.getByRole("checkbox", { name: /Hoist required/i })
  ).toHaveProperty("checked", true);

  fireEvent.click(screen.getByRole("button", { name: /Continue to consent/i }));
  fireEvent.click(screen.getByRole("button", { name: /Continue to confirm/i }));
  expect(
    screen.getByText(/Wheelchair-accessible vehicle required/i)
  ).toBeTruthy();
  expect(screen.getByText(/Rear hoist required/i)).toBeTruthy();

  fireEvent.click(screen.getByRole("checkbox", { name: /I confirm/i }));
  fireEvent.click(
    screen.getByRole("button", { name: /Confirm transport request/i })
  );
  await waitFor(() =>
    expect(
      fetchMock.mock.calls.some(
        ([url, init]) =>
          String(url) === "/api/transport/trips" &&
          (init as RequestInit | undefined)?.method === "POST"
      )
    ).toBe(true)
  );
  const tripCall = fetchMock.mock.calls.find(
    ([url, init]) =>
      String(url) === "/api/transport/trips" &&
      (init as RequestInit | undefined)?.method === "POST"
  );
  expect(tripCall).toBeTruthy();
  const body = JSON.parse(String((tripCall![1] as RequestInit).body));
  // Client already hydrated prefill — server must not re-merge profile flags.
  expect(body.prefillFromProfile).toBe(false);
  expect(body.mobilityRequirements).toMatchObject({
    requiresWheelchairAccessible: true,
    requiresHoist: true,
  });
});

it("keeps unchecked prefill flags off in the create payload", async () => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/api/transport/mobility-prefill")) {
      return Response.json({
        mobilityRequirements: {
          requiresWheelchairAccessible: true,
          requiresHoist: true,
        },
        fromProfile: true,
        profileShared: true,
      });
    }
    if (url === "/api/transport/trips" && init?.method === "POST") {
      return Response.json({ trip: { id: "trip-uncheck-1" } }, { status: 201 });
    }
    return Response.json({}, { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);

  render(React.createElement(TransportBookingWorkspace));
  fireEvent.change(screen.getByLabelText(/Pickup address/i), {
    target: { value: "1 Pickup Street" },
  });
  fireEvent.change(screen.getByLabelText(/Drop-off address/i), {
    target: { value: "2 Destination Road" },
  });
  fireEvent.change(screen.getByLabelText(/Scheduled start/i), {
    target: { value: "2026-11-22T09:00" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: /Continue to access needs/i })
  );
  await waitFor(() => {
    expect(
      screen.getByRole("checkbox", { name: /Hoist required/i })
    ).toHaveProperty("checked", true);
  });
  fireEvent.click(screen.getByRole("checkbox", { name: /Hoist required/i }));
  expect(
    screen.getByRole("checkbox", { name: /Hoist required/i })
  ).toHaveProperty("checked", false);

  fireEvent.click(screen.getByRole("button", { name: /Continue to consent/i }));
  fireEvent.click(screen.getByRole("button", { name: /Continue to confirm/i }));
  expect(screen.queryByText(/Rear hoist required/i)).toBeNull();
  fireEvent.click(screen.getByRole("checkbox", { name: /I confirm/i }));
  fireEvent.click(
    screen.getByRole("button", { name: /Confirm transport request/i })
  );
  await waitFor(() =>
    expect(
      fetchMock.mock.calls.some(
        ([url, init]) =>
          String(url) === "/api/transport/trips" &&
          (init as RequestInit | undefined)?.method === "POST"
      )
    ).toBe(true)
  );
  const tripCall = fetchMock.mock.calls.find(
    ([url, init]) =>
      String(url) === "/api/transport/trips" &&
      (init as RequestInit | undefined)?.method === "POST"
  );
  const body = JSON.parse(String((tripCall![1] as RequestInit).body));
  expect(body.prefillFromProfile).toBe(false);
  expect(body.mobilityRequirements.requiresHoist).toBe(false);
  expect(body.mobilityRequirements.requiresWheelchairAccessible).toBe(true);
});

it("submits only the choices still checked when the participant confirms", async () => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/api/transport/mobility-prefill")) {
      return Response.json({
        mobilityRequirements: {},
        fromProfile: false,
        profileShared: false,
      });
    }
    if (url === "/api/transport/trips" && init?.method === "POST") {
      return Response.json({ trip: { id: "trip-1" } }, { status: 201 });
    }
    return Response.json({}, { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  render(React.createElement(TransportBookingWorkspace));
  fireEvent.change(screen.getByLabelText(/Pickup address/i), {
    target: { value: "1 Pickup Street" },
  });
  fireEvent.change(screen.getByLabelText(/Drop-off address/i), {
    target: { value: "2 Destination Road" },
  });
  fireEvent.change(screen.getByLabelText(/Scheduled start/i), {
    target: { value: "2026-11-22T09:00" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: /Continue to access needs/i })
  );
  await waitFor(() =>
    expect(
      fetchMock.mock.calls.some(([url]) =>
        String(url).includes("/api/transport/mobility-prefill")
      )
    ).toBe(true)
  );
  fireEvent.click(screen.getByRole("button", { name: /Continue to consent/i }));
  const mobility = screen.getByRole("checkbox", {
    name: /Share functional mobility/i,
  });
  expect(
    screen
      .getAllByRole("checkbox")
      .every((box) => !(box as HTMLInputElement).checked)
  ).toBe(true);
  fireEvent.click(mobility);
  fireEvent.click(screen.getByRole("checkbox", { name: /Share kerbside/i }));
  fireEvent.click(mobility);
  fireEvent.click(screen.getByRole("button", { name: /Continue to confirm/i }));
  fireEvent.click(screen.getByRole("checkbox", { name: /I confirm/i }));
  fireEvent.click(
    screen.getByRole("button", { name: /Confirm transport request/i })
  );
  await waitFor(() =>
    expect(
      fetchMock.mock.calls.some(
        ([url, init]) =>
          String(url) === "/api/transport/trips" &&
          (init as RequestInit | undefined)?.method === "POST"
      )
    ).toBe(true)
  );
  const tripCall = fetchMock.mock.calls.find(
    ([url, init]) =>
      String(url) === "/api/transport/trips" &&
      (init as RequestInit | undefined)?.method === "POST"
  );
  expect(tripCall).toBeTruthy();
  expect(JSON.parse(String((tripCall![1] as RequestInit).body)).consentScopes).toEqual([
    "transport.kerbside_note",
  ]);
});

describe("list-first map toggle", () => {
  it("hides map in list-only mode", () => {
    expect(shouldShowBookingMap("split")).toBe(true);
    expect(shouldShowBookingMap("list")).toBe(false);
  });
});

describe("evidence pills", () => {
  it("uses structured text labels not colour-only status", () => {
    const { container } = render(
      React.createElement(SafePickupZoneOverlay, {
        zones: [
          {
            label: "Bay A",
            kerbGradient: "1:14 Compliant",
            checkedAt: "Oct 2026",
            source: "MapAble Assessor",
          },
        ],
      })
    );
    expect(screen.getByText("1:14 Compliant")).toBeTruthy();
    expect(screen.getByText(/MapAble Assessor/i)).toBeTruthy();
    expect(container.querySelector(".tb-evidence-pill")).toBeTruthy();
  });
});

describe("live telemetry shell", () => {
  it("disables boarding notify when live tracking is off", () => {
    render(
      React.createElement(LiveTripTelemetryBar, {
        liveEnabled: false,
        connectionState: "DISCONNECTED",
      })
    );
    expect(screen.getByText(/not available in this pilot/i)).toBeTruthy();
    const btn = screen.getByRole("button", { name: /ramp ready/i });
    expect(btn).toHaveProperty("disabled", true);
    expect(btn.getAttribute("aria-disabled")).toBe("true");
  });
});

describe("useTransportSocket flag-off helpers", () => {
  it("starts disconnected and keeps telemetry unavailable when GPS flag is off", () => {
    expect(initialTransportSocketState(false)).toBe("DISCONNECTED");
    expect(initialTransportSocketState(true)).toBe("CONNECTING");
    expect(boardingAlertNotEnabledMessage(false).reason).toBe("not_enabled");
    expect(boardingAlertNotEnabledMessage(true).reason).toBe("not_enabled");
  });
});

describe("AccessibleOsmMap SSR-safe shell", () => {
  it("imports via dynamic without requiring Leaflet on the server path", async () => {
    const mod = await import("@/components/transport/AccessibleOsmMap");
    expect(typeof mod.AccessibleOsmMap).toBe("function");
    const { AccessibleOsmMap } = mod;
    render(
      React.createElement(AccessibleOsmMap, {
        points: [],
        enabled: false,
      })
    );
    expect(screen.getByText(/list view is complete/i)).toBeTruthy();
  });
});
