import type { Provider } from "@/app/provider-finder/providers";

/** Ensures finder providers always have stable id + slug (API/JSON rows may omit them). */
export function normalizeProvider(p: Provider): Provider {
  const id = p.id?.trim() || `provider-${crypto.randomUUID()}`;
  const slug = p.slug?.trim() || id;
  return { ...p, id, slug };
}
