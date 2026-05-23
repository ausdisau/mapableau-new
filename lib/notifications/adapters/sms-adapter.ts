export async function sendSmsNotification(input: {
  to: string;
  body: string;
}): Promise<{ sent: boolean; provider: string }> {
  console.info("[sms-adapter] placeholder send", { to: input.to });
  return { sent: false, provider: "placeholder" };
}
