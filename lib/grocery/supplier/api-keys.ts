/**
 * Grocery supplier API keys — must come from environment variables.
 * Never hardcode retailer API keys in source.
 */

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

/** Woolworths portal subscription key (official API). */
export function getWoolworthsOfficialApiKey(): string | undefined {
  return readEnv("WOOLWORTHS_API_KEY");
}

/** Woolworths public search UI key (legacy fallback path). */
export function getWoolworthsPublicApiKey(): string | undefined {
  return readEnv("WOOLWORTHS_PUBLIC_API_KEY");
}

/** Coles BFF search API key. */
export function getColesApiKey(): string | undefined {
  return readEnv("COLES_API_KEY");
}
