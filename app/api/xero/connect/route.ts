import { NextResponse } from "next/server";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError } from "@/lib/api/response";
import {
  setXeroOAuthStateCookie,
  startXeroOAuth,
} from "@/lib/xero/xero-oauth-service";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireApiPermission("xero:manage");
  if (user instanceof Response) return user;

  const organisationId = new URL(req.url).searchParams.get("organisationId");
  if (!organisationId) return jsonError("organisationId required", 400);

  const member = await prisma.organisationMember.findFirst({
    where: { userId: user.id, organisationId },
  });
  if (!member) return jsonError("Forbidden", 403);

  const { url, state } = startXeroOAuth(organisationId);
  await setXeroOAuthStateCookie(state);
  return NextResponse.redirect(url);
}
