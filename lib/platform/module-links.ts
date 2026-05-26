import { getProductModule } from "@/lib/platform/modules";
import type { MapAbleModule, ModuleAvailability } from "@/lib/platform/modules-catalog";

/** Carousel / marketing href — never points at a missing App Router tree. */
export function resolveModuleHref(module: MapAbleModule): string {
  if (module.availability === "coming_soon") {
    return `/core/modules/${module.key}`;
  }
  const product = getProductModule(module.productKey ?? module.key);
  return product?.href ?? module.href;
}

export function moduleAvailabilityLabel(
  availability: ModuleAvailability
): string | null {
  if (availability === "coming_soon") return "Coming soon";
  if (availability === "beta") return "Beta";
  return null;
}
