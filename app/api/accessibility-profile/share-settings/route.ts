import type { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import {
  accessShareSettingsPatchSchema,
  isSharingActive,
  parseAccessShareSettings,
  shareSettingsMateriallyEqual,
} from "@/lib/access-passport/share-settings";
import {
  listEligiblePassportRecipients,
  verifyPassportRecipientOrganisation,
} from "@/lib/access-passport/verify-recipient";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { replaceAccessPassportConsent } from "@/lib/consent/consent-service";
import { prisma } from "@/lib/prisma";
import type { AccessShareSettings } from "@/types/access-passport";

function toJson(value: AccessShareSettings): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const [profile, recipients] = await Promise.all([
    prisma.accessibilityProfile.findUnique({
      where: { userId: user.id },
      select: { shareWithProviders: true },
    }),
    listEligiblePassportRecipients(user.id),
  ]);

  const settings = parseAccessShareSettings(profile?.shareWithProviders);
  return jsonOk({
    shareSettings: settings,
    sharingActive: isSharingActive(settings),
    eligibleRecipients: recipients,
  });
}

export async function PATCH(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = accessShareSettingsPatchSchema.parse(await req.json());

    const existing = await prisma.accessibilityProfile.findUnique({
      where: { userId: user.id },
    });
    const previous = parseAccessShareSettings(existing?.shareWithProviders);

    const wantsActive = body.active && body.categories.length > 0;
    if (
      wantsActive &&
      shareSettingsMateriallyEqual(previous, {
        ...body,
        active: true,
      }) &&
      previous.grantId
    ) {
      return jsonOk({
        shareSettings: previous,
        sharingActive: isSharingActive(previous),
      });
    }

    let recipientOrganisationId: string | null = null;
    let recipientLabel = "";

    if (wantsActive) {
      if (!body.recipientOrganisationId) {
        return jsonError(
          "Select a verified organisation before sharing access requirements.",
          400,
        );
      }
      const verified = await verifyPassportRecipientOrganisation({
        participantUserId: user.id,
        organisationId: body.recipientOrganisationId,
      });
      if (!verified.ok) {
        return jsonError(verified.reason, 403);
      }
      recipientOrganisationId = verified.organisationId;
      recipientLabel = verified.displayName;
    }

    const replaced = await replaceAccessPassportConsent({
      subjectUserId: user.id,
      actorUserId: user.id,
      previousGrantId: previous.grantId,
      recipientOrganisationId,
      purpose: body.purpose,
      categories: body.categories,
      expiresAt: body.expiresAt,
      active: wantsActive,
    });

    const next: AccessShareSettings = {
      version: 1,
      categories: body.categories,
      recipientOrganisationId,
      recipientLabel,
      purpose: body.purpose,
      expiresAt: body.expiresAt,
      active: wantsActive,
      updatedAt: new Date().toISOString(),
      grantId: replaced.grantId,
    };

    const updated = existing
      ? await prisma.accessibilityProfile.update({
          where: { userId: user.id },
          data: { shareWithProviders: toJson(next) },
        })
      : await prisma.accessibilityProfile.create({
          data: {
            userId: user.id,
            mobilityNeeds: [],
            communicationPreferences: [],
            sensoryPreferences: {},
            cognitivePreferences: {},
            transportRequirements: {},
            digitalPreferences: {},
            shareWithProviders: toJson(next),
          },
        });

    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole as never,
      action: wantsActive ? "consent.granted" : "consent.revoked",
      entityType: "AccessibilityProfile",
      entityId: updated.id,
      participantId: user.id,
      metadata: {
        categories: next.categories,
        active: next.active,
        recipientOrganisationId: next.recipientOrganisationId,
      },
    });

    return jsonOk({
      shareSettings: next,
      sharingActive: isSharingActive(next),
    });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not update share settings", 500);
  }
}
