/**
 * Client-safe GAIS layer enablement.
 */

export function isClientGaisLayerEnabled(
  env: {
    NEXT_PUBLIC_MAPABLE_GAIS_ENABLED?: string;
    NEXT_PUBLIC_MAPABLE_GAIS_LAYER?: string;
  } = {
    NEXT_PUBLIC_MAPABLE_GAIS_ENABLED: process.env.NEXT_PUBLIC_MAPABLE_GAIS_ENABLED,
    NEXT_PUBLIC_MAPABLE_GAIS_LAYER: process.env.NEXT_PUBLIC_MAPABLE_GAIS_LAYER,
  },
): boolean {
  return (
    env.NEXT_PUBLIC_MAPABLE_GAIS_ENABLED === "true" &&
    env.NEXT_PUBLIC_MAPABLE_GAIS_LAYER === "true"
  );
}
