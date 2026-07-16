import { Capacitor } from "@capacitor/core";

/** Google sample AdMob app ID — replace in production via android strings.xml. */
export const ADMOB_TEST_APP_ID = "ca-app-pub-3940256099942544~3347511713";

/** Google sample banner unit for Android testing. */
export const ADMOB_TEST_BANNER_UNIT_ID =
  "ca-app-pub-3940256099942544/6300978111";

export type AdMobConfig = {
  bannerUnitId: string;
  testing: boolean;
};

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function isAdMobEnabled(): boolean {
  if (readEnv("NEXT_PUBLIC_ADMOB_ENABLED") === "false") return false;
  return Capacitor.isNativePlatform();
}

export function getAdMobConfig(): AdMobConfig | null {
  if (!isAdMobEnabled()) return null;

  const platform = Capacitor.getPlatform();
  const bannerUnitId =
    (platform === "android"
      ? readEnv("NEXT_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID")
      : readEnv("NEXT_PUBLIC_ADMOB_IOS_BANNER_UNIT_ID")) ??
    readEnv("NEXT_PUBLIC_ADMOB_BANNER_UNIT_ID") ??
    (readEnv("NEXT_PUBLIC_ADMOB_TESTING") === "true"
      ? ADMOB_TEST_BANNER_UNIT_ID
      : undefined);

  if (!bannerUnitId) return null;

  return {
    bannerUnitId,
    testing: readEnv("NEXT_PUBLIC_ADMOB_TESTING") === "true",
  };
}
