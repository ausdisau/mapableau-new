/** Default prepaid campaign package (AUD cents). Override with ADS_CAMPAIGN_PACKAGE_CENTS. */
export function getAdsCampaignPackageCents(): number {
  const raw = process.env.ADS_CAMPAIGN_PACKAGE_CENTS;
  if (raw) {
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return 49900; // $499.00 AUD default package
}

export const AD_ALT_TEXT_MIN_LENGTH = 10;
export const AD_HEADLINE_MAX_LENGTH = 120;
export const AD_BODY_MAX_LENGTH = 500;
