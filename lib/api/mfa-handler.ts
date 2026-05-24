import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { requestSecurityContext } from "@/lib/audit/auth-security-audit";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiUnauthorized } from "@/lib/auth/guards";

export async function requireMfaApiSession(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: apiUnauthorized() } as const;

  const user = await getCurrentUser();
  if (!user) return { error: apiUnauthorized() } as const;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const audit = requestSecurityContext(request.headers);

  return { session, user, token, audit } as const;
}
