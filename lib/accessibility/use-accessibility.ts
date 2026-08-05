/**
 * Accessibility Hooks
 *
 * Reusable React hooks for building accessible components.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  useAccessibilityStore,
  useAccessibilityPreferences,
  useAccessibilityContext,
  useSemanticTokens,
  useMotionPreferences,
  useFocusPreferences,
} from "./accessibility-store";
import { applySemanticTokensToDocument } from "./semantic-tokens";
import {
  applyPreferencesToDocument,
  loadPreferencesFromStorage,
} from "./ui-preferences";

/**
 * Initialize accessibility system on mount
 * Should be called once at app root level
 */
export function useAccessibilityInitialization() {
  const initializeFromStorage = useAccessibilityStore(
    (state) => state.initializeFromStorage
  );
  const isHydrated = useAccessibilityStore((state) => state.isHydrated);
  const semanticTokens = useSemanticTokens();

  useEffect(() => {
    if (!isHydrated) {
      initializeFromStorage();
    }
  }, [isHydrated, initializeFromStorage]);

  useEffect(() => {
    if (isHydrated) {
      const preferences = loadPreferencesFromStorage();
      applyPreferencesToDocument(preferences);
      applySemanticTokensToDocument(semanticTokens);
    }
  }, [isHydrated, semanticTokens]);
}

/**
 * Focus management for modals, dropdowns, etc.
 */
export function useFocusManager(
  containerRef: React.RefObject<HTMLElement>,
  options?: {
    initialFocusSelector?: string;
    focusElementsSelector?: string;
    restoreFocus?: boolean;
  }
) {
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const focusElements = useRef<HTMLElement[]>([]);

  const focusFirstElement = useCallback(() => {
    if (!containerRef.current) return;

    const selector =
      options?.initialFocusSelector || "[data-autofocus], button, input, a";
    const firstFocusable = containerRef.current.querySelector<HTMLElement>(
      selector
    );

    if (firstFocusable) {
      firstFocusable.focus();
    }
  }, [containerRef, options?.initialFocusSelector]);

  const collectFocusableElements = useCallback(() => {
    if (!containerRef.current) return;

    const selector =
      options?.focusElementsSelector ||
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

    focusElements.current = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(selector)
    ).filter((el) => !el.hasAttribute("disabled"));
  }, [containerRef, options?.focusElementsSelector]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !containerRef.current) return;

      collectFocusableElements();

      const first = focusElements.current[0];
      const last = focusElements.current[focusElements.current.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    },
    [containerRef, collectFocusableElements]
  );

  useEffect(() => {
    previousActiveElement.current = document.activeElement as HTMLElement;
    collectFocusableElements();
    focusFirstElement();

    const container = containerRef.current;
    if (container) {
      container.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      if (container) {
        container.removeEventListener("keydown", handleKeyDown);
      }

      if (options?.restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [
    containerRef,
    focusFirstElement,
    collectFocusableElements,
    handleKeyDown,
    options?.restoreFocus,
  ]);

  return {
    focusFirstElement,
    focusElements: focusElements.current,
  };
}

/**
 * Announce screen reader messages
 */
export function useAccessibilityAnnouncement() {
  const announcerRef = useRef<HTMLDivElement>(null);

  const announce = useCallback(
    (
      message: string,
      options?: {
        priority?: "polite" | "assertive";
        delay?: number;
      }
    ) => {
      if (!announcerRef.current) return;

      const priority = options?.priority || "polite";
      const delay = options?.delay || 0;

      announcerRef.current.setAttribute("role", "status");
      announcerRef.current.setAttribute("aria-live", priority);
      announcerRef.current.setAttribute("aria-atomic", "true");

      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = message;
        }
      }, delay);

      // Clear after announcement
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = "";
        }
      }, delay + 3000);
    },
    []
  );

  return {
    announcerRef,
    announce,
  };
}

/**
 * Accessible form field with validation announcements
 */
export function useAccessibleFormField(fieldId: string) {
  const [error, setError] = useState<string | null>(null);
  const { announce } = useAccessibilityAnnouncement();

  const setFieldError = useCallback(
    (errorMessage: string | null) => {
      setError(errorMessage);

      if (errorMessage) {
        announce(`${fieldId}: ${errorMessage}`, { priority: "assertive" });
      }
    },
    [fieldId, announce]
  );

  return {
    error,
    setFieldError,
    ariaDescribedBy: error ? `${fieldId}-error` : undefined,
    ariaInvalid: error ? "true" : "false",
  };
}

/**
 * Motion and animation preferences hook
 */
export function useMotionPreferencesSafe() {
  const motionPrefs = useMotionPreferences();

  return {
    reduceMotion: motionPrefs.reduced,
    prefersReducedMotion: motionPrefs.prefersReducedMotion,
    shouldAnimate: !motionPrefs.reduced,
    shouldTransition: !motionPrefs.reduced,
    transitionDuration: motionPrefs.reduced ? "0s" : "0.3s",
    animationDuration: motionPrefs.reduced ? "0s" : "0.5s",
  };
}

/**
 * Focus ring visibility hook
 */
export function useFocusRing() {
  const focusPrefs = useFocusPreferences();
  const [isFocused, setIsFocused] = useState(false);

  const onFocus = useCallback(() => setIsFocused(true), []);
  const onBlur = useCallback(() => setIsFocused(false), []);

  return {
    isFocused,
    onFocus,
    onBlur,
    focusStyle: {
      outline: `${focusPrefs.outlineWidth} ${focusPrefs.outlineStyle} ${focusPrefs.outlineColor}`,
      outlineOffset: "2px",
    },
  };
}

/**
 * Keyboard navigation hook
 */
export function useKeyboardNavigation(
  items: HTMLElement[],
  options?: {
    loop?: boolean;
    horizontal?: boolean;
  }
) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const horizontal = options?.horizontal ?? false;
      const loop = options?.loop ?? true;

      let handled = false;

      if (horizontal) {
        if (event.key === "ArrowRight") {
          setCurrentIndex((prev) => {
            const next = prev + 1;
            return loop ? next % items.length : Math.min(next, items.length - 1);
          });
          handled = true;
        } else if (event.key === "ArrowLeft") {
          setCurrentIndex((prev) => {
            const next = prev - 1;
            return loop && next < 0 ? items.length - 1 : Math.max(next, 0);
          });
          handled = true;
        }
      } else {
        if (event.key === "ArrowDown") {
          setCurrentIndex((prev) => {
            const next = prev + 1;
            return loop ? next % items.length : Math.min(next, items.length - 1);
          });
          handled = true;
        } else if (event.key === "ArrowUp") {
          setCurrentIndex((prev) => {
            const next = prev - 1;
            return loop && next < 0 ? items.length - 1 : Math.max(next, 0);
          });
          handled = true;
        }
      }

      if (handled) {
        event.preventDefault();
        items[currentIndex]?.focus();
      }
    },
    [items, options?.horizontal, options?.loop, currentIndex]
  );

  return {
    currentIndex,
    setCurrentIndex,
    handleKeyDown,
    currentItem: items[currentIndex],
  };
}

/**
 * Skip links hook (for main content navigation)
 */
export function useSkipLinks() {
  const mainContentRef = useRef<HTMLDivElement>(null);
  const skipLinksRef = useRef<HTMLDivElement>(null);

  const focusMainContent = useCallback(() => {
    mainContentRef.current?.focus();
  }, []);

  return {
    mainContentRef,
    skipLinksRef,
    focusMainContent,
  };
}

/**
 * Reduced motion safe animation hook
 */
export function useSafeAnimation(
  animationFn: () => void,
  options?: {
    respectReducedMotion?: boolean;
  }
) {
  const motionPrefs = useMotionPreferencesSafe();
  const isReducedMotion = motionPrefs.reduceMotion;

  const runAnimation = useCallback(() => {
    if (options?.respectReducedMotion === false) {
      animationFn();
      return;
    }

    if (!isReducedMotion) {
      animationFn();
    }
  }, [animationFn, isReducedMotion, options?.respectReducedMotion]);

  return {
    runAnimation,
    isReducedMotion,
  };
}

/**
 * Accessible combobox/dropdown hook
 */
export function useAccessibleCombobox(
  options: Array<{ id: string; label: string; value: any }>
) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return {
    containerRef,
    isOpen,
    setIsOpen,
    selectedId,
    setSelectedId,
    inputValue,
    setInputValue,
    filteredOptions,
    selectedOption: options.find((opt) => opt.id === selectedId),
  };
}

/**
 * Live region for dynamic content updates
 */
export function useLiveRegion(
  options?: {
    priority?: "polite" | "assertive";
    atomic?: boolean;
  }
) {
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const updateContent = useCallback(
    (content: string | React.ReactNode) => {
      if (liveRegionRef.current && typeof content === "string") {
        liveRegionRef.current.textContent = content;
      }
    },
    []
  );

  return {
    liveRegionRef,
    updateContent,
    ariaLive: options?.priority || "polite",
    ariaAtomic: options?.atomic ?? true,
  };
}
