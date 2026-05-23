export async function sendEmailNotification(input: {
  to: string;
  subject: string;
  body: string;
}): Promise<{ sent: boolean; provider: string }> {
  if (process.env.NODE_ENV === "production" && !process.env.SENDGRID_API_KEY) {
    console.info("[email-adapter] skipped (no SENDGRID_API_KEY)", input.to);
    return { sent: false, provider: "noop" };
  }
  console.info("[email-adapter] placeholder send", {
    to: input.to,
    subject: input.subject,
  });
  return { sent: false, provider: "placeholder" };
}
