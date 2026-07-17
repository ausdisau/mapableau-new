export function isPrivateNetworkUrl(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    host.endsWith(".local")
  );
}

export function validateWoTFormSecurity(
  url: string,
  production: boolean,
): { allowed: boolean; reason: string } {
  const parsed = new URL(url);
  if (isPrivateNetworkUrl(parsed))
    return { allowed: false, reason: "ssrf_blocked" };
  if (production && parsed.protocol !== "https:")
    return { allowed: false, reason: "insecure_form_rejected" };
  return { allowed: true, reason: "form_allowed" };
}
