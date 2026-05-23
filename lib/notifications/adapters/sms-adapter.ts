/** Placeholder SMS adapter. */
export async function dispatchSmsNotification(_params: {
  userId: string;
  title: string;
  body: string;
}): Promise<void> {
  // Intentionally no-op in Core spine phase.
}
