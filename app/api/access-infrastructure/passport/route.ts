import type { NextRequest } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { accessInfrastructureFlags } from "@/lib/access/infrastructure";
import {
  getOrCreatePassport,
  getPassportForUser,
} from "@/lib/access/infrastructure/passport-service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!accessInfrastructureFlags.enabled || !accessInfrastructureFlags.passport) {
    return jsonError("Access Passport is disabled", 404);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const passport = await getOrCreatePassport(user.id);
  return jsonOk({
    productionClaim: "none",
    containsDiagnosis: false,
    passport,
  });
}

export async function PATCH(req: NextRequest) {
  if (!accessInfrastructureFlags.enabled || !accessInfrastructureFlags.passport) {
    return jsonError("Access Passport is disabled", 404);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = (await req.json().catch(() => ({}))) as {
    visibilityDefault?: "private" | "request_scoped" | "approved_service";
  };

  const passport = await getOrCreatePassport(user.id);
  if (body.visibilityDefault) {
    await prisma.accessPassport.update({
      where: { id: passport.id },
      data: { visibilityDefault: body.visibilityDefault },
    });
  }

  const updated = await getPassportForUser(user.id);
  return jsonOk({
    productionClaim: "none",
    containsDiagnosis: false,
    passport: updated,
  });
}
