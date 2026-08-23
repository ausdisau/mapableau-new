/**
 * Simulation boundary: Labs data must never write to production GAIS evidence.
 */

/** Modules Labs runtime must never import. */
export const FORBIDDEN_GAIS_WRITE_IMPORTS = [
  "@/lib/gais/telemetry/store",
  "@/lib/gais/telemetry/index",
  "@/app/api/gais/telemetry",
  "@/lib/access/intelligence-next/change-detection/persist",
  "@/lib/access/intelligence-next/evidence/persist",
] as const;

export const LABS_RUNTIME_MODULE_GLOBS = [
  "lib/labs/runtime",
  "lib/labs/experiments",
  "lib/labs/contracts",
  "components/labs",
] as const;

export function isForbiddenGaisWriteImport(specifier: string): boolean {
  return FORBIDDEN_GAIS_WRITE_IMPORTS.some(
    (forbidden) =>
      specifier === forbidden ||
      specifier.startsWith(`${forbidden}/`) ||
      specifier.includes("gais/telemetry") ||
      specifier.includes("evidence/persist") ||
      specifier.includes("change-detection/persist"),
  );
}
