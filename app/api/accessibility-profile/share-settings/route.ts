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
import { consentScopeToPrisma } from "@/lib/consent/scope-map";
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

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.accessibilityProfile.findUnique({
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
        previous.consentRecordId
      ) {
        return {
          shareSettings: previous,
          sharingActive: isSharingActive(previous),
          noop: true as const,
        };
      }

      let recipientOrganisationId: string | null = null;
      let recipientLabel = "";

      if (wantsActive) {
        if (!body.recipientOrganisationId) {
          throw new Error("RECIPIENT_REQUIRED");
        }
        const verified = await verifyPassportRecipientOrganisation({
          participantUserId: user.id,
          organisationId: body.recipientOrganisationId,
        });
        if (!verified.ok) {
          throw new Error(`RECIPIENT_INVALID:${verified.reason}`);
        }
        recipientOrganisationId = verified.organisationId;
        recipientLabel = verified.displayName;
      }

      if (previous.consentRecordId) {
        await tx.consentRecord.updateMany({
          where: {
            id: previous.consentRecordId,
            subjectUserId: user.id,
            status: "active",
          },
          data: {
            status: "revoked",
            revokedById: user.id,
            revokedAt: new Date(),
          },
        });
      }

      // Also revoke any other active accessibility.read grants for this subject
      // to the same org to prevent duplicate actives under race conditions.
      if (recipientOrganisationId) {
        await tx.consentRecord.updateMany({
          where: {
            subjectUserId: user.id,
            grantedToOrganisationId: recipientOrganisationId,
            scope: consentScopeToPrisma("accessibility.read"),
            status: "active",
          },
          data: {
            status: "revoked",
            revokedById: user.id,
            revokedAt: new Date(),
          },
        });
      }

      let consentRecordId: string | undefined;
      if (wantsActive && recipientOrganisationId) {
        const consent = await tx.consentRecord.create({
          data: {
            subjectUserId: user.id,
            grantedToOrganisationId: recipientOrganisationId,
            scope: consentScopeToPrisma("accessibility.read"),
            purpose: body.purpose,
            status: "active",
            expiryDate: body.expiresAt ? new Date(body.expiresAt) : undefined,
            createdById: user.id,
            shareMode: "always_for_service",
            recipientType: "organisation",
            dataScope: body.categories,
            sourceAction: "access_passport.share_settings",
          },
        });
        consentRecordId = consent.id;
      }

      const next: AccessShareSettings = {
        version: 1,
        categories: body.categories,
        recipientOrganisationId,
        recipientLabel,
        purpose: body.purpose,
        expiresAt: body.expiresAt,
        active: wantsActive,
        updatedAt: new Date().toISOString(),
        consentRecordId,
      };

      const updated = existing
        ? await tx.accessibilityProfile.update({
            where: { userId: user.id },
            data: { shareWithProviders: toJson(next) },
          })
        : await tx.accessibilityProfile.create({
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

      return {
        shareSettings: next,
        sharingActive: isSharingActive(next),
        profileId: updated.id,
        wantsActive,
        noop: false as const,
      };
    });

    if (!result.noop && "profileId" in result) {
      await createAuditEvent({
        actorUserId: user.id,
        actorRole: user.primaryRole as never,
        action: result.wantsActive ? "consent.granted" : "consent.revoked",
        entityType: "AccessibilityProfile",
        entityId: result.profileId,
        participantId: user.id,
        metadata: {
          categories: result.shareSettings.categories,
          active: result.shareSettings.active,
          recipientOrganisationId: result.shareSettings.recipientOrganisationId,
        },
      });
    }

    return jsonOk({
      shareSettings: result.shareSettings,
      sharingActive: result.sharingActive,
    });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error) {
      if (e.message === "RECIPIENT_REQUIRED") {
        return jsonError(
          "Select a verified organisation before sharing access requirements.",
          400,
        );
      }
      if (e.message.startsWith("RECIPIENT_INVALID:")) {
        return jsonError(e.message.replace("RECIPIENT_INVALID:", ""), 403);
      }
    }
    return jsonError("Could not update share settings", 500);
  }
}
