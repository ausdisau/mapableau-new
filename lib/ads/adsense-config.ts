export type AdSenseSkyscraperConfig = {
  clientId: string;
  leftSlotId: string;
  rightSlotId: string;
};

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function isAdSenseEnabled(): boolean {
  if (readEnv("NEXT_PUBLIC_GOOGLE_ADSENSE_ENABLED") === "false") return false;
  return Boolean(getAdSenseSkyscraperConfig());
}

export function getAdSenseSkyscraperConfig(): AdSenseSkyscraperConfig | null {
  const clientId = readEnv("NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID");
  if (!clientId) return null;

  const sharedSlot =
    readEnv("NEXT_PUBLIC_GOOGLE_ADSENSE_SKYSCRAPER_SLOT") ??
    readEnv("NEXT_PUBLIC_GOOGLE_ADSENSE_SKYSCRAPER_LEFT_SLOT");

  const leftSlotId =
    readEnv("NEXT_PUBLIC_GOOGLE_ADSENSE_SKYSCRAPER_LEFT_SLOT") ?? sharedSlot;
  const rightSlotId =
    readEnv("NEXT_PUBLIC_GOOGLE_ADSENSE_SKYSCRAPER_RIGHT_SLOT") ??
    sharedSlot ??
    leftSlotId;

  if (!leftSlotId || !rightSlotId) return null;

  return { clientId, leftSlotId, rightSlotId };
}
