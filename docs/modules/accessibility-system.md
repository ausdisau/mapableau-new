# Unified Accessibility System

**Status**: Phase 1 Complete (Zustand store, semantic tokens, React hooks)

## Overview

MapAble's unified accessibility system centralizes all accessibility features across the platform:

- **Zustand Store** (`accessibility-store.ts`) — Global state management for preferences and needs
- **Semantic Tokens** (`semantic-tokens.ts`) — Theme-aware CSS variables and utilities
- **React Hooks** (`use-accessibility.ts`) — Reusable accessibility patterns
- **UI Preferences** (`ui-preferences.ts`) — Text size, contrast, motion, fonts (existing, integrated)
- **Feature Flags** (`feature-flags.ts`) — First-party vs. AccessiBe widget control

## Quick Start

### Initialize the System

In your app root (e.g., `app/layout.tsx` or `app/page.tsx`):

```typescript
import { useAccessibilityInitialization } from "@/lib/accessibility";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useAccessibilityInitialization();

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### Use Accessibility Preferences

```typescript
import {
  useAccessibilityStore,
  useAccessibilityPreferences,
  useSemanticTokens,
} from "@/lib/accessibility";

export function MyComponent() {
  // Get UI preferences (text scale, contrast, etc.)
  const preferences = useAccessibilityPreferences();

  // Get computed theme tokens
  const tokens = useSemanticTokens();

  // Update preferences
  const updatePreferences = useAccessibilityStore(
    (state) => state.updateUiPreferences
  );

  return (
    <div
      style={{
        fontSize: `${preferences.textScale}%`,
        color: tokens.colors.textPrimary,
        fontFamily: tokens.typography.fontFamily,
      }}
    >
      Text respects accessibility preferences!
    </div>
  );
}
```

### Build Accessible Components

```typescript
import {
  useFocusManager,
  useAccessibilityAnnouncement,
  useMotionPreferencesSafe,
} from "@/lib/accessibility";

export function AccessibleModal({ isOpen, onClose }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { focusFirstElement } = useFocusManager(modalRef);
  const { announce } = useAccessibilityAnnouncement();
  const { shouldAnimate, transitionDuration } = useMotionPreferencesSafe();

  useEffect(() => {
    if (isOpen) {
      announce("Modal opened", { priority: "assertive" });
      focusFirstElement();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{
        transition: `opacity ${transitionDuration} ease-in-out`,
      }}
    >
      <h2 id="modal-title">Modal Title</h2>
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

## API Reference

### Zustand Store

```typescript
import { useAccessibilityStore } from "@/lib/accessibility";

// Get entire state
const state = useAccessibilityStore();

// Subscribe to specific slices
const preferences = useAccessibilityStore((s) => s.uiPreferences);
const context = useAccessibilityStore((s) => s.context);

// State updates
state.updateUiPreferences({ textScale: 125 });
state.applyUiPreset("reading-support");
state.addNeed({
  domain: "transport",
  category: "mobility",
  description: "Wheelchair accessible vehicle required",
});

// Utilities
console.log(state.needsSummary()); // "Screen reader, 2 mobility need(s)"
console.log(state.hasActiveNeeds); // boolean
```

### Semantic Tokens

```typescript
import {
  useSemanticTokens,
  semanticColors,
  semanticTypography,
  semanticMotion,
  semanticFocus,
} from "@/lib/accessibility";

const tokens = useSemanticTokens();

// Colors
const colors = semanticColors(tokens);
colors.textPrimary(); // RGB string

// Typography
const typography = semanticTypography(tokens);
typography.scale(); // 1.0–2.0
typography.getFontSizePx(16); // 16–32

// Motion
const motion = semanticMotion(tokens);
motion.reduced(); // boolean
motion.getTransition("opacity", "0.3s"); // CSS transition string

// Focus
const focus = semanticFocus(tokens);
focus.getOutlineStyle(); // CSS outline string
focus.getFocusRing(); // Full focus ring CSS
```

### React Hooks

#### `useAccessibilityInitialization()`

Initialize the accessibility system on app load.

```typescript
useAccessibilityInitialization();
```

#### `useFocusManager(containerRef, options?)`

Manage focus within a container (modals, dropdowns, etc.).

```typescript
const { focusFirstElement, focusElements } = useFocusManager(containerRef, {
  initialFocusSelector: "[data-autofocus]",
  focusElementsSelector: "button, input",
  restoreFocus: true,
});

focusFirstElement(); // Focus first element
```

#### `useAccessibilityAnnouncement()`

Announce messages to screen reader users.

```typescript
const { announcerRef, announce } = useAccessibilityAnnouncement();

announce("Item deleted", { priority: "assertive" });

// Include in your component:
<div ref={announcerRef} />
```

#### `useAccessibleFormField(fieldId)`

Manage form field errors with announcements.

```typescript
const { error, setFieldError, ariaDescribedBy, ariaInvalid } =
  useAccessibleFormField("email-field");

setFieldError("Email is required");

return (
  <>
    <input
      id="email-field"
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
    />
    {error && <div id="email-field-error">{error}</div>}
  </>
);
```

#### `useMotionPreferencesSafe()`

Get motion preferences safely.

```typescript
const { reduceMotion, shouldAnimate, transitionDuration } =
  useMotionPreferencesSafe();

return (
  <div style={{ transition: `opacity ${transitionDuration} ease-in-out` }}>
    Content
  </div>
);
```

#### `useFocusRing()`

Get focus ring styling.

```typescript
const { isFocused, onFocus, onBlur, focusStyle } = useFocusRing();

return (
  <button
    onFocus={onFocus}
    onBlur={onBlur}
    style={isFocused ? focusStyle : {}}
  >
    Click me
  </button>
);
```

#### `useKeyboardNavigation(items, options?)`

Navigate between items with arrow keys.

```typescript
const { handleKeyDown, currentIndex, currentItem } = useKeyboardNavigation(
  tabItems,
  { horizontal: true, loop: true }
);

return (
  <div onKeyDown={handleKeyDown}>
    {tabItems.map((item, i) => (
      <button key={i} data-selected={currentIndex === i}>
        {item}
      </button>
    ))}
  </div>
);
```

#### `useSkipLinks()`

Create skip-to-main-content navigation.

```typescript
const { mainContentRef, skipLinksRef, focusMainContent } = useSkipLinks();

return (
  <>
    <div ref={skipLinksRef} role="navigation" aria-label="Skip links">
      <a href="#main-content" onClick={focusMainContent}>
        Skip to main content
      </a>
    </div>
    <div ref={mainContentRef} id="main-content" tabIndex={-1}>
      Main content here
    </div>
  </>
);
```

#### `useLiveRegion(options?)`

Create live region for dynamic updates.

```typescript
const { liveRegionRef, updateContent, ariaLive, ariaAtomic } = useLiveRegion({
  priority: "assertive",
});

return (
  <>
    <button onClick={() => updateContent("Item saved!")}>Save</button>
    <div ref={liveRegionRef} aria-live={ariaLive} aria-atomic={ariaAtomic} />
  </>
);
```

## Data Structure

### AccessibilityUiPreferences

```typescript
interface AccessibilityUiPreferences {
  version: 1;
  textScale: 100 | 112.5 | 125 | 150 | 200;
  fontMode: "default" | "readable" | "dyslexia-friendly";
  lineHeight: "default" | "relaxed" | "extra-relaxed";
  letterSpacing: "default" | "increased" | "extra-increased";
  contentAlignment: "default" | "left" | "center" | "right";
  contrastTheme: "default" | "light" | "dark" | "high";
  saturation: "default" | "low" | "high" | "monochrome";
  reduceMotion: boolean;
  stopAnimations: boolean;
  disableSmoothScrolling: boolean;
  reduceDecorativeImages: boolean;
  reduceClutter: boolean;
  readingMode: boolean;
  readingGuide: boolean;
  readingMask: boolean;
  highlightHeadings: boolean;
  highlightLinks: boolean;
  highlightFocus: boolean;
  highlightHover: boolean;
  textMagnifier: boolean;
  cursorMode: "default" | "large-dark" | "large-light";
  muteAutomaticSounds: boolean;
  customColors?: {
    text?: string;
    heading?: string;
    background?: string;
  };
}
```

### AccessibilityContext

```typescript
interface AccessibilityContext {
  isScreenReaderUser: boolean;
  isVoiceControlUser: boolean;
  preferSimpleLanguage: boolean;
  mobilityNeeds: AccessibilityNeed[];
  sensoryNeeds: AccessibilityNeed[];
  cognitiveNeeds: AccessibilityNeed[];
  customNeeds: AccessibilityNeed[];
}
```

### SemanticTokens

```typescript
interface SemanticTokens {
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
```

## Integration with Existing Code

### Migrate from Direct Preference Calls

**Before** (scattered):
```typescript
import { loadPreferencesFromStorage } from "@/lib/accessibility/ui-preferences";

const prefs = loadPreferencesFromStorage();
const scale = prefs.textScale;
```

**After** (centralized):
```typescript
import { useAccessibilityPreferences } from "@/lib/accessibility";

const prefs = useAccessibilityPreferences();
const scale = prefs.textScale;
```

### Integrate with CareAccessNeed

```typescript
import { useAccessibilityStore } from "@/lib/accessibility";

export function CareBookingForm() {
  const addNeed = useAccessibilityStore((state) => state.addNeed);

  const handleCareRequest = (careAccessNeeds: CareAccessNeed[]) => {
    careAccessNeeds.forEach((need) => {
      addNeed({
        domain: "care",
        category: need.category as any,
        description: need.description,
        verificationStatus: "verified",
      });
    });
  };

  // ...
}
```

### Use in Transport Dispatch

```typescript
import { useAccessibilityNeeds } from "@/lib/accessibility";

export function TransportDispatchConsole() {
  const needs = useAccessibilityNeeds();

  // Filter eligible drivers based on mobility needs
  const eligibleDrivers = drivers.filter((driver) => {
    return needs.mobilityNeeds.every((need) =>
      driver.qualifications.includes(need.description)
    );
  });

  // ...
}
```

## CSS Custom Properties

Automatically applied when preferences change:

```css
/* Colors */
--a11y-color-text-primary
--a11y-color-text-secondary
--a11y-color-text-inverse
--a11y-color-background-primary
--a11y-color-background-secondary
--a11y-color-focus
--a11y-color-error
--a11y-color-success
--a11y-color-warning

/* Typography */
--a11y-typography-scale
--a11y-typography-font-family
--a11y-typography-line-height
--a11y-typography-letter-spacing

/* Motion */
--a11y-motion-reduced (0 or 1)

/* Focus */
--a11y-focus-outline-width
--a11y-focus-outline-style
--a11y-focus-outline-color
```

### Usage in CSS

```css
body {
  color: var(--a11y-color-text-primary);
  background-color: var(--a11y-color-background-primary);
  font-family: var(--a11y-typography-font-family);
  font-size: calc(16px * var(--a11y-typography-scale));
  line-height: calc(1.5 * var(--a11y-typography-line-height));
}

button:focus {
  outline: var(--a11y-focus-outline-width)
    var(--a11y-focus-outline-style) var(--a11y-focus-outline-color);
}
```

## Testing

### Unit Tests

```typescript
import { renderHook, act } from "@testing-library/react";
import { useAccessibilityStore } from "@/lib/accessibility";

describe("Accessibility Store", () => {
  it("should update UI preferences", () => {
    const { result } = renderHook(() => useAccessibilityStore());

    act(() => {
      result.current.updateUiPreferences({ textScale: 150 });
    });

    expect(result.current.uiPreferences.textScale).toBe(150);
  });

  it("should add accessibility needs", () => {
    const { result } = renderHook(() => useAccessibilityStore());

    act(() => {
      result.current.addNeed({
        domain: "transport",
        category: "mobility",
        description: "Wheelchair accessible",
      });
    });

    expect(result.current.context.mobilityNeeds.length).toBe(1);
  });
});
```

### A11y Tests (Playwright)

See `tests/a11y/accessibility-system.test.ts` for full suite.

## Next Steps

1. ✅ Create Zustand store
2. ✅ Add semantic tokens
3. ✅ Create React hooks
4. ⏳ Refactor existing code to use new system
5. ⏳ Add component examples
6. ⏳ Write comprehensive tests
7. ⏳ Document migration path for teams

## FAQ

**Q: How do I persist preferences to the server?**

A: Save via your API:

```typescript
const prefs = useAccessibilityPreferences();
await fetch("/api/me/accessibility", {
  method: "POST",
  body: JSON.stringify(prefs),
});
```

**Q: Do preferences persist across sessions?**

A: Yes, automatically to localStorage (with privacy fallback).

**Q: Can I have different preferences per domain (care vs. transport)?**

A: Currently global. To add domain-specific, extend `AccessibilityContext` with `carePref`/`transportPref`.

**Q: How do I test with reduced motion?**

A: Use Playwright with `prefers-reduced-motion`:

```typescript
test("respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  // Test reduced motion behavior
});
```

---

**Documentation updated**: 2026-07-27  
**Version**: 1.0 (Phase 1 Complete)
