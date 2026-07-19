import type { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  createBarrierReferenceNumber,
  parseBarrierReportBody,
} from "@/lib/barrier-report/validation";
import { accessIndependenceConfig } from "@/lib/config/access-independence";
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
      // Reporter-visible progress only — never triage notes or contact fields.
      statusHistory: true,
    },
  });

  return jsonOk({
    reports: reports.map((report) => ({
      id: report.id,
      referenceNumber: report.referenceNumber,
      category: report.category,
      placeName: report.placeName,
      placeSlug: report.placeSlug,
      status: report.status,
      isDraft: report.isDraft,
      urgency: report.urgency,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      statusHistory: Array.isArray(report.statusHistory)
        ? (report.statusHistory as Array<{ from: string; to: string; at: string }>).map(
            (entry) => ({
              from: entry.from,
              to: entry.to,
              at: entry.at,
            }),
          )
        : [],
    })),
  });
}

export async function POST(req: Request) {
  // Anonymous reports are allowed when policy permits — session optional.
  const user = await getCurrentUser();
  const ip = getClientIp(req);

  try {
    const rawText = await req.text();
    if (rawText.length > 20_000) {
      return jsonError("Payload too large", 413);
    }
    const raw = JSON.parse(rawText) as unknown;

    const parsed = parseBarrierReportBody(raw);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }
    const body = parsed.data;

    if (!user && !body.isDraft) {
      if (
        !checkIpRateLimit(`barrier-anon:${ip}`, {
          windowMs: accessIndependenceConfig.anonymousBarrierWindowMs,
          max: accessIndependenceConfig.anonymousBarrierMaxPerWindow,
        })
      ) {
        return jsonError(
          "Too many reports from this network. Please try again later.",
          429,
        );
      }
    }

    const referenceNumber = createBarrierReferenceNumber();
    const status = body.isDraft ? "draft" : "received";
    // Fail-closed: no place→organisation ownership yet.
    // organisationId stays null until an authorised admin assigns a provider.
    const statusHistory = body.isDraft
      ? []
      : [
          {
            from: "none",
            to: "received",
            at: new Date().toISOString(),
            byUserId: user?.id ?? null,
          },
        ];

    const report = await prisma.accessBarrierReport.create({
      data: {
        referenceNumber,
        reporterUserId: body.anonymous ? null : user?.id,
        organisationId: null,
        placeId: body.placeId,
        placeSlug: body.placeSlug,
        placeName: body.placeName,
        serviceId: body.serviceId,
        category: body.category,
        description: body.description,
        locationDetail: body.locationDetail,
        urgency: body.urgency,
        observedAt: body.observedAt ? new Date(body.observedAt) : undefined,
        imageUrl: null,
        imageDescription: body.imageDescription,
        contactEmail: body.anonymous ? null : body.contactEmail,
        contactPhone: body.anonymous ? null : body.contactPhone,
        anonymous: body.anonymous,
        consentToContact: body.consentToContact,
        status,
        isDraft: body.isDraft,
        statusHistory: statusHistory as Prisma.InputJsonValue,
        metadata: {
          source: "access-independence-mvp",
          moderationState: body.isDraft ? "draft" : "pending_triage",
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
    if (e instanceof SyntaxError) return jsonError("Invalid JSON body", 400);
    return jsonError("Could not submit barrier report", 500);
  }
}
