import { interestFormTypeLabels, type InterestFormInput } from "@/lib/interest/interest-form-schema";
import { sendContactFormEmail } from "@/lib/contact/send-contact-email";

export async function sendInterestFormEmail(submission: InterestFormInput) {
  const topicLabel = interestFormTypeLabels[submission.formType];
  const messageParts = [
    `Interest type: ${topicLabel}`,
    `Role or organisation: ${submission.roleOrOrganisation}`,
    `Location: ${submission.location}`,
    submission.phone ? `Phone: ${submission.phone}` : null,
    submission.accessNeedsOrInterest
      ? `Access needs or service interest: ${submission.accessNeedsOrInterest}`
      : null,
    submission.message ? `Message: ${submission.message}` : null,
  ].filter(Boolean);

  await sendContactFormEmail({
    name: submission.name,
    email: submission.email,
    topic: "pilot",
    message: messageParts.join("\n"),
  });
}
