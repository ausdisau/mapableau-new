function stripScheme(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function getAuth0Env() {
  const appBaseUrl =
    process.env.APP_BASE_URL ??
    process.env.AUTH0_BASE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";

  const issuer =
    process.env.AUTH0_DOMAIN ??
    (process.env.AUTH0_ISSUER_BASE_URL
      ? stripScheme(process.env.AUTH0_ISSUER_BASE_URL)
      : undefined);

  const secret = process.env.AUTH0_SECRET ?? process.env.NEXTAUTH_SECRET;
  const scope =
    process.env.AUTH0_SCOPE ?? "openid profile email";

  return {
    AUTH0_SECRET: secret,
    APP_BASE_URL: appBaseUrl.replace(/\/$/, ""),
    AUTH0_DOMAIN: issuer,
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
    AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
    AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
    AUTH0_SCOPE: scope,
    AUTH_PROVIDER: (process.env.AUTH_PROVIDER ?? "auth0") as "auth0" | "nextauth",
    AUTH_AUDIT_PEPPER:
      process.env.AUTH_AUDIT_PEPPER ?? process.env.AUTH0_SECRET ?? "dev-pepper",
  };
}

export function assertAuth0Configured(): void {
  const env = getAuth0Env();
  if (!env.AUTH0_SECRET || env.AUTH0_SECRET.length < 32) {
    throw new Error("AUTH0_SECRET must be at least 32 characters");
  }
  if (!env.AUTH0_DOMAIN || !env.AUTH0_CLIENT_ID || !env.AUTH0_CLIENT_SECRET) {
    throw new Error(
      "AUTH0_DOMAIN, AUTH0_CLIENT_ID, and AUTH0_CLIENT_SECRET are required when AUTH_PROVIDER=auth0"
    );
  }
}
