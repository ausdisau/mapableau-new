/**
 * Guest-safe “Show sponsored links” preference.
 * Independent of care consent, personalised-ad consent, and analytics.
 * Default: off.
 */

export const SPONSORED_LINKS_PREFERENCE_KEY =
  "mapable:ads:show-sponsored-links:v1";

export const SPONSORED_LINKS_PREFERENCE_CHANGE_EVENT =
  "mapable:ads:show-sponsored-links-change";

export type SponsoredLinksPreference = {
  showSponsoredLinks: boolean;
};

export const DEFAULT_SPONSORED_LINKS_PREFERENCE: SponsoredLinksPreference = {
  showSponsoredLinks: false,
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function readShowSponsoredLinks(): boolean {
  if (!canUseStorage()) return false;
  try {
    return localStorage.getItem(SPONSORED_LINKS_PREFERENCE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setShowSponsoredLinks(show: boolean): void {
  if (!canUseStorage()) return;
  try {
    if (show) {
      localStorage.setItem(SPONSORED_LINKS_PREFERENCE_KEY, "true");
    } else {
      localStorage.removeItem(SPONSORED_LINKS_PREFERENCE_KEY);
    }
    window.dispatchEvent(
      new CustomEvent(SPONSORED_LINKS_PREFERENCE_CHANGE_EVENT, {
        detail: { showSponsoredLinks: show },
      }),
    );
  } catch {
    // Ignore quota / private-mode failures — preference stays default off.
  }
}

export function clearShowSponsoredLinks(): void {
  setShowSponsoredLinks(false);
}
