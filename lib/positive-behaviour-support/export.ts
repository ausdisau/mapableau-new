import { PBS_POSITIONING, type PbsPlanStatus, type PbsPlanType } from "./types";

export type PbsExportView =
  | "practitioner_working"
  | "participant_plain_language"
  | "easy_read_summary"
  | "implementing_worker_instructions"
  | "accessible_printable_html"
  | "structured_export";

export interface PbsExportInput {
  view: PbsExportView;
  planId: string;
  planType: PbsPlanType;
  status: PbsPlanStatus;
  versionNumber: number;
  authoringPractitionerDisplay: string;
  consultationStatus: string;
  reviewDate: string | null;
  aiAssisted: boolean;
  unresolvedInformation: string[];
  restrictivePracticeStatus: string | null;
  bodySections: Array<{ title: string; body: string }>;
  provenanceCount: number;
  checklistResults?: Array<{ item: string; status: string }>;
}

export interface PbsExportResult {
  view: PbsExportView;
  html: string;
  structured: Record<string, unknown>;
}

function commonBanner(input: PbsExportInput): string {
  return [
    `<p><strong>Status:</strong> ${escapeHtml(input.status)}</p>`,
    `<p><strong>Plan type:</strong> ${escapeHtml(input.planType)} · <strong>Version:</strong> ${input.versionNumber}</p>`,
    `<p><strong>Authoring practitioner:</strong> ${escapeHtml(input.authoringPractitionerDisplay)}</p>`,
    `<p><strong>Consultation status:</strong> ${escapeHtml(input.consultationStatus)}</p>`,
    `<p><strong>Review date:</strong> ${escapeHtml(input.reviewDate ?? "Not set")}</p>`,
    `<p><strong>AI assisted:</strong> ${input.aiAssisted ? "Yes (proposals only; not clinical determinations)" : "No"}</p>`,
    `<p><strong>Unresolved information:</strong> ${
      input.unresolvedInformation.length
        ? escapeHtml(input.unresolvedInformation.join("; "))
        : "None recorded"
    }</p>`,
    input.restrictivePracticeStatus
      ? `<p><strong>Restrictive-practice status:</strong> ${escapeHtml(input.restrictivePracticeStatus)}</p>`
      : "",
    `<p><em>${escapeHtml(PBS_POSITIONING)}</em></p>`,
    `<p><strong>Important:</strong> This export was not lodged with or approved by the NDIS Commission.</p>`,
  ]
    .filter(Boolean)
    .join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function generatePbsExport(input: PbsExportInput): PbsExportResult {
  const sectionHtml = input.bodySections
    .map(
      (s) =>
        `<section><h2>${escapeHtml(s.title)}</h2><p>${escapeHtml(s.body)}</p></section>`,
    )
    .join("\n");

  let title = "Behaviour support plan export";
  switch (input.view) {
    case "practitioner_working":
      title = "Practitioner working view";
      break;
    case "participant_plain_language":
      title = "Participant plain-language version";
      break;
    case "easy_read_summary":
      title = "Easy Read summary";
      break;
    case "implementing_worker_instructions":
      title = "Implementing worker instructions";
      break;
    case "accessible_printable_html":
      title = "Accessible printable plan";
      break;
    case "structured_export":
      title = "Structured export with provenance";
      break;
    default: {
      const _exhaustive: never = input.view;
      throw new Error(`Unknown export view: ${_exhaustive}`);
    }
  }

  const html = `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
</head>
<body>
  <main>
    <h1>${escapeHtml(title)}</h1>
    ${commonBanner(input)}
    ${sectionHtml}
    <p>Provenance statements recorded: ${input.provenanceCount}</p>
  </main>
</body>
</html>`;

  const structured = {
    view: input.view,
    planId: input.planId,
    planType: input.planType,
    status: input.status,
    versionNumber: input.versionNumber,
    authoringPractitionerDisplay: input.authoringPractitionerDisplay,
    consultationStatus: input.consultationStatus,
    reviewDate: input.reviewDate,
    aiAssisted: input.aiAssisted,
    unresolvedInformation: input.unresolvedInformation,
    restrictivePracticeStatus: input.restrictivePracticeStatus,
    provenanceCount: input.provenanceCount,
    checklistResults: input.checklistResults ?? [],
    commissionLodgementClaim: false,
    positioning: PBS_POSITIONING,
  };

  return { view: input.view, html, structured };
}
