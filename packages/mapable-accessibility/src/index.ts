
import { touchTargetMin } from "@mapable/design-tokens";

export type AccessibilityPreferences = {
  fontScale: number;
  boldText: boolean;
  reduceMotion: boolean;
  reduceTransparency: boolean;
  highContrast: boolean;
  plainLanguage: boolean;
  easyRead: boolean;
  largeInteraction: boolean;
};

export const DEFAULT_A11Y_PREFERENCES: AccessibilityPreferences = {
  fontScale: 1,
  boldText: false,
  reduceMotion: false,
  reduceTransparency: false,
  highContrast: false,
  plainLanguage: false,
  easyRead: false,
  largeInteraction: false,
};

export function minTouchTarget(prefs: AccessibilityPreferences): number {
  return prefs.largeInteraction ? Math.max(touchTargetMin, 56) : touchTargetMin;
}

export function scaleFontSize(base: number, prefs: AccessibilityPreferences): number {
  const scaled = base * Math.max(prefs.fontScale, 1);
  return prefs.boldText ? scaled * 1.05 : scaled;
}

export function announcePriority(
  level: "polite" | "assertive",
): "polite" | "assertive" {
  return level;
}

export function statusWithoutColourOnly(label: string, tone: string): string {
  return `${label}. Status: ${tone}.`;
}

export const PLAIN_LANGUAGE_STATUS: Record<string, string> = {
  needs_decision: "You need to decide.",
  waiting_on_others: "Someone else still needs to respond.",
  confirmed: "This is confirmed.",
  in_progress: "This is happening now.",
  completed: "This is finished.",
  cancelled: "This was cancelled.",
  recovery_required: "We need to fix a change before you continue.",
};
