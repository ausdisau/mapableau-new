import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("participant-facing copy does not imply unverified live capabilities", () => {
  it("never displays example access metrics as published intelligence", () => {
    const page = source("app/access-intelligence/page.tsx");
    expect(page).not.toContain('value: "Demo"');
    expect(page).toContain("No live statistics, verified counts");
  });

  it("marks fictional access profiles and keeps them out of structured place data", () => {
    const page = source("app/accessibility-map/[slug]/page.tsx");
    expect(page).toContain("robots: { index: false, follow: false }");
    expect(page).toContain('place.isDemo || place.tier === "Unverified"');
    expect(page).toContain("unassessed ? null : buildPlaceAccessibilityJsonLd");
    expect(page).toContain("Accessibility has not been independently assessed");
    expect(page).toContain("jsonLd ? <JsonLd data={jsonLd} /> : null");
    expect(page).toContain("Access status: Unknown");
  });

  it("removes fabricated confidence scores and does not claim transport booking", () => {
    const journey = source("components/journey/JourneyPlannerForm.tsx");
    expect(journey).not.toContain("confidenceScore: 58");
    expect(journey).not.toContain("Build demo journey plan");
    expect(journey).toContain("route safety, travel time and availability are unverified");
  });

  it("does not show invented partner analytics or referral earnings", () => {
    const partner = source("app/partner/page.tsx");
    const analytics = source("app/partner/analytics/page.tsx");
    const referrals = source("app/partner/referrals/page.tsx");
    expect(partner).not.toContain('value: "128,450"');
    expect(partner).not.toContain('value: "$4,800"');
    expect(analytics).not.toContain("Elevator Outage at Central Station");
    expect(referrals).not.toContain("partner_123");
    expect(referrals).not.toContain("partner_${orgIds[0].slice");
    expect(analytics).toContain("No verified report is available");
  });

  it("never presents a sample accreditation score or issued award", () => {
    const form = source("components/venue/VerifyVenueForm.tsx");
    expect(form).not.toContain("78 (demo)");
    expect(form).not.toContain("<dd>Silver</dd>");
    expect(form).toContain("<dd>Not assessed</dd>");
    expect(form).toContain("No request was created, sent or saved");
  });

  it("keeps test credentials off production login and disables fake exports", () => {
    const login = source("client/src/pages/login.tsx");
    const reportButton = source("components/partner/DownloadReportButton.tsx");
    expect(login).toContain("import.meta.env.DEV");
    expect(reportButton).toContain("disabled");
    expect(reportButton).not.toContain("setTimeout");
  });

  it("does not present KML-imported or fictional places as assessed in map UI", () => {
    const cards = source("components/accessibility-map/VenueListCard.tsx");
    const cardsV2 = source("components/accessibility-map/VenueListCardV2.tsx");
    const popup = source("components/accessibility-map/AccessibilityMapPopup.tsx");
    for (const component of [cards, cardsV2, popup]) {
      expect(component).toContain('place.isDemo || place.tier === "Unverified"');
      expect(component).toContain("unassessed");
    }
    expect(cards).toContain("Access status unknown");
    expect(cardsV2).toContain("personal access fit are unknown");
    expect(popup).toContain("Current accessibility conditions and access fit are unknown");
  });

  it("does not infer assessment authority from a tier label alone", () => {
    const marker = source("components/access/AccessDataSourceMarker.tsx");
    expect(marker).not.toContain('input.tier !== "Unverified"');
    expect(marker).toContain("A tier label alone is not evidence");
  });

  it("retains explicit factual limits for fictional community mapping", () => {
    const signals = source("components/access-signals/AccessSignalsShell.tsx");
    const landing = source("components/marketing/home/HomepageMapPreview.tsx");
    expect(signals).toContain("fictional route and feature information");
    expect(signals).toContain("does not");
    expect(landing).toMatch(/not assessed|not been assessed/i);
    expect(landing).not.toContain("score {place.accessScore}");
  });
});
