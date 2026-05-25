/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => cleanup());

import { FindMyLocationButton } from "@/components/provider-finder/FindMyLocationButton";
import { UserLocationStatus } from "@/components/provider-finder/UserLocationStatus";

describe("FindMyLocationButton", () => {
  it("renders accessible button text", () => {
    render(<FindMyLocationButton onClick={() => {}} />);
    expect(
      screen.getByRole("button", { name: /find my location/i }),
    ).toBeTruthy();
  });

  it("calls onClick when activated", () => {
    const onClick = vi.fn();
    render(<FindMyLocationButton onClick={onClick} />);
    fireEvent.click(
      screen.getAllByRole("button", { name: /find my location/i })[0],
    );
    expect(onClick).toHaveBeenCalled();
  });

  it("shows loading label while requesting", () => {
    render(<FindMyLocationButton onClick={() => {}} isRequesting />);
    expect(
      screen.getByRole("button", { name: /finding your location/i }),
    ).toBeTruthy();
  });
});

describe("UserLocationStatus", () => {
  it("shows permission denied fallback", () => {
    render(
      <UserLocationStatus
        status="denied"
        isActive={false}
        errorMessage="We could not access your location. You can enter a suburb or postcode instead."
      />,
    );
    expect(screen.getByRole("alert").textContent).toMatch(/could not access/i);
  });

  it("shows success message when location active", () => {
    render(
      <UserLocationStatus status="granted" isActive errorMessage={null} />,
    );
    expect(screen.getByText(/near your current location/i)).toBeTruthy();
  });
});
