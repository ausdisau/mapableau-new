import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_MAP_STYLE_URL: z.string().url().optional(),
  NEXT_PUBLIC_MAP_ATTRIBUTION: z.string().optional(),
  NEXT_PUBLIC_MAP_DEFAULT_LAT: z.coerce.number().default(-33.8688),
  NEXT_PUBLIC_MAP_DEFAULT_LNG: z.coerce.number().default(151.2093),
  NEXT_PUBLIC_MAP_DEFAULT_ZOOM: z.coerce.number().min(1).max(20).default(6),
  MAP_TILE_PROVIDER: z.string().optional(),
  MAP_TILE_CONTACT_EMAIL: z.string().email().optional(),
  MAP_ENABLE_SPONSORED_LAYER: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v !== "false"),
  MAP_ENABLE_REVIEWS_LAYER: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v !== "false"),
  MAP_ENABLE_DISPATCH_LAYER: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export type MapConfig = z.infer<typeof envSchema>;

export function getMapConfig(): MapConfig {
  return envSchema.parse({
    NEXT_PUBLIC_MAP_STYLE_URL: process.env.NEXT_PUBLIC_MAP_STYLE_URL,
    NEXT_PUBLIC_MAP_ATTRIBUTION: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION,
    NEXT_PUBLIC_MAP_DEFAULT_LAT: process.env.NEXT_PUBLIC_MAP_DEFAULT_LAT,
    NEXT_PUBLIC_MAP_DEFAULT_LNG: process.env.NEXT_PUBLIC_MAP_DEFAULT_LNG,
    NEXT_PUBLIC_MAP_DEFAULT_ZOOM: process.env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM,
    MAP_TILE_PROVIDER: process.env.MAP_TILE_PROVIDER,
    MAP_TILE_CONTACT_EMAIL: process.env.MAP_TILE_CONTACT_EMAIL,
    MAP_ENABLE_SPONSORED_LAYER: process.env.MAP_ENABLE_SPONSORED_LAYER,
    MAP_ENABLE_REVIEWS_LAYER: process.env.MAP_ENABLE_REVIEWS_LAYER,
    MAP_ENABLE_DISPATCH_LAYER: process.env.MAP_ENABLE_DISPATCH_LAYER,
  });
}

export function getDefaultCenter(): [number, number] {
  const config = getMapConfig();
  return [config.NEXT_PUBLIC_MAP_DEFAULT_LNG, config.NEXT_PUBLIC_MAP_DEFAULT_LAT];
}

export function getDefaultZoom(): number {
  return getMapConfig().NEXT_PUBLIC_MAP_DEFAULT_ZOOM;
}
