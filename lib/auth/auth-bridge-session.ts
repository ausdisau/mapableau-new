import { cookies } from "next/headers";
import { encode } from "next-auth/jwt";

import { prisma } from "@/lib/prisma";
import { isSafeRedirect } from "@/lib/auth/safe-redirect";

function sessionCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
}

/** Mint a NextAuth JWT session cookie after an external identity bridge succeeds. */
export async function mintNextAuthSessionForUser(input: {
  userId: string;
  returnTo: string;
}): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, email: true, name: true, primaryRole: true },
  });
  if (!user) {
    throw new Error("User not found for bridge session");
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is required");
  }

  const token = await encode({
    token: {
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.primaryRole,
    },
    secret,
  });

  const store = await cookies();
  store.set(sessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return isSafeRedirect(input.returnTo) ? input.returnTo : "/dashboard";
}

export async function clearNextAuthSession(): Promise<void> {
  const store = await cookies();
  store.delete(sessionCookieName());
}
