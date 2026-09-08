/** Grocery supplier API keys — environment variables only. */

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

export function getWoolworthsOfficialApiKey(): string | undefined {
  return readEnv("WOOLWORTHS_API_KEY");
}

export function getWoolworthsPublicApiKey(): string | undefined {
  return readEnv("WOOLWORTHS_PUBLIC_API_KEY");
}

export function getColesApiKey(): string | undefined {
  return readEnv("COLES_API_KEY");
}
