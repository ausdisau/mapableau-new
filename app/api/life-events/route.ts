import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isLifeEventsEnabled } from "@/lib/continuity-os/config";
import {
  ContinuityFeatureDisabledError,
  createLifeEventMission,
  listLifeEventMissionsForParticipant,
} from "@/lib/continuity-os/mission-extension-service";

const createSchema = z.object({
  typeKey: z.string().min(1),
  participantGoal: z.string().min(1).max(2000),
  participantWording: z.string().max(4000).optional(),
  desiredDate: z.string().datetime().optional().nullable(),
  organisationId: z.string().optional().nullable(),
  privacyMode: z.string().optional(),
  preservedUnknowns: z.array(z.string()).optional(),
  nonNegotiableRequirements: z.array(z.string()).optional(),
  preferences: z
    .object({
      preserveOriginalAppointment: z.boolean().optional(),
      avoidUnfamiliarWorkers: z.boolean().optional(),
      avoidStaffDependentRoutes: z.boolean().optional(),
      prioritiseHighestConfidence: z.boolean().optional(),
      minimiseAdditionalDisclosure: z.boolean().optional(),
      minimiseAddedCost: z.boolean().optional(),
      prioritiseFastestRecovery: z.boolean().optional(),
      preferHumanCoordinator: z.boolean().optional(),
      contactSupporterOnlyAfterAsking: z.boolean().optional(),
      doNotReplaceProviderAutomatically: z.boolean().optional(),
      useWrittenCommunication: z.boolean().optional(),
      doNotCallUnlessUrgent: z.boolean().optional(),
    })
    .optional(),
});

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!isLifeEventsEnabled()) return jsonError("Life events are disabled", 404);

  try {
    const missions = await listLifeEventMissionsForParticipant(user.id);
    return jsonOk({
      missions: missions.map((m) => ({
        missionId: m.id,
        status: m.status,
        typeKey: m.lifeEventExtension?.typeKey,
        typeVersion: m.lifeEventExtension?.typeVersion,
        participantGoal: m.lifeEventExtension?.participantGoal,
        continuityStatus: m.lifeEventExtension?.continuityStatus,
        createdAt: m.createdAt,
      })),
    });
  } catch (e) {
    if (e instanceof ContinuityFeatureDisabledError) {
      return jsonError(e.message, 404);
    }
    throw e;
  }
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!isLifeEventsEnabled()) return jsonError("Life events are disabled", 404);

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const created = await createLifeEventMission({
      participantId: user.id,
      actorUserId: user.id,
      typeKey: parsed.data.typeKey,
      participantGoal: parsed.data.participantGoal,
      participantWording: parsed.data.participantWording,
      desiredDate: parsed.data.desiredDate
        ? new Date(parsed.data.desiredDate)
        : null,
      organisationId: parsed.data.organisationId,
      preferences: parsed.data.preferences,
      preservedUnknowns: parsed.data.preservedUnknowns,
      nonNegotiableRequirements: parsed.data.nonNegotiableRequirements,
      privacyMode: parsed.data.privacyMode,
    });
    return jsonOk(created, 201);
  } catch (e) {
    if (e instanceof ContinuityFeatureDisabledError) {
      return jsonError(e.message, 404);
    }
    if (e instanceof Error && e.message.startsWith("Unsupported")) {
      return jsonError(e.message, 400);
    }
    throw e;
  }
}
