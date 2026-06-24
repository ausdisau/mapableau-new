export function donationCheckoutMetadata(params: {
  donationId: string;
  userId?: string;
}): Record<string, string> {
  const meta: Record<string, string> = {
    donationId: params.donationId,
    purpose: "donation",
  };
  if (params.userId) meta.userId = params.userId;
  return meta;
}

export function isDonationStripeMetadata(
  metadata: Record<string, string> | null | undefined
): boolean {
  if (!metadata) return false;
  return Boolean(metadata.donationId) || metadata.purpose === "donation";
}

export function donationIdFromMetadata(
  metadata: Record<string, string> | null | undefined
): string | undefined {
  return metadata?.donationId;
}
