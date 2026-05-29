import { SignJWT, jwtVerify } from "jose";

import { getAppSecretBytes } from "@/lib/auth/app-secret";

const BRIDGE_PURPOSE = "wix_auth_bridge";
const TTL_SECONDS = 60;

function bridgeSecret(): Uint8Array {
  return getAppSecretBytes();
}

export async function createWixBridgeToken(input: {
  userId: string;
  returnTo: string;
}): Promise<string> {
  return new SignJWT({
    purpose: BRIDGE_PURPOSE,
    userId: input.userId,
    returnTo: input.returnTo,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(bridgeSecret());
}

export async function verifyWixBridgeToken(token: string): Promise<{
  userId: string;
  returnTo: string;
} | null> {
  try {
    const { payload } = await jwtVerify(token, bridgeSecret());
    if (payload.purpose !== BRIDGE_PURPOSE) return null;
    if (typeof payload.userId !== "string") return null;
    if (typeof payload.returnTo !== "string") return null;
    return { userId: payload.userId, returnTo: payload.returnTo };
  } catch {
    return null;
  }
}
