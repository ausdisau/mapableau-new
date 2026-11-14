/**
 * Open Access Commons is research-only until independent data, licence,
 * privacy, security, accessibility and OSM community checks complete.
 * Does not enable existing OSM tile or geocoding consumers.
 */
export function isOpenAccessCommonsPreviewEnabled(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return (
    env.MAPABLE_OPEN_COMMONS_PREVIEW_ENABLED === "true" &&
    env.NODE_ENV !== "production" &&
    env.VERCEL_ENV !== "production"
  );
}
