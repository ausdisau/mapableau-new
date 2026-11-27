// Auth0 supplies this signed claim from its Post Login Action. It is never user metadata.
export const adidConnectionClaim = "https://www.ausdis.com.au/adid/connection";

type Environment = Readonly<Record<string, string | undefined>>;

export function clerkLoginSelected(env: Environment = process.env) {
  return env.ADID_AUTH0_ENABLED === "true";
}

function httpsOrigin(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      !url.port &&
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash
      ? url.origin
      : null;
  } catch {
    return null;
  }
}

export function getAdidConfig(env: Environment = process.env) {
  const issuerValue = env.ADID_AUTH0_ISSUER?.trim();
  const connection = env.ADID_AUTH0_CONNECTION?.trim();
  const clientId = env.ADID_AUTH0_CLIENT_ID?.trim();
  const clientSecret = env.ADID_AUTH0_CLIENT_SECRET?.trim();
  const issuer = httpsOrigin(issuerValue);
  const portal = httpsOrigin(env.ADID_PORTAL_ORIGIN);
  if (
    !clerkLoginSelected(env) ||
    !issuer ||
    !portal ||
    !connection ||
    !clientId ||
    !clientSecret
  )
    return null;
  return { issuer: issuer + "/", portal, connection, clientId, clientSecret };
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
