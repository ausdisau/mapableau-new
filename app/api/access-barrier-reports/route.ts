import type { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  barrierReportSchema,
  createBarrierReferenceNumber,
} from "@/lib/barrier-report/validation";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const reports = await prisma.accessBarrierReport.findMany({
    where: { reporterUserId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      referenceNumber: true,
      category: true,
      placeName: true,
      placeSlug: true,
      status: true,
      isDraft: true,
      urgency: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return jsonOk({ reports });
}

export async function POST(req: Request) {
  // Anonymous reports are allowed when policy permits — session optional.
  const user = await getCurrentUser();

  try {
    const body = barrierReportSchema.parse(await req.json());
    const referenceNumber = createBarrierReferenceNumber();
    const status = body.isDraft ? "draft" : "received";

    const report = await prisma.accessBarrierReport.create({
      data: {
        referenceNumber,
        reporterUserId: body.anonymous ? null : user?.id,
        placeId: body.placeId,
        placeSlug: body.placeSlug,
        placeName: body.placeName,
        serviceId: body.serviceId,
        category: body.category,
        description: body.description,
        locationDetail: body.locationDetail,
        urgency: body.urgency,
        observedAt: body.observedAt ? new Date(body.observedAt) : undefined,
        imageUrl: body.imageUrl,
        imageDescription: body.imageDescription,
        contactEmail: body.anonymous ? null : body.contactEmail,
        contactPhone: body.anonymous ? null : body.contactPhone,
        anonymous: body.anonymous,
        consentToContact: body.consentToContact,
        status,
        isDraft: body.isDraft,
        metadata: {
          // Never store analytics-oriented disability labels.
          source: "access-independence-mvp",
        } as Prisma.InputJsonValue,
      },
    });

    if (user) {
      await createAuditEvent({
        actorUserId: user.id,
        actorRole: user.primaryRole as never,
        action: "accessibility.updated",
        entityType: "AccessBarrierReport",
        entityId: report.id,
        participantId: user.id,
        metadata: {
          referenceNumber: report.referenceNumber,
          category: report.category,
          status: report.status,
        },
      });
    }

    return jsonOk(
      {
        report: {
          id: report.id,
          referenceNumber: report.referenceNumber,
          status: report.status,
          isDraft: report.isDraft,
        },
      },
      201,
    );
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not submit barrier report", 500);
  }
}
