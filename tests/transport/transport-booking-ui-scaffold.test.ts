/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConsentScopeDrawer } from "@/components/transport/ConsentScopeDrawer";
import { HumanGateConfirmationCard } from "@/components/transport/HumanGateConfirmationCard";
import { LiveTripTelemetryBar } from "@/components/transport/LiveTripTelemetryBar";
import { SafePickupZoneOverlay } from "@/components/transport/SafePickupZoneOverlay";
import {
  canSubmitTransportRequest,
  shouldShowBookingMap,
} from "@/components/transport/TransportBookingWorkspace";
import {
  boardingAlertNotEnabledMessage,
  initialTransportSocketState,
} from "@/lib/realtime/use-transport-socket";

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
