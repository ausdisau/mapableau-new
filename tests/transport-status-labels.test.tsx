/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { TripStatusTracker } from "@/components/transport/TripStatusTracker";

describe("TripStatusTracker", () => {
  it("shows plain-language status", () => {
    render(
      <TripStatusTracker
        status="driver_en_route"
        pickupAddress="1 Main St"
        dropoffAddress="100 Clinic Rd"
      />,
    );
    expect(screen.getByRole("heading", { name: /trip status/i })).toBeTruthy();
    expect(screen.getByText(/driver on the way/i)).toBeTruthy();
    expect(screen.getByText(/1 Main St/)).toBeTruthy();
  });
});
