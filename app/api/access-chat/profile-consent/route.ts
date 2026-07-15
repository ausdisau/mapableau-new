import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  consented: z.boolean(),
});

/** Record or revoke consent to attach access profile fields to Access chat. */
export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (parsed.data.consented) {
    const row = await prisma.accessChatProfileConsent.upsert({
      where: { userId: user.id },
      create: { userId: user.id, consentedAt: new Date(), revokedAt: null },
      update: { consentedAt: new Date(), revokedAt: null },
    });
    return jsonOk({
      consented: true,
      consentedAt: row.consentedAt.toISOString(),
    });
  }

  const row = await prisma.accessChatProfileConsent.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      consentedAt: new Date(),
      revokedAt: new Date(),
    },
    update: { revokedAt: new Date() },
  });

  return jsonOk({
    consented: false,
    revokedAt: row.revokedAt?.toISOString() ?? null,
  });
}

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const row = await prisma.accessChatProfileConsent.findUnique({
    where: { userId: user.id },
  });

  const active = Boolean(row && !row.revokedAt);
  return jsonOk({
    consented: active,
    consentedAt: row?.consentedAt.toISOString() ?? null,
    revokedAt: row?.revokedAt?.toISOString() ?? null,
  });
}
