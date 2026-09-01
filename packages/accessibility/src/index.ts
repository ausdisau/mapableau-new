/** Shared accessibility UI types for @mapable/accessibility. */

export type AccessibilityTextScale = 100 | 112.5 | 125 | 150 | 200;

export type AccessibilityFontMode = "default" | "readable" | "dyslexia-friendly";

export type AccessibilityContrastTheme =
  | "default"
  | "light"
  | "dark"
  | "high";

export interface AccessibilityUiPreferences {
  version: 1;
  textScale: AccessibilityTextScale;
  fontMode: AccessibilityFontMode;
  contrastTheme: AccessibilityContrastTheme;
  reduceMotion: boolean;
}

export const ACCESSIBILITY_UI_STORAGE_KEY = "mapable:accessibility-ui:v1";

export const DEFAULT_ACCESSIBILITY_UI_PREFERENCES: AccessibilityUiPreferences = {
  version: 1,
  textScale: 100,
  fontMode: "default",
  contrastTheme: "default",
  reduceMotion: false,
};
