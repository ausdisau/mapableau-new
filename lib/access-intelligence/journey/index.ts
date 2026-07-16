/**
 * System 2 — Journey preflight, guardian recovery, offline visit packs.
 */

import { createHash } from "crypto";

import { accessIntelligenceFlags } from "@/lib/access-intelligence/feature-flags";
import type { VisitPlan } from "@/lib/access-intelligence/schemas";

export type PreflightCheckCode =
  | "transport_booking"
  | "vehicle_accessibility"
  | "driver_assignment"
  | "support_worker"
  | "appointment_state"
  | "opening_hours"
  | "accessible_entrance_hours"
  | "lift_state"
  | "toilet_state"
  | "incidents"
  | "temporary_routes"
  | "weather_segment"
  | "venue_assistance"
  | "return_trip"
  | "evidence_freshness";

export type PreflightFinding = {
  code: PreflightCheckCode;
  severity: "info" | "warning" | "blocker";
  message: string;
  details?: Record<string, unknown>;
};

export type PreflightContext = {
  visitPlan: VisitPlan;
  transportBookingStatus?: "confirmed" | "pending" | "missing" | "cancelled";
  vehicleAccessible?: boolean | null;
  driverAssigned?: boolean | null;
  supportWorkerAvailable?: boolean | null;
  appointmentState?: "confirmed" | "relocated" | "cancelled" | "unknown";
  destinationOpen?: boolean | null;
  entranceOpen?: boolean | null;
  liftAvailable?: boolean | null;
  toiletOperating?: boolean | null;
  activeIncidents?: Array<{ id: string; summary: string; severity: string }>;
  evidenceStaleFeatureTypes?: string[];
  returnTripReady?: boolean | null;
  venueAssistanceConfirmed?: boolean | null;
};

export function runVisitPreflight(ctx: PreflightContext): {
  findings: PreflightFinding[];
  blockerCount: number;
} {
  const findings: PreflightFinding[] = [];

  if (ctx.transportBookingStatus === "missing" || ctx.transportBookingStatus === "cancelled") {
    findings.push({
      code: "transport_booking",
      severity: "blocker",
      message: "Transport booking is missing or cancelled.",
      details: { status: ctx.transportBookingStatus },
    });
  } else if (ctx.transportBookingStatus === "pending") {
    findings.push({
      code: "transport_booking",
      severity: "warning",
      message: "Transport booking is still pending confirmation.",
    });
  }

  if (ctx.vehicleAccessible === false) {
    findings.push({
      code: "vehicle_accessibility",
      severity: "blocker",
      message: "Assigned vehicle does not meet accessibility requirements.",
    });
  }
  if (ctx.driverAssigned === false) {
    findings.push({
      code: "driver_assignment",
      severity: "warning",
      message: "No driver assigned yet.",
    });
  }
  if (ctx.supportWorkerAvailable === false) {
    findings.push({
      code: "support_worker",
      severity: "blocker",
      message: "Support worker is unavailable for the visit window.",
    });
  }
  if (ctx.appointmentState === "cancelled") {
    findings.push({
      code: "appointment_state",
      severity: "blocker",
      message: "Linked appointment is cancelled.",
    });
  } else if (ctx.appointmentState === "relocated") {
    findings.push({
      code: "appointment_state",
      severity: "warning",
      message: "Appointment was relocated — verify destination access.",
    });
  }
  if (ctx.destinationOpen === false) {
    findings.push({
      code: "opening_hours",
      severity: "blocker",
      message: "Destination appears closed at the planned visit time.",
    });
  }
  if (ctx.entranceOpen === false) {
    findings.push({
      code: "accessible_entrance_hours",
      severity: "blocker",
      message: "Accessible entrance is closed at the planned time.",
    });
  }
  if (ctx.liftAvailable === false) {
    findings.push({
      code: "lift_state",
      severity: "blocker",
      message: "Lift outage detected — recalculate route before departure.",
    });
  }
  if (ctx.toiletOperating === false) {
    findings.push({
      code: "toilet_state",
      severity: "warning",
      message: "Accessible toilet is reported out of service.",
    });
  }
  for (const incident of ctx.activeIncidents ?? []) {
    findings.push({
      code: "incidents",
      severity: incident.severity === "critical" ? "blocker" : "warning",
      message: `Active incident: ${incident.summary}`,
      details: { incidentId: incident.id },
    });
  }
  if (ctx.evidenceStaleFeatureTypes?.length) {
    findings.push({
      code: "evidence_freshness",
      severity: "warning",
      message: `Stale evidence for: ${ctx.evidenceStaleFeatureTypes.join(", ")}. Treat as unknown.`,
      details: { featureTypes: ctx.evidenceStaleFeatureTypes },
    });
  }
  if (ctx.returnTripReady === false) {
    findings.push({
      code: "return_trip",
      severity: "warning",
      message: "Return trip is not ready.",
    });
  }
  if (ctx.venueAssistanceConfirmed === false) {
    findings.push({
      code: "venue_assistance",
      severity: "info",
      message: "Venue assistance has not been confirmed.",
    });
  }

  return {
    findings,
    blockerCount: findings.filter((f) => f.severity === "blocker").length,
  };
}

export type DisruptionType =
  | "late_vehicle"
  | "missed_connection_risk"
  | "lift_outage"
  | "entrance_closure"
  | "route_obstruction"
  | "support_worker_delay"
  | "venue_closure"
  | "appointment_relocation"
  | "waiting_conditions"
  | "return_trip_failure";

export function buildRecoveryProposal(input: {
  disruptionType: DisruptionType;
  originalPlan: VisitPlan;
  revisedRouteSummary: {
    distanceDeltaMetres?: number;
    timeDeltaMinutes?: number;
    effortDelta?: string;
    confidenceDelta?: number;
  };
}): {
  proposalHash: string;
  summary: string;
  revisedPlan: VisitPlan;
  deltaSummary: Record<string, unknown>;
  requiresApproval: true;
} {
  const revisedPlan: VisitPlan = {
    ...structuredClone(input.originalPlan),
    lastCheckedAt: input.originalPlan.lastCheckedAt,
    contingencyInstructions: [
      ...input.originalPlan.contingencyInstructions,
      `Recovery for ${input.disruptionType}`,
    ],
  };
  const deltaSummary = {
    disruptionType: input.disruptionType,
    ...input.revisedRouteSummary,
    originalPreserved: true,
  };
  const proposalHash = createHash("sha256")
    .update(
      JSON.stringify({
        visitPlanId: input.originalPlan.id,
        disruptionType: input.disruptionType,
        revisedRouteSummary: input.revisedRouteSummary,
        contingencyTail: revisedPlan.contingencyInstructions.at(-1),
      }),
    )
    .digest("hex")
    .slice(0, 32);

  return {
    proposalHash,
    summary: `Proposed recovery for ${input.disruptionType}. Approval required before rebooking or disclosure.`,
    revisedPlan,
    deltaSummary,
    requiresApproval: true,
  };
}

export function renderOfflineVisitPack(input: {
  visitPlan: VisitPlan;
  placeName: string;
  entranceImageAlt?: string;
  facilities: string[];
  fallbackRoute?: string[];
  contacts: string[];
  unknowns: string[];
  evidenceDates: string[];
  plainLanguage?: boolean;
}): {
  format: "html";
  contentHtml: string;
  updateTimestamp: string;
} {
  const updateTimestamp = new Date().toISOString();
  const title = input.plainLanguage
    ? `Visit pack for ${input.placeName}`
    : `Offline Visit Pack — ${input.placeName}`;
  const steps = (input.visitPlan.arrivalInstructions ?? []).map(
    (s, i) => `<li>${escapeHtml(s)}</li>`,
  );
  const fallback = (input.fallbackRoute ?? []).map(
    (s) => `<li>${escapeHtml(s)}</li>`,
  );
  const contentHtml = `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(title)}</title>
  <style>
    body{font-family:system-ui,sans-serif;line-height:1.5;margin:1.5rem;max-width:40rem}
    h1{font-size:1.75rem} h2{font-size:1.25rem}
    .unknown{border-left:4px solid #b45309;padding-left:.75rem}
    @media print{body{margin:0}}
  </style>
</head>
<body>
  <header><h1>${escapeHtml(title)}</h1>
  <p>Updated ${escapeHtml(updateTimestamp)}</p></header>
  <main>
    <section aria-labelledby="route"><h2 id="route">Route</h2>
      <ol>${steps.join("") || "<li>No route steps saved.</li>"}</ol>
    </section>
    <section aria-labelledby="facilities"><h2 id="facilities">Facilities</h2>
      <ul>${input.facilities.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}</ul>
    </section>
    ${input.entranceImageAlt ? `<section><h2>Entrance</h2><p>${escapeHtml(input.entranceImageAlt)}</p></section>` : ""}
    <section aria-labelledby="fallback"><h2 id="fallback">Fallback route</h2>
      <ol>${fallback.join("") || "<li>No fallback recorded.</li>"}</ol>
    </section>
    <section class="unknown" aria-labelledby="unknowns"><h2 id="unknowns">Unresolved unknowns</h2>
      <ul>${input.unknowns.map((u) => `<li>${escapeHtml(u)}</li>`).join("") || "<li>None listed.</li>"}</ul>
    </section>
    <section aria-labelledby="evidence"><h2 id="evidence">Evidence dates</h2>
      <ul>${input.evidenceDates.map((d) => `<li>${escapeHtml(d)}</li>`).join("")}</ul>
    </section>
    <section aria-labelledby="contacts"><h2 id="contacts">Approved contacts</h2>
      <ul>${input.contacts.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>
    </section>
  </main>
</body>
</html>`;

  return { format: "html", contentHtml, updateTimestamp };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function assertJourneyFlags(kind: "preflight" | "guardian" | "pack"): void {
  if (kind === "preflight" && !accessIntelligenceFlags.journeyPreflight) {
    throw new Error("Journey preflight disabled.");
  }
  if (kind === "guardian" && !accessIntelligenceFlags.journeyGuardian) {
    throw new Error("Journey Guardian disabled.");
  }
  if (kind === "pack" && !accessIntelligenceFlags.offlineVisitPack) {
    throw new Error("Offline visit packs disabled.");
  }
}
