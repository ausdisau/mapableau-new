import { z } from "zod";

export const providerFinderTransferSchema = z.object({
  q: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  service: z.string().optional(),
  accessNeeds: z.array(z.string()).default([]),
  providerFinderPath: z.string().default("/provider-finder"),
});

export type ProviderFinderTransferPayload = z.infer<
  typeof providerFinderTransferSchema
>;

/**
 * Builds an equivalent non-AI Provider Finder URL from approved filters.
 * Never invents providers; only transfers participant-approved search params.
 */
export function buildProviderFinderTransferUrl(
  raw: ProviderFinderTransferPayload,
): string {
  const input = providerFinderTransferSchema.parse(raw);
  const path =
    input.providerFinderPath.startsWith("/") &&
    !input.providerFinderPath.includes("//")
      ? input.providerFinderPath
      : "/provider-finder";

  const params = new URLSearchParams();
  if (input.q?.trim()) params.set("q", input.q.trim());
  if (input.state?.trim()) params.set("state", input.state.trim().toUpperCase());
  if (input.postcode?.trim()) params.set("postcode", input.postcode.trim());
  if (input.service?.trim()) params.set("service", input.service.trim());
  if (input.accessNeeds.length > 0) {
    params.set("accessNeeds", input.accessNeeds.join(","));
  }

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
