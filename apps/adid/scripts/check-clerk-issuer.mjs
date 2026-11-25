import { parsePublishableKey } from "@clerk/shared/keys";
import { createPublicKey } from "node:crypto";
import { pathToFileURL } from "node:url";
import { clerkFrontendOrigin } from "../lib/clerk-config.ts";

function httpsEndpoint(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" && !url.username && !url.password && !url.hash
    );
  } catch {
    return false;
  }
}

async function readPublicJson(url, label, fetcher) {
  let response;
  try {
    response = await fetcher(url, {
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new Error(
      label + " could not be reached. Check DNS and TLS for its host.",
    );
  }
  if (!response.ok)
    throw new Error(label + " returned HTTP " + response.status + ".");
  try {
    return await response.json();
  } catch {
    throw new Error(label + " returned invalid JSON.");
  }
}

function isPublicSigningKey(jwk) {
  if (
    !jwk ||
    !["RSA", "EC", "OKP"].includes(jwk.kty) ||
    typeof jwk.kid !== "string" ||
    !jwk.kid ||
    (jwk.kty === "OKP" && !["Ed25519", "Ed448"].includes(jwk.crv)) ||
    (jwk.use && jwk.use !== "sig") ||
    (jwk.key_ops &&
      (!Array.isArray(jwk.key_ops) || !jwk.key_ops.includes("verify")))
  )
    return false;
  try {
    return createPublicKey({ key: jwk, format: "jwk" }).type === "public";
  } catch {
    return false;
  }
}

export async function checkIssuer(env, fetcher = fetch) {
  const origin = clerkFrontendOrigin(env.CLERK_FRONTEND_API_URL);
  if (!origin)
    throw new Error(
      "Set CLERK_FRONTEND_API_URL to the HTTPS origin from Clerk.",
    );
  const key = parsePublishableKey(
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim(),
  );
  if (!key || "https://" + key.frontendApi !== origin)
    throw new Error(
      "The Next.js publishable key must identify the configured Clerk host.",
    );
  const discovery = await readPublicJson(
    origin + "/.well-known/openid-configuration",
    "OIDC discovery",
    fetcher,
  );
  if (clerkFrontendOrigin(discovery?.issuer) !== origin)
    throw new Error(
      "The discovery issuer must match the configured Clerk origin.",
    );
  if (
    ![
      discovery.authorization_endpoint,
      discovery.token_endpoint,
      discovery.jwks_uri,
    ].every(httpsEndpoint) ||
    !Array.isArray(discovery.response_types_supported) ||
    !discovery.response_types_supported.includes("code")
  )
    throw new Error(
      "Discovery is missing HTTPS endpoints or authorization-code support.",
    );
  const jwks = await readPublicJson(
    discovery.jwks_uri,
    "Signing key endpoint",
    fetcher,
  );
  if (!Array.isArray(jwks?.keys) || !jwks.keys.some(isPublicSigningKey))
    throw new Error(
      "The advertised signing key set contains no usable public key.",
    );
  return discovery.issuer;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    console.log("Verified Clerk issuer:", await checkIssuer(process.env));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
