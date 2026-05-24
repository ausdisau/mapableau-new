/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FooterRegistrationDetails } from "@/components/marketing/mapable/FooterRegistrationDetails";
import { WavyText } from "@/components/marketing/mapable/WavyText";
import {
  MAPABLE_ABN_DISPLAY,
  MAPABLE_NDIS_REGISTRATION,
  MAPABLE_SUPPORT_EMAIL,
  MAPABLE_SUPPORT_PHONE,
} from "@/lib/brand/constants";
import {
  filterProviders,
  selectSponsoredResult,
} from "@/lib/provider-finder/filter-providers";
import { MOCK_PROVIDER_PROFILES } from "@/lib/provider-finder/mock-data";

describe("filterProviders", () => {
  it("returns providers for blank search", () => {
    const result = filterProviders(MOCK_PROVIDER_PROFILES, {
      query: "",
      location: "",
      supportArea: "all",
      accessNeeds: [],
      fundingType: "all",
    });
    expect(result.length).toBe(MOCK_PROVIDER_PROFILES.length);
  });

  it("filters by support area", () => {
    const result = filterProviders(MOCK_PROVIDER_PROFILES, {
      query: "",
      location: "",
      supportArea: "transport",
      accessNeeds: [],
      fundingType: "all",
    });
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every((p) => /transport/i.test(`${p.category} ${p.description}`)),
    ).toBe(true);
  });

  it("filters by access need", () => {
    const result = filterProviders(MOCK_PROVIDER_PROFILES, {
      query: "",
      location: "",
      supportArea: "all",
      accessNeeds: ["auslan"],
      fundingType: "all",
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.accessNeeds.some((a) => /auslan/i.test(a)))).toBe(
      true,
    );
  });

  it("filters by funding type", () => {
    const result = filterProviders(MOCK_PROVIDER_PROFILES, {
      query: "",
      location: "",
      supportArea: "all",
      accessNeeds: [],
      fundingType: "ndis",
    });
    expect(result.every((p) => /ndis registered/i.test(p.funding))).toBe(true);
  });

  it("filters by query text", () => {
    const result = filterProviders(MOCK_PROVIDER_PROFILES, {
      query: "therapy",
      location: "",
      supportArea: "all",
      accessNeeds: [],
      fundingType: "all",
    });
    expect(result.some((p) => /therapy/i.test(p.name + p.category))).toBe(true);
  });
});

describe("selectSponsoredResult", () => {
  it("returns at most one featured provider", () => {
    const sponsored = selectSponsoredResult(MOCK_PROVIDER_PROFILES);
    expect(sponsored).not.toBeNull();
    expect(sponsored?.featured).toBe(true);
  });
});

describe("WavyText accessibility", () => {
  it("exposes full text via aria-label", () => {
    render(<WavyText text="Care and support" />);
    expect(screen.getByLabelText("Care and support")).toBeTruthy();
  });
});

describe("FooterRegistrationDetails", () => {
  it("includes registration constants", () => {
    render(<FooterRegistrationDetails />);
    expect(screen.getByText(MAPABLE_ABN_DISPLAY)).toBeTruthy();
    expect(screen.getByText(MAPABLE_NDIS_REGISTRATION)).toBeTruthy();
    expect(screen.getByText(MAPABLE_SUPPORT_EMAIL)).toBeTruthy();
    expect(screen.getByText(MAPABLE_SUPPORT_PHONE)).toBeTruthy();
  });
});
