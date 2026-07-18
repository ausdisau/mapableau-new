/**
 * @vitest-environment jsdom
 */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StreetAddressAutocomplete } from "@/components/addresses/StreetAddressAutocomplete";
import { BookingWizard } from "@/components/bookings/BookingWizard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

afterEach(() => {
  cleanup();
});

describe("StreetAddressAutocomplete", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/addresses/resolve")) {
          return {
            ok: true,
            json: async () => ({
              address: {
                id: "s1",
                formattedAddress: "116 WARREN AVENUE, NORTH NOWRA NSW 2541",
                suburb: "NORTH NOWRA",
                state: "NSW",
                postcode: "2541",
                lat: -34.85,
                lng: 150.58,
                gnafId: "GANSW705536561",
              },
            }),
          };
        }
        return {
          ok: true,
          json: async () => ({
            groups: {
              providers: [],
              services: [],
              locations: [
                {
                  id: "geoscape-s1-0",
                  type: "location",
                  typeLabel: "Address",
                  label: "116 WARREN AV NORTH NOWRA NSW 2541",
                  value: "116 WARREN AV NORTH NOWRA NSW 2541",
                  metadata: {
                    gnafId: "s1",
                    suburb: "NORTH NOWRA",
                    state: "NSW",
                    postcode: "2541",
                  },
                },
              ],
              accessibilityFeatures: [],
              languages: [],
              popularSearches: [],
            },
            meta: { mode: "reactive", degraded: false },
          }),
        };
      }) as unknown as typeof fetch,
    );
  });

  it("renders with booking helper text", () => {
    render(
      <StreetAddressAutocomplete
        label="Pickup address"
        context="transport_request"
        value=""
        onChange={() => {}}
        debounceMs={0}
      />,
    );
    expect(screen.getByLabelText("Pickup address")).toBeTruthy();
    expect(
      screen.getByText(/Australian street suggestions/i),
    ).toBeTruthy();
  });

  it("resolves selection and calls onResolved", async () => {
    const onChange = vi.fn();
    const onResolved = vi.fn();

    render(
      <StreetAddressAutocomplete
        label="Pickup address"
        context="booking"
        value="116"
        onChange={onChange}
        onResolved={onResolved}
        debounceMs={0}
      />,
    );

    const input = screen.getByLabelText("Pickup address");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "116 Warren" } });

    const option = await screen.findByRole("option", {
      name: /116 WARREN AV NORTH NOWRA/i,
    });
    fireEvent.click(option);

    await waitFor(() => {
      expect(onResolved).toHaveBeenCalled();
    });
    expect(onResolved.mock.calls[0]?.[0]).toMatchObject({
      formattedAddress: "116 WARREN AVENUE, NORTH NOWRA NSW 2541",
      suburb: "NORTH NOWRA",
    });
  });
});

describe("BookingWizard street fields", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          groups: {
            providers: [],
            services: [],
            locations: [],
            accessibilityFeatures: [],
            languages: [],
            popularSearches: [],
          },
          meta: { mode: "reactive", degraded: false },
        }),
      })) as unknown as typeof fetch,
    );
  });

  it("shows street autocomplete on care details step", () => {
    render(<BookingWizard />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByLabelText("Care location")).toBeTruthy();
    expect(
      screen.getByText(/Australian street suggestions/i),
    ).toBeTruthy();
  });
});
