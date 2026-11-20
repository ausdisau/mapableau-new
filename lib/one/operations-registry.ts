/**
 * MapAble One is an operating model over existing MapAble domains, not a
 * second scheduling, consent or accounting database. This is a read-only
 * capability register for product UI and delivery planning.
 */
export type OneOperationalDomain = "workforce" | "practice" | "employment" | "finance";
export type OneCapabilityStage = "existing_gated" | "directory_preview" | "planned";
export type OneCapability = {
  id: string;
  domain: OneOperationalDomain;
  title: string;
  description: string;
  stage: OneCapabilityStage;
  existingRoute?: string;
  caution: string;
};

export const MAPABLE_ONE_OPERATIONS: readonly OneCapability[] = [
  {
    id: "worker-rosters",
    domain: "workforce",
    title: "Rosters and shift coverage",
    description: "Reuse CareShift and the existing provider roster for work allocation and continuity.",
    stage: "existing_gated",
    existingRoute: "/provider/care/roster",
    caution: "A shift assignment is not worker acceptance or participant approval.",
  },
  {
    id: "worker-availability",
    domain: "workforce",
    title: "Workforce availability and capacity",
    description: "View capacity and worker evidence before any proposed roster allocation.",
    stage: "existing_gated",
    existingRoute: "/provider/capacity",
    caution: "Provider capacity and credential records are not proof of live worker screening.",
  },
  {
    id: "shifts-swaps-leave",
    domain: "workforce",
    title: "Leave, swaps, breaks and payroll-ready timesheets",
    description: "Native Deputy-style requests, approval, award-rule review and timesheet export.",
    stage: "planned",
    caution: "No automated substitution or payroll compliance guarantee; award interpretations require specialist review.",
  },
  {
    id: "appointments",
    domain: "practice",
    title: "Shared calendar and appointments",
    description: "Use existing calendar and booking records; add practitioner-controlled appointment slots after concurrency and consent gates.",
    stage: "existing_gated",
    existingRoute: "/provider/calendar",
    caution: "Current calendar entries are not externally bookable clinical appointment slots.",
  },
  {
    id: "rehab-directory",
    domain: "practice",
    title: "Rehabilitation service catalogue",
    description: "Discover imported therapy outlets with classification, provenance and uncertainty.",
    stage: "directory_preview",
    existingRoute: "/moves/directory",
    caution: "Directory presence does not establish professional registration, availability or suitability.",
  },
  {
    id: "clinical-plans",
    domain: "practice",
    title: "Clinician-authored plans and progress",
    description: "Separate gated Moves clinician plans from public directory search and generic provider operations.",
    stage: "existing_gated",
    existingRoute: "/clinician/moves",
    caution: "Access is restricted to appropriately authorised clinicians; no automatic treatment changes.",
  },
  {
    id: "practice-waitlist",
    domain: "practice",
    title: "Patient enquiries, triage and waitlists",
    description: "Native Splose-style referral requests, waitlist, notifications and cancellation recovery.",
    stage: "planned",
    caution: "Waitlist entry does not imply an appointment offer; safety triage remains a clinician responsibility.",
  },
  {
    id: "employment-market",
    domain: "employment",
    title: "Employment directory",
    description: "Source-labelled employment-support outlets and employer-controlled published job listings.",
    stage: "directory_preview",
    existingRoute: "/employment/directory",
    caution: "Employers must opt in; do not disclose adjustment requests or use disability in automated rejection.",
  },
  {
    id: "employer-jobs",
    domain: "employment",
    title: "Employer job management",
    description: "Existing job draft, publication and participant-controlled applications.",
    stage: "existing_gated",
    existingRoute: "/employer/jobs",
    caution: "Employer publishing, hiring status and application consent require independent workflow checks.",
  },
  {
    id: "work-coordination",
    domain: "employment",
    title: "Interviews, work support and transport",
    description: "Shared participant-confirmed appointment, support and transport intents.",
    stage: "planned",
    caution: "No silent care booking, interview attendance disclosure or linked trip modification.",
  },
  {
    id: "booking-evidence",
    domain: "finance",
    title: "Bookings and delivery evidence",
    description: "Reuse existing provider bookings and participant-reviewed service evidence as inputs to future invoices.",
    stage: "existing_gated",
    existingRoute: "/provider/bookings",
    caution: "A scheduled event is not a delivered or approved billable service.",
  },
  {
    id: "provider-billing",
    domain: "finance",
    title: "Billing and payouts",
    description: "Use provider-owned billing workflows; native ledger and reconciliation remain separately gated.",
    stage: "existing_gated",
    existingRoute: "/provider/billing",
    caution: "Payment availability, NDIS claiming and invoices are not assured by this operations board.",
  },
  {
    id: "finance-ledger",
    domain: "finance",
    title: "Native accounting and payroll",
    description: "Australian Disability Ltd-owned ledger, invoice lifecycle, reconciliation and replaceable regulated payment rails.",
    stage: "planned",
    caution: "No built-in ATO reporting, payroll certification or claims submission is implied.",
  },
] as const;

export function oneCapabilitiesByDomain(domain: OneOperationalDomain): OneCapability[] {
  return MAPABLE_ONE_OPERATIONS.filter((feature) => feature.domain === domain);
}

export function oneCapabilitySummary(): { existing: number; preview: number; planned: number } {
  return {
    existing: MAPABLE_ONE_OPERATIONS.filter((feature) => feature.stage === "existing_gated").length,
    preview: MAPABLE_ONE_OPERATIONS.filter((feature) => feature.stage === "directory_preview").length,
    planned: MAPABLE_ONE_OPERATIONS.filter((feature) => feature.stage === "planned").length,
  };
}
