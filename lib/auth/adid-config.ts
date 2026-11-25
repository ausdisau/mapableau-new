// Auth0 supplies this signed claim from its Post Login Action. It is never user metadata.
export const adidConnectionClaim = "https://www.ausdis.com.au/adid/connection";

export function getAdidConfig(env: Readonly<Record<string, string | undefined>> = process.env) {
  const issuerValue = env.ADID_AUTH0_ISSUER?.trim();
  const connection = env.ADID_AUTH0_CONNECTION?.trim();
  const clientId = env.ADID_AUTH0_CLIENT_ID?.trim();
  const clientSecret = env.ADID_AUTH0_CLIENT_SECRET?.trim();
  if (
    env.ADID_AUTH0_ENABLED !== "true" ||
    !issuerValue ||
    !connection ||
    !clientId ||
    !clientSecret
  )
    return null;
  try {
    const url = new URL(issuerValue);
    if (
      url.protocol !== "https:" ||
      url.port ||
      url.pathname !== "/" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return null;
    return { issuer: url.origin + "/", connection, clientId, clientSecret };
  } catch {
    return null;
  }
}

export function adidIdentity(
  profile: unknown,
  providerAccountId: string,
  config: NonNullable<ReturnType<typeof getAdidConfig>>,
) {
  if (!profile || typeof profile !== "object") return null;
  const claims = profile as Record<string, unknown>;
  if (
    claims.iss !== config.issuer ||
    claims[adidConnectionClaim] !== config.connection ||
    typeof claims.sub !== "string" ||
    !claims.sub.trim() ||
    claims.sub.length > 255 ||
    claims.sub !== providerAccountId
  )
    return null;
  return {
    provider: "adid:" + config.issuer,
    subject: claims.sub,
    verifiedEmail:
      claims.email_verified === true && typeof claims.email === "string"
        ? claims.email
        : null,
    name: typeof claims.name === "string" ? claims.name : null,
  };
}
