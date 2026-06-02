import NextAuth from "next-auth";
import type { NextRequest } from "next/server";

import { authOptions } from "@/lib/auth/auth-options";
import { isNeonAuthEnabled } from "@/lib/auth/auth-provider";
import { getNeonAuthHandler } from "@/lib/auth/neon-auth-server";

const neonHandlers = isNeonAuthEnabled() ? getNeonAuthHandler() : null;
const nextAuthHandler = neonHandlers ? null : NextAuth(authOptions);

type AuthRouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: AuthRouteContext) {
  if (neonHandlers) return neonHandlers.GET(request, context);
  return nextAuthHandler!(request, context);
}

export async function POST(request: NextRequest, context: AuthRouteContext) {
  if (neonHandlers) return neonHandlers.POST(request, context);
  return nextAuthHandler!(request, context);
}
