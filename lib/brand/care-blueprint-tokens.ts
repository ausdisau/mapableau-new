/**
 * MapAble Care blueprint brand tokens (logo kit).
 * Apply to Care / Navigator pilot chrome only — not a whole-site redesign.
 */

export const CARE_BLUEPRINT_BRAND = {
  logoBlue: "#1C5A96",
  logoPurple: "#605B9F",
  logoOrange: "#F37327",
  logoGold: "#F5981D",
  paleLavender: "#F2ECF1",
  functionalGreen: "#2F6B33",
  warmCanvas: "#F4F2EF",
  charcoal: "#1F2C2B",
} as const;

/** Inline CSS variables for pilot surfaces. */
export const careBlueprintCssVariables: Record<string, string> = {
  "--care-brand-blue": CARE_BLUEPRINT_BRAND.logoBlue,
  "--care-brand-purple": CARE_BLUEPRINT_BRAND.logoPurple,
  "--care-brand-orange": CARE_BLUEPRINT_BRAND.logoOrange,
  "--care-brand-gold": CARE_BLUEPRINT_BRAND.logoGold,
  "--care-brand-lavender": CARE_BLUEPRINT_BRAND.paleLavender,
  "--care-brand-green": CARE_BLUEPRINT_BRAND.functionalGreen,
  "--care-brand-canvas": CARE_BLUEPRINT_BRAND.warmCanvas,
  "--care-brand-charcoal": CARE_BLUEPRINT_BRAND.charcoal,
};

export const carePilotSurfaceClass =
  "care-blueprint-pilot bg-[var(--care-brand-canvas)] text-[var(--care-brand-charcoal)]";

export const carePilotAccentTextClass = "text-[var(--care-brand-blue)]";
export const carePilotSecondaryAccentClass = "text-[var(--care-brand-purple)]";
export const carePilotCtaClass =
  "rounded-xl bg-[var(--care-brand-blue)] px-4 py-2.5 font-bold text-white hover:opacity-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--care-brand-gold)]/40";
