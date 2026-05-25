const ALLOWED_HOSTS = new Set([
  "app.mapable.com.au",
  "www.mapable.com.au",
  "localhost",
  "localhost:3000",
]);

const DEFAULT_RETURN = "/dashboard";

export function sanitizeReturnTo(returnTo: string | null | undefined): string {
  if (!returnTo || typeof returnTo !== "string") {
    return DEFAULT_RETURN;
  }

  const trimmed = returnTo.trim();
  if (!trimmed) return DEFAULT_RETURN;

  if (trimmed.startsWith("//") || trimmed.includes("@")) {
    return DEFAULT_RETURN;
  }

  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const host = url.port ? `${url.hostname}:${url.port}` : url.hostname;
      if (!ALLOWED_HOSTS.has(host) && !ALLOWED_HOSTS.has(url.hostname)) {
        return DEFAULT_RETURN;
      }
      return url.pathname + url.search + url.hash || DEFAULT_RETURN;
    } catch {
      return DEFAULT_RETURN;
    }
  }

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return DEFAULT_RETURN;
  }

  return trimmed;
}
