import type { TransportAccessFitStatus } from "@prisma/client";

import { parseMobilityRequirements } from "@/lib/transport/mobility-schema";

export type SandboxQuoteFixture = {
  id: string;
  operatorName: string;
  operatorOrganisationId: string;
  quoteSource: "sandbox";
  sandbox: true;
  isEstimate: boolean;
  accessFit: TransportAccessFitStatus;
  accessFitReasons: string[];
  estimatedDurationSeconds: number;
  estimatedDistanceMetres: number;
  fareBreakdownCents: {
    baseCents: number;
    distanceCents: number;
    assistanceCents: number;
    participantPaidCents: number;
    potentiallyClaimableCents: number;
  };
  totalCents: number;
  currency: "AUD";
  validUntil: string;
  source: "sandbox_fixture";
  generatedAt: string;
  freshness: "deterministic";
  advisory: true;
};

/**
 * Deterministic sandbox quotes for local development.
 * Never render as live providers on the public site.
 */
export function buildSandboxQuotes(input: {
  mobilityRequirements?: Record<string, unknown>;
  operatorOrganisationId: string;
}): SandboxQuoteFixture[] {
  const reqs = parseMobilityRequirements(input.mobilityRequirements ?? {});
  const now = new Date().toISOString();
  const validUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const sedanFit: TransportAccessFitStatus =
    reqs.requiresWheelchairAccessible || reqs.requiresLift || reqs.requiresRamp
      ? "fail"
      : "fit";

  const wavFit: TransportAccessFitStatus = reqs.requiresLift
    ? "manual_review"
    : reqs.requiresWheelchairAccessible || reqs.requiresRamp
      ? "fit"
      : "fit";

  const quotes: SandboxQuoteFixture[] = [
    {
      id: "sandbox-sedan",
      operatorName: "Sandbox Accessible Sedan",
      operatorOrganisationId: input.operatorOrganisationId,
      quoteSource: "sandbox",
      sandbox: true,
      isEstimate: true,
      accessFit: sedanFit,
      accessFitReasons:
        sedanFit === "fail"
          ? ["Vehicle is not wheelchair accessible", "No ramp or lift"]
          : ["Ambulatory or transfer-capable seating available"],
      estimatedDurationSeconds: 1800,
      estimatedDistanceMetres: 12000,
      fareBreakdownCents: {
        baseCents: 2500,
        distanceCents: 1800,
        assistanceCents: 0,
        participantPaidCents: 4300,
        potentiallyClaimableCents: 0,
      },
      totalCents: 4300,
      currency: "AUD",
      validUntil,
      source: "sandbox_fixture",
      generatedAt: now,
      freshness: "deterministic",
      advisory: true,
    },
    {
      id: "sandbox-wav",
      operatorName: "Sandbox Wheelchair Accessible Vehicle",
      operatorOrganisationId: input.operatorOrganisationId,
      quoteSource: "sandbox",
      sandbox: true,
      isEstimate: true,
      accessFit: wavFit,
      accessFitReasons:
        wavFit === "manual_review"
          ? ["Lift capacity measurements incomplete — manual review required"]
          : ["Wheelchair position and ramp available"],
      estimatedDurationSeconds: 2100,
      estimatedDistanceMetres: 12500,
      fareBreakdownCents: {
        baseCents: 3500,
        distanceCents: 2200,
        assistanceCents: 800,
        participantPaidCents: 6500,
        potentiallyClaimableCents: 0,
      },
      totalCents: 6500,
      currency: "AUD",
      validUntil,
      source: "sandbox_fixture",
      generatedAt: now,
      freshness: "deterministic",
      advisory: true,
    },
  ];
  return quotes.filter((q) => q.accessFit !== "fail");
}

export function fundingLabelForDeclared(
  declared: string | undefined | null
): string {
  switch (declared) {
    case "private_pay":
      return "Private pay";
    case "self_managed":
    case "plan_managed":
    case "ndia_managed":
      return "Funding eligibility not verified";
    case "other":
    case "unsure":
    default:
      return "Funding eligibility not verified";
  }
}
