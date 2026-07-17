import { isPrivateNetworkUrl } from "../protocols/wot/security";

export function validateWebhookDestination(
  destinationUrl: string,
  allowlistedHost: string,
): { allowed: boolean; reason: string } {
  const url = new URL(destinationUrl);
  if (isPrivateNetworkUrl(url))
    return { allowed: false, reason: "ssrf_blocked" };
  if (url.protocol !== "https:")
    return { allowed: false, reason: "https_required" };
  if (url.hostname !== allowlistedHost)
    return { allowed: false, reason: "host_not_allowlisted" };
  return { allowed: true, reason: "destination_allowed" };
}
