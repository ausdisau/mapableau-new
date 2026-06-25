import { MAPABLE_SUPPORT_EMAIL } from "@/lib/brand/constants";
import {
  interestRoleLabels,
  type InterestFormInput,
} from "@/lib/contact/interest-form-schema";
import { getVerticalById } from "@/lib/mapable/verticals";

export function isInterestEmailConfigured(): boolean {
  return Boolean(
    process.env.SENDGRID_API_KEY?.trim() &&
      process.env.SENDGRID_FROM_EMAIL?.trim(),
  );
}

function interestInbox(): string {
  return (
    process.env.MAPABLE_CONTACT_INBOX?.trim() ||
    process.env.SENDGRID_FROM_EMAIL?.trim() ||
    MAPABLE_SUPPORT_EMAIL
  );
}

function verticalNames(ids: string[]): string {
  return ids
    .map((id) => getVerticalById(id)?.name ?? id)
    .join(", ");
}

export async function sendInterestFormEmail(
  submission: InterestFormInput,
): Promise<void> {
  const roleLabel = interestRoleLabels[submission.role];
  const verticalsLabel = verticalNames(submission.interestedVerticals);
  const subject = `[MapAble Interest] ${roleLabel} — ${submission.name}`;
  const text = [
    `Name: ${submission.name}`,
    submission.organisation ? `Organisation: ${submission.organisation}` : null,
    `Email: ${submission.email}`,
    submission.phone ? `Phone: ${submission.phone}` : null,
    `Role: ${roleLabel}`,
    `Interested verticals: ${verticalsLabel}`,
    `Location: ${submission.location}`,
    `Wants to help test: ${submission.consentTesting ? "Yes" : "No"}`,
    "",
    submission.message,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <p><strong>Name:</strong> ${escapeHtml(submission.name)}</p>
    ${submission.organisation ? `<p><strong>Organisation:</strong> ${escapeHtml(submission.organisation)}</p>` : ""}
    <p><strong>Email:</strong> ${escapeHtml(submission.email)}</p>
    ${submission.phone ? `<p><strong>Phone:</strong> ${escapeHtml(submission.phone)}</p>` : ""}
    <p><strong>Role:</strong> ${escapeHtml(roleLabel)}</p>
    <p><strong>Interested verticals:</strong> ${escapeHtml(verticalsLabel)}</p>
    <p><strong>Location:</strong> ${escapeHtml(submission.location)}</p>
    <p><strong>Wants to help test:</strong> ${submission.consentTesting ? "Yes" : "No"}</p>
    <hr />
    <p>${escapeHtml(submission.message).replace(/\n/g, "<br />")}</p>
  `.trim();

  if (!isInterestEmailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[interest] submission (dev only):\n", text);
      return;
    }
    throw new Error("Interest email is not configured");
  }

  const apiKey = process.env.SENDGRID_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("SENDGRID_API_KEY is not configured");
  }

  const sgMail = await import("@sendgrid/mail");
  sgMail.default.setApiKey(apiKey);

  const from = process.env.SENDGRID_FROM_EMAIL?.trim();
  if (!from) {
    throw new Error("SENDGRID_FROM_EMAIL is not configured");
  }

  await sgMail.default.send({
    to: interestInbox(),
    from,
    replyTo: { email: submission.email, name: submission.name },
    subject,
    text,
    html,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
