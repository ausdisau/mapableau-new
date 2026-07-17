/**
 * @vitest-environment jsdom
 */
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ParticipantDashboard } from "@/components/participant/ParticipantDashboard";
import { QuickActionsPanel } from "@/components/participant/QuickActionsPanel";
import type { ParticipantDashboardData } from "@/types/participant-dashboard";

afterEach(() => {
  cleanup();
});

const emptyData: ParticipantDashboardData = {
  participantId: "p1",
  displayName: "Alex",
  viewAsDelegate: false,
  upcomingBookings: [],
  recentMessages: [],
  invoicesNeedingAttention: [],
  savedProviders: [],
  preferredWorkers: [],
  accessibility: {
    mobilityCount: 0,
    communicationCount: 0,
    hasProfile: false,
    summaryText: "Not set up yet.",
  },
};

describe("Participant dashboard UI", () => {
  it("renders all main sections with empty states", () => {
    render(<ParticipantDashboard data={emptyData} />);
    expect(screen.getByRole("heading", { name: /hello, alex/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /upcoming support/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /recent messages/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /invoices needing attention/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /saved providers/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /preferred workers/i })).toBeTruthy();
    expect(screen.getByText(/no upcoming bookings/i)).toBeTruthy();
  });

  it("quick actions link to expected routes", () => {
    render(<QuickActionsPanel />);
    expect(screen.getByRole("link", { name: /find a provider/i }).getAttribute("href")).toBe(
      "/provider-finder",
    );
    expect(screen.getByRole("link", { name: /request care/i }).getAttribute("href")).toBe(
      "/dashboard/bookings/new",
    );
    expect(screen.getByRole("link", { name: /view invoices/i }).getAttribute("href")).toBe(
      "/dashboard/invoices",
    );
  });
});
