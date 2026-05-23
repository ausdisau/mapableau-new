/** Placeholder push adapter. */
export async function dispatchPushNotification(_params: {
  userId: string;
  title: string;
  body: string;
  actionUrl?: string;
}): Promise<void> {
  // Intentionally no-op in Core spine phase.
}
