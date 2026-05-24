import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  ensureDefaultCommunicationPreferences,
  getVerifiedPhoneE164,
} from "@/lib/notifications/communication-preferences";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  communicationPreferenceUpdateSchema,
  normalizePhoneE164,
} from "@/lib/validation/communications";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  await ensureDefaultCommunicationPreferences(user.id);
  const preferences = await prisma.communicationPreference.findMany({
    where: { userId: user.id },
    orderBy: [{ channel: "asc" }, { notificationType: "asc" }],
  });
  const verifiedPhone = await getVerifiedPhoneE164(user.id);

  return jsonOk({ preferences, verifiedPhone });
}

export async function PATCH(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const { preferences, phone } = communicationPreferenceUpdateSchema.parse(
      await req.json()
    );

    for (const pref of preferences) {
      const consentStatus =
        pref.consentStatus ??
        (pref.enabled ? ("opted_in" as const) : ("opted_out" as const));

      await prisma.communicationPreference.upsert({
        where: {
          userId_channel_notificationType: {
            userId: user.id,
            channel: pref.channel,
            notificationType: pref.notificationType,
          },
        },
        create: {
          userId: user.id,
          channel: pref.channel,
          notificationType: pref.notificationType,
          enabled: pref.enabled,
          consentStatus,
          quietHoursStart: pref.quietHoursStart ?? undefined,
          quietHoursEnd: pref.quietHoursEnd ?? undefined,
          accessibleCommunicationMode:
            pref.accessibleCommunicationMode ?? undefined,
          timezone: pref.timezone ?? user.timezone,
        },
        update: {
          enabled: pref.enabled,
          consentStatus,
          quietHoursStart: pref.quietHoursStart,
          quietHoursEnd: pref.quietHoursEnd,
          accessibleCommunicationMode: pref.accessibleCommunicationMode,
          timezone: pref.timezone,
        },
      });
    }

    if (phone) {
      const phoneNumberE164 = normalizePhoneE164(phone);
      if (!phoneNumberE164) {
        return jsonError("Invalid phone number", 400);
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { phone: phoneNumberE164 },
      });
    }

    await createAuditEvent({
      actorUserId: user.id,
      action: "communication.preferences_updated",
      entityType: "User",
      entityId: user.id,
      participantId: user.id,
    });

    const updated = await prisma.communicationPreference.findMany({
      where: { userId: user.id },
    });
    return jsonOk({ preferences: updated });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Update failed", 500);
  }
}
