/**
 * Hugging Face Router (OpenAI-compatible) for MapAble Labs demos only.
 * Never used for Mobility Futures autonomy decisions or GAIS writes.
 */

export const HF_ROUTER_BASE_URL = "https://router.huggingface.co/v1";

export const DEFAULT_LABS_HF_VISION_MODEL =
  "meta-models/Muse-Glimmer-30B:preferred";

export const DEFAULT_LABS_VISION_PROMPT =
  "Describe this image in one sentence.";

/** Public demo image — accessibility / landmark context, not personal data. */
export const DEFAULT_LABS_VISION_IMAGE_URL =
  "https://cdn.britannica.com/61/93061-050-99147DCE/Statue-of-Liberty-Island-New-York-Bay.jpg";

export function getLabsHfToken(): string | null {
  const token = process.env.HF_TOKEN?.trim();
  return token && token.length > 0 ? token : null;
}

export function getLabsVisionModel(): string {
  return (
    process.env.LABS_HF_VISION_MODEL?.trim() || DEFAULT_LABS_HF_VISION_MODEL
  );
}

export function isLabsHfVisionConfigured(): boolean {
  return getLabsHfToken() !== null;
}
