import { NextResponse } from "next/server";

import { requireMfaApiSession } from "@/lib/api/mfa-handler";
import { removeMfaMethod } from "@/lib/auth/mfa-service";
import { isAdminRole } from "@/lib/auth/roles";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  const ctx = await requireMfaApiSession(request as import("next/server").NextRequest);
  if ("error" in ctx) return ctx.error;

  const { id } = await context.params;
  const isAdmin = isAdminRole(ctx.user.primaryRole);
  const targetUserId = ctx.user.id;

  const result = await removeMfaMethod(targetUserId, id, {
    actorUserId: ctx.user.id,
    isAdminAction: isAdmin,
    ipAddress: ctx.audit.ipAddress,
    userAgent: ctx.audit.userAgent,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
