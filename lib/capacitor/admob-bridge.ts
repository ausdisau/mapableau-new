import {
  AdMob,
  AdmobConsentStatus,
  BannerAdPosition,
  BannerAdSize,
} from "@capacitor-community/admob";

import { isCapacitorNative } from "@/lib/capacitor/native-bridge";
import { getAdMobConfig } from "@/lib/capacitor/admob-config";

let initialized = false;

export async function initializeAdMob(): Promise<boolean> {
  if (!isCapacitorNative()) return false;

  const config = getAdMobConfig();
  if (!config) return false;

  if (!initialized) {
    await AdMob.initialize({
      initializeForTesting: config.testing,
    });
    initialized = true;
  }

  const consentInfo = await AdMob.requestConsentInfo();
  if (
    consentInfo.isConsentFormAvailable &&
    consentInfo.status === AdmobConsentStatus.REQUIRED
  ) {
    await AdMob.showConsentForm();
  }

  return true;
}

export async function showAdMobBanner(): Promise<void> {
  const config = getAdMobConfig();
  if (!config) return;

  await AdMob.showBanner({
    adId: config.bannerUnitId,
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
    isTesting: config.testing,
  });
}

export async function removeAdMobBanner(): Promise<void> {
  if (!isCapacitorNative()) return;
  try {
    await AdMob.removeBanner();
  } catch {
    // Banner may not be mounted yet.
  }
}

export async function refreshAdMobBanner(show: boolean): Promise<void> {
  await removeAdMobBanner();
  if (!show) return;
  const ready = initialized ? true : await initializeAdMob();
  if (ready) await showAdMobBanner();
}
