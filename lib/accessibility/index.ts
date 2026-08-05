/**
 * Accessibility System - Unified Export
 *
 * Centralizes all accessibility features: preferences, tokens, hooks, and utilities.
 */

// Store & State Management
export {
  useAccessibilityStore,
  useAccessibilityPreferences,
  useAccessibilityContext,
  useSemanticTokens,
  useAccessibilityNeeds,
  useMotionPreferences,
  useFocusPreferences,
  type AccessibilityStoreState,
  type AccessibilityContext,
  type AccessibilityNeed,
  type SemanticTokens,
} from "./accessibility-store";

// UI Preferences (Existing System)
export {
  DEFAULT_ACCESSIBILITY_UI_PREFERENCES,
  accessibilityUiPreferencesSchema,
  ACCESSIBILITY_PRESETS,
  CONTRAST_RATIO_NORMAL_TEXT,
  CONTRAST_RATIO_LARGE_TEXT,
  parseAccessibilityUiPreferences,
  migrateLegacyDigitalPreferences,
  applyPreset,
  preferencesMatchPreset,
  hasCustomPreferences,
  describePreferenceChanges,
  contrastRatio,
  areCustomColorsSafe,
  loadPreferencesFromStorage,
  savePreferencesToStorage,
  clearPreferencesStorage,
  applyPreferencesToDocument,
  clearPreferencesFromDocument,
  getPreHydrationAccessibilityScript,
  mergeUiIntoDigitalPreferences,
  ACCESSIBILITY_UI_STORAGE_KEY,
  type AccessibilityUiPreferences,
  type AccessibilityPresetId,
  type AccessibilityCustomColors,
} from "./ui-preferences";

// Semantic Tokens
export {
  applySemanticTokensToDocument,
  getSemanticColorsCss,
  getSemanticTypographyCss,
  getSemanticFocusCss,
  getComputedToken,
  semanticColors,
  semanticTypography,
  semanticMotion,
  semanticFocus,
  getAccessibilityClasses,
} from "./semantic-tokens";

// React Hooks
export {
  useAccessibilityInitialization,
  useFocusManager,
  useAccessibilityAnnouncement,
  useAccessibleFormField,
  useMotionPreferencesSafe,
  useFocusRing,
  useKeyboardNavigation,
  useSkipLinks,
  useSafeAnimation,
  useAccessibleCombobox,
  useLiveRegion,
} from "./use-accessibility";

// Feature Flags
export { isFirstPartyAccessibilityPanelEnabled } from "./feature-flags";
