/** Placeholder email adapter — wire SendGrid when production-ready. */
export async function dispatchEmailNotification(_params: {
  userId: string;
  title: string;
  body: string;
  actionUrl?: string;
}): Promise<void> {
  // Intentionally no-op in Core spine phase.
}
