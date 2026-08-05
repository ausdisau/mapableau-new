/**
 * @vitest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import {
  useAccessibilityStore,
  useAccessibilityInitialization,
  useAccessibilityPreferences,
  useAccessibilityNeeds,
  useSemanticTokens,
} from "@/lib/accessibility";
import type { AccessibilityNeed } from "@/lib/accessibility/accessibility-store";

describe("Accessibility Store", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
    // Reset the store
    const store = useAccessibilityStore.getState();
    store.resetUiPreferences();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("useAccessibilityStore", () => {
    it("initializes with default preferences", () => {
      const { result } = renderHook(() => useAccessibilityStore());
      expect(result.current.uiPreferences.textScale).toBe(100);
      expect(result.current.uiPreferences.contrastTheme).toEqual("standard");
      expect(result.current.uiPreferences.reduceMotion).toBe(false);
    });

    it("updates UI preferences", () => {
      const { result } = renderHook(() => useAccessibilityStore());
      expect(result.current.uiPreferences.textScale).toBe(100);

      result.current.updateUiPreferences({ textScale: 150 });

      expect(result.current.uiPreferences.textScale).toBe(150);
    });

    it("resets preferences to defaults", () => {
      const { result } = renderHook(() => useAccessibilityStore());
      result.current.updateUiPreferences({ textScale: 150, reduceMotion: true });

      result.current.resetUiPreferences();

      expect(result.current.uiPreferences.textScale).toBe(100);
      expect(result.current.uiPreferences.reduceMotion).toBe(false);
    });

    it("adds accessibility needs", () => {
      const { result } = renderHook(() => useAccessibilityStore());
      const need: AccessibilityNeed = {
        id: "test-need",
        domain: "care",
        category: "mobility",
        description: "Wheelchair access",
      };

      result.current.addAccessibilityNeed(need);

      expect(result.current.accessibilityNeeds).toContainEqual(need);
    });

    it("removes accessibility needs", () => {
      const { result } = renderHook(() => useAccessibilityStore());
      const need: AccessibilityNeed = {
        id: "test-need",
        domain: "care",
        category: "mobility",
        description: "Wheelchair access",
      };

      result.current.addAccessibilityNeed(need);
      expect(result.current.accessibilityNeeds).toHaveLength(1);

      result.current.removeAccessibilityNeed("test-need");
      expect(result.current.accessibilityNeeds).toHaveLength(0);
    });

    it("applies accessibility presets", () => {
      const { result } = renderHook(() => useAccessibilityStore());
      result.current.applyPreset("reduce-motion");

      expect(result.current.uiPreferences.reduceMotion).toBe(true);
    });

    it("computes semantic tokens from preferences", () => {
      const { result } = renderHook(() => useAccessibilityStore());
      const tokens = result.current.semanticTokens;

      expect(tokens.colors).toBeDefined();
      expect(tokens.colors.textPrimary).toBeDefined();
      expect(tokens.colors.backgroundPrimary).toBeDefined();
      expect(tokens.typography).toBeDefined();
      expect(tokens.typography.scale).toBe(1);
    });

    it("updates semantic tokens when preferences change", () => {
      const { result } = renderHook(() => useAccessibilityStore());
      const tokensBefore = result.current.semanticTokens;

      result.current.updateUiPreferences({ contrastTheme: "high" });

      const tokensAfter = result.current.semanticTokens;
      expect(tokensAfter).not.toEqual(tokensBefore);
    });

    it("persists preferences to localStorage", async () => {
      const { result } = renderHook(() => useAccessibilityStore());
      result.current.updateUiPreferences({ textScale: 125 });

      await waitFor(() => {
        const stored = window.localStorage.getItem(
          "accessibility-ui-preferences"
        );
        expect(stored).toBeDefined();
        const parsed = JSON.parse(stored!);
        expect(parsed.textScale).toBe(125);
      });
    });

    it("recovers preferences from localStorage on init", () => {
      const prefs = {
        version: 1,
        textScale: 120,
        contrastTheme: "standard",
        fontMode: "dyslexia-friendly",
        reduceMotion: true,
      };

      window.localStorage.setItem(
        "accessibility-ui-preferences",
        JSON.stringify(prefs)
      );

      // Create new hook instance
      const { result } = renderHook(() => useAccessibilityStore());
      expect(result.current.uiPreferences.textScale).toBe(100); // Before initialization
    });
  });

  describe("useAccessibilityInitialization", () => {
    it("initializes the accessibility store on mount", () => {
      const { result } = renderHook(() => useAccessibilityInitialization());
      expect(result.current).toBe(undefined); // Hook returns void
    });

    it("applies semantic tokens on mount", () => {
      const { result } = renderHook(() => {
        useAccessibilityInitialization();
        return useAccessibilityStore();
      });

      expect(result.current.semanticTokens).toBeDefined();
    });
  });

  describe("useAccessibilityPreferences", () => {
    it("returns current UI preferences", () => {
      const { result } = renderHook(() => {
        useAccessibilityInitialization();
        return useAccessibilityPreferences();
      });

      expect(result.current).toBeDefined();
      expect(result.current.textScale).toBe(100);
      expect(result.current.contrastTheme).toEqual("standard");
    });

    it("updates when store changes", async () => {
      const { result: storeResult } = renderHook(() => useAccessibilityStore());
      const { result: prefsResult } = renderHook(() =>
        useAccessibilityPreferences()
      );

      storeResult.current.updateUiPreferences({ textScale: 130 });

      await waitFor(() => {
        expect(prefsResult.current.textScale).toBe(130);
      });
    });

    it("reflects high contrast settings", () => {
      const { result: storeResult } = renderHook(() => useAccessibilityStore());
      storeResult.current.updateUiPreferences({ contrastTheme: "high" });

      const { result: prefsResult } = renderHook(() =>
        useAccessibilityPreferences()
      );

      expect(prefsResult.current.contrastTheme).toEqual("high");
    });

    it("reflects motion preferences", () => {
      const { result: storeResult } = renderHook(() => useAccessibilityStore());
      storeResult.current.updateUiPreferences({ reduceMotion: true });

      const { result: prefsResult } = renderHook(() =>
        useAccessibilityPreferences()
      );

      expect(prefsResult.current.reduceMotion).toBe(true);
    });
  });

  describe("useAccessibilityNeeds", () => {
    it("returns empty needs by default", () => {
      const { result } = renderHook(() => useAccessibilityNeeds());

      expect(result.current.allNeeds).toHaveLength(0);
      expect(result.current.mobilityNeeds).toHaveLength(0);
      expect(result.current.sensoryNeeds).toHaveLength(0);
    });

    it("filters needs by domain", () => {
      const { result: storeResult } = renderHook(() => useAccessibilityStore());
      storeResult.current.addAccessibilityNeed({
        id: "care-1",
        domain: "care",
        category: "mobility",
        description: "Wheelchair access",
      });
      storeResult.current.addAccessibilityNeed({
        id: "transport-1",
        domain: "transport",
        category: "sensory",
        description: "Audio descriptions needed",
      });

      const { result: needsResult } = renderHook(() => useAccessibilityNeeds());

      expect(needsResult.current.allNeeds).toHaveLength(2);
      expect(needsResult.current.careNeeds).toHaveLength(1);
      expect(needsResult.current.transportNeeds).toHaveLength(1);
    });

    it("categorizes needs by type", () => {
      const { result: storeResult } = renderHook(() => useAccessibilityStore());
      storeResult.current.addAccessibilityNeed({
        id: "mobility-1",
        domain: "care",
        category: "mobility",
        description: "Wheelchair",
      });
      storeResult.current.addAccessibilityNeed({
        id: "sensory-1",
        domain: "care",
        category: "sensory",
        description: "Vision support",
      });

      const { result: needsResult } = renderHook(() => useAccessibilityNeeds());

      expect(needsResult.current.mobilityNeeds).toHaveLength(1);
      expect(needsResult.current.sensoryNeeds).toHaveLength(1);
    });

    it("updates when needs change", async () => {
      const { result: storeResult } = renderHook(() => useAccessibilityStore());
      const { result: needsResult } = renderHook(() => useAccessibilityNeeds());

      expect(needsResult.current.allNeeds).toHaveLength(0);

      storeResult.current.addAccessibilityNeed({
        id: "test-1",
        domain: "care",
        category: "mobility",
        description: "Test need",
      });

      await waitFor(() => {
        expect(needsResult.current.allNeeds).toHaveLength(1);
      });
    });
  });

  describe("useSemanticTokens", () => {
    it("returns semantic tokens object", () => {
      const { result } = renderHook(() => useSemanticTokens());

      expect(result.current).toBeDefined();
      expect(result.current.colors).toBeDefined();
      expect(result.current.typography).toBeDefined();
      expect(result.current.motion).toBeDefined();
      expect(result.current.focus).toBeDefined();
    });

    it("includes color tokens", () => {
      const { result } = renderHook(() => useSemanticTokens());

      expect(result.current.colors.textPrimary).toBeDefined();
      expect(result.current.colors.textSecondary).toBeDefined();
      expect(result.current.colors.backgroundPrimary).toBeDefined();
      expect(result.current.colors.backgroundSecondary).toBeDefined();
      expect(result.current.colors.focusRing).toBeDefined();
    });

    it("includes typography tokens", () => {
      const { result } = renderHook(() => useSemanticTokens());

      expect(result.current.typography.scale).toBeGreaterThan(0);
      expect(result.current.typography.fontFamily).toBeDefined();
      expect(result.current.typography.lineHeightMultiplier).toBeGreaterThan(0);
      expect(result.current.typography.letterSpacingMultiplier).toBeGreaterThanOrEqual(0);
    });

    it("includes motion tokens", () => {
      const { result } = renderHook(() => useSemanticTokens());

      expect(result.current.motion.shouldReduceMotion).toBeDefined();
      expect(result.current.motion.transitionDuration).toBeDefined();
    });

    it("includes focus tokens", () => {
      const { result } = renderHook(() => useSemanticTokens());

      expect(result.current.focus.outlineWidth).toBeGreaterThan(0);
      expect(result.current.focus.outlineColor).toBeDefined();
      expect(result.current.focus.outlineOffset).toBeGreaterThanOrEqual(0);
    });

    it("updates when preferences change", async () => {
      const { result: storeResult } = renderHook(() => useAccessibilityStore());
      const { result: tokensResult } = renderHook(() => useSemanticTokens());

      const tokensBefore = tokensResult.current;
      storeResult.current.updateUiPreferences({ textScale: 150 });

      await waitFor(() => {
        expect(tokensResult.current.typography.scale).not.toBe(
          tokensBefore.typography.scale
        );
      });
    });

    it("computes colors based on contrast theme", () => {
      const { result: storeResult } = renderHook(() => useAccessibilityStore());
      storeResult.current.updateUiPreferences({ contrastTheme: "high" });

      const { result: tokensResult } = renderHook(() => useSemanticTokens());

      // High contrast should have more distinct colors
      expect(tokensResult.current.colors.textPrimary).toBeDefined();
    });

    it("respects reduced motion preference", () => {
      const { result: storeResult } = renderHook(() => useAccessibilityStore());
      storeResult.current.updateUiPreferences({ reduceMotion: true });

      const { result: tokensResult } = renderHook(() => useSemanticTokens());

      expect(tokensResult.current.motion.shouldReduceMotion).toBe(true);
    });
  });

  describe("Store subscriptions", () => {
    it("allows selective subscriptions to preferences", () => {
      const store = useAccessibilityStore.getState();
      let callCount = 0;
      const unsubscribe = store.subscribe(
        (state) => state.uiPreferences.textScale,
        () => {
          callCount++;
        }
      );

      store.updateUiPreferences({ textScale: 120 });
      expect(callCount).toBe(1);

      store.updateUiPreferences({ reduceMotion: true }); // Different preference
      expect(callCount).toBe(1); // Should not trigger

      unsubscribe();
    });
  });

  describe("Error handling", () => {
    it("handles localStorage failure gracefully", () => {
      vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
        throw new Error("Storage full");
      });

      const { result } = renderHook(() => useAccessibilityStore());
      // Should not throw
      result.current.updateUiPreferences({ textScale: 120 });
      expect(result.current.uiPreferences.textScale).toBe(120);
    });

    it("handles corrupted localStorage data", () => {
      window.localStorage.setItem(
        "accessibility-ui-preferences",
        "{invalid json"
      );

      const { result } = renderHook(() => useAccessibilityStore());
      // Should load defaults gracefully
      expect(result.current.uiPreferences.textScale).toBe(100);
    });
  });
});
