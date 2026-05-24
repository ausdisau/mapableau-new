export async function sendPushNotification(input: {
  userId: string;
  title: string;
  body: string;
}): Promise<{ sent: boolean; provider: string }> {
  console.info("[push-adapter] placeholder send", { userId: input.userId });
  return { sent: false, provider: "placeholder" };
}
