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
  canSubmitTransportRequest,
  shouldShowBookingMap,
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

it("submits only the choices still checked when the participant confirms", async () => {
  const post = vi
    .fn()
    .mockResolvedValue(
      Response.json({ trip: { id: "trip-1" } }, { status: 201 })
    );
  vi.stubGlobal("fetch", post);
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
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
  const [url, init] = post.mock.calls[0];
  expect(url).toBe("/api/transport/trips");
  expect(JSON.parse(init.body).consentScopes).toEqual([
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
