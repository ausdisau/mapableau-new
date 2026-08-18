/**
 * Unified Accessibility Store (Zustand)
 *
 * Central state management for accessibility preferences, themes, and profile-linked
 * accessibility needs (mobility, sensory, cognitive, etc.).
 *
 * This store bridges:
 * - UI Preferences (text size, contrast, motion, fonts)
 * - Accessibility Profile (from Prisma: hearing, vision, mobility, cognitive needs)
 * - Domain-Specific Needs (from care, transport, jobs services)
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/react";
import { persist, createJSONStorage } from "zustand/middleware";

import type {
  AccessibilityUiPreferences,
  AccessibilityPresetId,
} from "@/types/accessibility-ui";
import {
  DEFAULT_ACCESSIBILITY_UI_PREFERENCES,
  loadPreferencesFromStorage,
  savePreferencesToStorage,
  parseAccessibilityUiPreferences,
} from "./ui-preferences";

/**
 * Domain-specific accessibility needs (from CareAccessNeed, MobilitySchema, etc.)
 */
export interface AccessibilityNeed {
  domain: "care" | "transport" | "jobs" | "other";
  category:
    | "mobility"
    | "vision"
    | "hearing"
    | "cognitive"
    | "psychosocial"
    | "other";
  description: string;
  verificationStatus?: "unverified" | "verified" | "expired";
}

/**
 * Current accessibility context (who is using the app and their needs)
 */
export interface AccessibilityContext {
  isScreenReaderUser: boolean;
  isVoiceControlUser: boolean;
  preferSimpleLanguage: boolean;
  mobilityNeeds: AccessibilityNeed[];
  sensoryNeeds: AccessibilityNeed[];
  cognitiveNeeds: AccessibilityNeed[];
  customNeeds: AccessibilityNeed[];
}

/**
 * Semantic theme tokens (applies CSS custom properties based on preferences)
 */
export interface SemanticTokens {
  colors: {
    textPrimary: string;
    textSecondary: string;
    textInverse: string;
    backgroundPrimary: string;
    backgroundSecondary: string;
    focus: string;
    error: string;
    success: string;
    warning: string;
  };
  typography: {
    scale: number;
    fontFamily: string;
    lineHeightMultiplier: number;
    letterSpacingMultiplier: number;
  };
  motion: {
    reduced: boolean;
    prefersReducedMotion: boolean;
  };
  focus: {
    outlineWidth: string;
    outlineStyle: string;
    outlineColor: string;
  };
}

/**
 * Store state shape
 */
export interface AccessibilityStoreState {
  // UI Preferences
  uiPreferences: AccessibilityUiPreferences;
  updateUiPreferences: (
    updates: Partial<AccessibilityUiPreferences>
  ) => void;
  applyUiPreset: (presetId: AccessibilityPresetId) => void;
  resetUiPreferences: () => void;

  // Accessibility Context (profile + needs)
  context: AccessibilityContext;
  updateContext: (updates: Partial<AccessibilityContext>) => void;
  addNeed: (need: AccessibilityNeed) => void;
  removeNeed: (domain: string, category: string) => void;
  clearNeeds: () => void;

  // Semantic Tokens (computed from preferences + context)
  semanticTokens: SemanticTokens;
  refreshSemanticTokens: () => void;

  // Initialization & Storage
  isHydrated: boolean;
  initializeFromStorage: () => void;
  persistToStorage: () => void;

  // Utilities
  hasActiveNeeds: boolean;
  needsSummary: () => string;
  supportsColorCustomization: () => boolean;
}

/**
 * Compute semantic tokens from UI preferences and context
 */
function computeSemanticTokens(
  preferences: AccessibilityUiPreferences
): SemanticTokens {
  const systemReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const reduceMotion = preferences.reduceMotion || systemReducedMotion;

  // Color tokens based on contrast theme
  const colorSchemes: Record<string, SemanticTokens["colors"]> = {
    default: {
      textPrimary: "rgb(0, 0, 0)",
      textSecondary: "rgb(64, 64, 64)",
      textInverse: "rgb(255, 255, 255)",
      backgroundPrimary: "rgb(255, 255, 255)",
      backgroundSecondary: "rgb(245, 245, 245)",
      focus: "rgb(0, 122, 204)",
      error: "rgb(204, 0, 0)",
      success: "rgb(0, 153, 0)",
      warning: "rgb(255, 153, 0)",
    },
    light: {
      textPrimary: "rgb(32, 32, 32)",
      textSecondary: "rgb(96, 96, 96)",
      textInverse: "rgb(240, 240, 240)",
      backgroundPrimary: "rgb(255, 255, 255)",
      backgroundSecondary: "rgb(250, 250, 250)",
      focus: "rgb(0, 102, 204)",
      error: "rgb(187, 0, 0)",
      success: "rgb(0, 136, 0)",
      warning: "rgb(221, 136, 0)",
    },
    dark: {
      textPrimary: "rgb(240, 240, 240)",
      textSecondary: "rgb(192, 192, 192)",
      textInverse: "rgb(0, 0, 0)",
      backgroundPrimary: "rgb(32, 32, 32)",
      backgroundSecondary: "rgb(48, 48, 48)",
      focus: "rgb(100, 181, 246)",
      error: "rgb(255, 100, 100)",
      success: "rgb(100, 200, 100)",
      warning: "rgb(255, 179, 71)",
    },
    high: {
      textPrimary: "rgb(0, 0, 0)",
      textSecondary: "rgb(0, 0, 0)",
      textInverse: "rgb(255, 255, 255)",
      backgroundPrimary: "rgb(255, 255, 255)",
      backgroundSecondary: "rgb(240, 240, 240)",
      focus: "rgb(0, 0, 255)",
      error: "rgb(255, 0, 0)",
      success: "rgb(0, 153, 0)",
      warning: "rgb(255, 102, 0)",
    },
  };

  const colors =
    colorSchemes[preferences.contrastTheme] || colorSchemes.default;

  // Typography scale
  const scales: Record<number, number> = {
    100: 1,
    112.5: 1.125,
    125: 1.25,
    150: 1.5,
    200: 2,
  };
  const scale = scales[preferences.textScale] || 1;

  // Font families
  const fonts: Record<string, string> = {
    default: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    readable: "'Segoe UI', Georgia, serif",
    "dyslexia-friendly":
      "'OpenDyslexic', 'Segoe UI', sans-serif, monospace",
  };
  const fontFamily =
    fonts[preferences.fontMode] || fonts.default;

  // Line height multiplier
  const lineHeightMultipliers: Record<string, number> = {
    default: 1.5,
    relaxed: 1.8,
    "extra-relaxed": 2.2,
  };
  const lineHeightMultiplier =
    lineHeightMultipliers[preferences.lineHeight] || 1.5;

  // Letter spacing multiplier
  const letterSpacingMultipliers: Record<string, number> = {
    default: 0,
    increased: 0.05,
    "extra-increased": 0.1,
  };
  const letterSpacingMultiplier =
    letterSpacingMultipliers[preferences.letterSpacing] || 0;

  // Focus outline
  const focusOutlineWidth = preferences.highlightFocus ? "3px" : "2px";
  const focusOutlineStyle = "solid";
  const focusOutlineColor = colors.focus;

  return {
    colors,
    typography: {
      scale,
      fontFamily,
      lineHeightMultiplier,
      letterSpacingMultiplier,
    },
    motion: {
      reduced: reduceMotion,
      prefersReducedMotion: systemReducedMotion,
    },
    focus: {
      outlineWidth: focusOutlineWidth,
      outlineStyle: focusOutlineStyle,
      outlineColor: focusOutlineColor,
    },
  };
}

/**
 * Initialize empty accessibility context
 */
function createDefaultContext(): AccessibilityContext {
  return {
    isScreenReaderUser: false,
    isVoiceControlUser: false,
    preferSimpleLanguage: false,
    mobilityNeeds: [],
    sensoryNeeds: [],
    cognitiveNeeds: [],
    customNeeds: [],
  };
}

/**
 * Create the Zustand store with persistence
 */
export const useAccessibilityStore = create<AccessibilityStoreState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        uiPreferences: { ...DEFAULT_ACCESSIBILITY_UI_PREFERENCES },
        context: createDefaultContext(),
        semanticTokens: computeSemanticTokens(
          DEFAULT_ACCESSIBILITY_UI_PREFERENCES
        ),
        isHydrated: false,

        // UI Preferences setters
        updateUiPreferences: (updates) =>
          set((state) => {
            const newPreferences = { ...state.uiPreferences, ...updates };
            return {
              uiPreferences: newPreferences,
              semanticTokens: computeSemanticTokens(newPreferences),
            };
          }),

        applyUiPreset: (presetId) =>
          set((state) => {
            // Import and apply preset logic here
            // For now, this is a placeholder
            console.log("Applying preset:", presetId);
            return state;
          }),

        resetUiPreferences: () =>
          set({
            uiPreferences: { ...DEFAULT_ACCESSIBILITY_UI_PREFERENCES },
            semanticTokens: computeSemanticTokens(
              DEFAULT_ACCESSIBILITY_UI_PREFERENCES
            ),
          }),

        // Context management
        updateContext: (updates) =>
          set((state) => ({
            context: { ...state.context, ...updates },
          })),

        addNeed: (need) =>
          set((state) => {
            const categoryMap: Record<string, keyof AccessibilityContext> = {
              mobility: "mobilityNeeds",
              vision: "sensoryNeeds",
              hearing: "sensoryNeeds",
              cognitive: "cognitiveNeeds",
            };
            const key = categoryMap[need.category] || "customNeeds";
            return {
              context: {
                ...state.context,
                [key]: [
                  ...(state.context[key] as AccessibilityNeed[]),
                  need,
                ],
              },
            };
          }),

        removeNeed: (domain, category) =>
          set((state) => {
            const categoryMap: Record<string, keyof AccessibilityContext> = {
              mobility: "mobilityNeeds",
              vision: "sensoryNeeds",
              hearing: "sensoryNeeds",
              cognitive: "cognitiveNeeds",
            };
            const key = categoryMap[category] || "customNeeds";
            return {
              context: {
                ...state.context,
                [key]: (state.context[key] as AccessibilityNeed[]).filter(
                  (n) => n.domain !== domain
                ),
              },
            };
          }),

        clearNeeds: () =>
          set({
            context: createDefaultContext(),
          }),

        // Semantic tokens
        semanticTokens: computeSemanticTokens(
          DEFAULT_ACCESSIBILITY_UI_PREFERENCES
        ),

        refreshSemanticTokens: () =>
          set((state) => ({
            semanticTokens: computeSemanticTokens(state.uiPreferences),
          })),

        // Storage management
        initializeFromStorage: () => {
          const stored = loadPreferencesFromStorage();
          set({
            uiPreferences: stored,
            semanticTokens: computeSemanticTokens(stored),
            isHydrated: true,
          });
        },

        persistToStorage: () => {
          const { uiPreferences } = get();
          savePreferencesToStorage(uiPreferences);
        },

        // Computed properties
        hasActiveNeeds:
          get().context.mobilityNeeds.length > 0 ||
          get().context.sensoryNeeds.length > 0 ||
          get().context.cognitiveNeeds.length > 0 ||
          get().context.customNeeds.length > 0,

        needsSummary: () => {
          const { context } = get();
          const summaries: string[] = [];

          if (context.isScreenReaderUser) summaries.push("Screen reader");
          if (context.isVoiceControlUser) summaries.push("Voice control");
          if (context.preferSimpleLanguage) summaries.push("Simple language");
          if (context.mobilityNeeds.length > 0)
            summaries.push(`${context.mobilityNeeds.length} mobility need(s)`);
          if (context.sensoryNeeds.length > 0)
            summaries.push(`${context.sensoryNeeds.length} sensory need(s)`);
          if (context.cognitiveNeeds.length > 0)
            summaries.push(`${context.cognitiveNeeds.length} cognitive need(s)`);

          return summaries.join(", ") || "No accessibility needs configured";
        },

        supportsColorCustomization: () => {
          return typeof window !== "undefined" && typeof CSS !== "undefined";
        },
      }),
      {
        name: "mapable-accessibility-store",
        storage: createJSONStorage(() => {
          // Use localStorage if available, fallback to memory
          if (typeof window === "undefined") {
            return {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            };
          }
          try {
            // Test localStorage access
            localStorage.setItem("__test", "1");
            localStorage.removeItem("__test");
            return localStorage;
          } catch {
            // Private browsing or quota exceeded
            return {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            };
          }
        }),
        partialize: (state) => ({
          uiPreferences: state.uiPreferences,
          context: state.context,
        }),
      }
    )
  )
);

/**
 * Selector hooks for common accessibility use cases
 */
export const useAccessibilityPreferences = () =>
  useAccessibilityStore((state) => state.uiPreferences);

export const useAccessibilityContext = () =>
  useAccessibilityStore((state) => state.context);

export const useSemanticTokens = () =>
  useAccessibilityStore((state) => state.semanticTokens);

export const useAccessibilityNeeds = () =>
  useAccessibilityStore((state) => ({
    mobilityNeeds: state.context.mobilityNeeds,
    sensoryNeeds: state.context.sensoryNeeds,
    cognitiveNeeds: state.context.cognitiveNeeds,
    customNeeds: state.context.customNeeds,
  }));

export const useMotionPreferences = () =>
  useAccessibilityStore((state) => state.semanticTokens.motion);

export const useFocusPreferences = () =>
  useAccessibilityStore((state) => state.semanticTokens.focus);
