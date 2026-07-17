import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";
import {
  approveParticipationPlan,
  cancelParticipationPlan,
  createParticipationPlan,
  executeParticipationPlan,
  getParticipationPlan,
  simulateParticipationPlan,
} from "@/lib/participation/plans/plan-service";
import { upsertEventAccessProfile } from "@/lib/participation/access/event-access-service";
import {
  createEvent,
  listEvents,
} from "@/lib/participation/events/event-service";
import {
  confirmGoal,
  createGoal,
  getGoalForParticipant,
  listGoalsForParticipant,
  markGoalChanged,
  pauseGoal,
} from "@/lib/participation/goals/goal-service";
import {
  createOpportunity,
  listOpportunities,
} from "@/lib/participation/opportunities/opportunity-service";
import {
  createReflection,
  updateReflection,
} from "@/lib/participation/reflections/reflection-service";

type RouteParams<K extends string> = { params: Promise<Record<K, string>> };

const domainSchema = z.enum([
  "recreation",
  "sport",
  "arts",
  "culture",
  "music",
  "faith",
  "volunteering",
  "education",
  "training",
  "employment",
  "advocacy",
  "civic",
  "peer_support",
  "social",
  "travel",
  "online",
  "health_and_wellbeing",
  "participant_defined",
  "other",
]);

const deliveryModeSchema = z.enum(["in_person", "online", "hybrid"]);
const privacySchema = z.enum([
  "private",
  "household",
  "authorised_support",
  "organisation_minimum",
  "public_listing_safe",
]);

const opportunitySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  domain: domainSchema,
  opportunityType: z.string().min(1),
  deliveryMode: deliveryModeSchema,
  sourceReference: z.string().min(1),
  organisationId: z.string().optional(),
  costDescription: z.string().optional(),
  priceCents: z.number().int().optional(),
  fundingClaims: z.string().optional(),
  accessPlaceId: z.string().optional(),
  sponsored: z.boolean().optional(),
});

const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  domain: domainSchema,
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  deliveryMode: deliveryModeSchema,
  sourceReference: z.string().min(1),
  opportunityId: z.string().optional(),
  organisationId: z.string().optional(),
  accessPlaceId: z.string().optional(),
});

const goalSchema = z.object({
  title: z.string().optional(),
  participantWording: z.string().min(1).optional(),
  interpretedSummary: z.string().optional(),
  domain: domainSchema.optional(),
  desiredExperience: z.string().optional(),
  successDescription: z.string().optional(),
  boundaries: z.record(z.string(), z.unknown()).optional(),
  constraints: z.record(z.string(), z.unknown()).optional(),
  privacyLevel: privacySchema.optional(),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  targetDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

const goalPatchSchema = goalSchema.extend({
  status: z
    .enum(["confirmed", "changed", "cancelled", "archived", "completed"])
    .optional(),
});

const planStepSchema = z.object({
  stepType: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

const planSchema = z.object({
  title: z.string().min(1),
  goalId: z.string().optional(),
  opportunityId: z.string().optional(),
  eventId: z.string().optional(),
  participantNotes: z.string().optional(),
  fundingText: z.string().optional(),
  steps: z.array(planStepSchema).optional(),
});

const executePlanSchema = z.object({
  calendarEventId: z.string().optional(),
  bookingId: z.string().optional(),
});

const reflectionSchema = z.object({
  reflectionId: z.string().optional(),
  body: z.string().min(1).optional(),
  planId: z.string().optional(),
  goalId: z.string().optional(),
  opportunityId: z.string().optional(),
  eventId: z.string().optional(),
  mood: z.string().optional(),
  privacyLevel: privacySchema.optional(),
});

const accessProfileSchema = z.object({
  eventId: z.string().min(1),
  evidenceLevel: z.string().min(1),
  lastCheckedAt: z.coerce.date(),
  validUntil: z.coerce.date().optional(),
  uncertainty: z.string().optional(),
  mobilityAccess: z.record(z.string(), z.unknown()).optional(),
  sensoryAccess: z.record(z.string(), z.unknown()).optional(),
  communicationAccess: z.record(z.string(), z.unknown()).optional(),
  accessAssetIds: z.array(z.string()).optional(),
});

async function readJson(req: Request) {
  return req.json().catch(() => null);
}

function errorResponse(err: unknown) {
  return jsonError((err as Error).message ?? "PARTICIPATION_ERROR", 400);
}

export async function handleOpportunitiesGet(req: Request) {
  const url = new URL(req.url);
  const domains = url.searchParams.getAll("domain");
  const keywords = url.searchParams.getAll("keyword");
  try {
    return jsonOk(
      await listOpportunities({
        domains: domains.length
          ? domainSchema.array().parse(domains)
          : undefined,
        keywords: keywords.length ? keywords : undefined,
      }),
    );
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleOpportunitiesPost(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const parsed = opportunitySchema.safeParse(await readJson(req));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    return jsonOk(await createOpportunity(parsed.data), 201);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleEventsGet(req: Request) {
  const url = new URL(req.url);
  const domains = url.searchParams.getAll("domain");
  try {
    return jsonOk(
      await listEvents({
        domains: domains.length
          ? domainSchema.array().parse(domains)
          : undefined,
      }),
    );
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleEventsPost(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const parsed = eventSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    return jsonOk(await createEvent(parsed.data), 201);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleParticipantGoalsGet() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  try {
    return jsonOk({ goals: await listGoalsForParticipant(user.id) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleParticipantGoalsPost(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const parsed = goalSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    return jsonOk(
      await createGoal({ ...parsed.data, participantId: user.id }),
      201,
    );
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleParticipantGoalGet(
  _req: Request,
  { params }: RouteParams<"goalId">,
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { goalId } = await params;
  const goal = await getGoalForParticipant({ goalId, participantId: user.id });
  if (!goal) return jsonError("Goal not found", 404);
  return jsonOk({ goal });
}

export async function handleParticipantGoalPatch(
  req: Request,
  { params }: RouteParams<"goalId">,
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const parsed = goalPatchSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { goalId } = await params;
  try {
    if (parsed.data.status === "confirmed") {
      return jsonOk(await confirmGoal({ goalId, participantId: user.id }));
    }
    if (parsed.data.status === "changed" && parsed.data.participantWording) {
      return jsonOk(
        await markGoalChanged({
          goalId,
          participantId: user.id,
          participantWording: parsed.data.participantWording,
        }),
      );
    }
    const goal = await getGoalForParticipant({
      goalId,
      participantId: user.id,
    });
    if (!goal) return jsonError("Goal not found", 404);
    return jsonOk(
      await prisma.participationGoal.update({
        where: { id: goal.id },
        data: {
          title: parsed.data.title,
          participantWording: parsed.data.participantWording,
          interpretedSummary: parsed.data.interpretedSummary,
          domain: parsed.data.domain,
          desiredExperience: parsed.data.desiredExperience,
          successDescription: parsed.data.successDescription,
          boundaries: asJson(parsed.data.boundaries),
          constraints: asJson(parsed.data.constraints),
          privacyLevel: parsed.data.privacyLevel,
          startsAt: parsed.data.startsAt,
          expiresAt: parsed.data.expiresAt,
          targetDate: parsed.data.targetDate,
          notes: parsed.data.notes,
          status: parsed.data.status,
        },
      }),
    );
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleParticipantGoalDelete(
  _req: Request,
  { params }: RouteParams<"goalId">,
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { goalId } = await params;
  const goal = await getGoalForParticipant({ goalId, participantId: user.id });
  if (!goal) return jsonError("Goal not found", 404);
  return jsonOk(
    await prisma.participationGoal.update({
      where: { id: goal.id },
      data: { status: "cancelled" },
    }),
  );
}

export async function handleParticipantGoalPause(
  _req: Request,
  { params }: RouteParams<"goalId">,
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { goalId } = await params;
  try {
    return jsonOk(await pauseGoal({ goalId, participantId: user.id }));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleParticipantPlansGet() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  return jsonOk({
    plans: await prisma.participationPlan.findMany({
      where: { participantId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
  });
}

export async function handleParticipantPlansPost(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const parsed = planSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    return jsonOk(
      await createParticipationPlan({ ...parsed.data, participantId: user.id }),
      201,
    );
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleParticipantPlanGet(
  _req: Request,
  { params }: RouteParams<"planId">,
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { planId } = await params;
  const plan = await getParticipationPlan({ planId, participantId: user.id });
  if (!plan) return jsonError("Plan not found", 404);
  return jsonOk({ plan });
}

export async function handleParticipantPlanSimulate(
  _req: Request,
  { params }: RouteParams<"planId">,
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { planId } = await params;
  try {
    return jsonOk(
      await simulateParticipationPlan({ planId, participantId: user.id }),
    );
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleParticipantPlanApprove(
  _req: Request,
  { params }: RouteParams<"planId">,
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { planId } = await params;
  try {
    return jsonOk(
      await approveParticipationPlan({ planId, participantId: user.id }),
    );
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleParticipantPlanExecute(
  req: Request,
  { params }: RouteParams<"planId">,
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const parsed = executePlanSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { planId } = await params;
  try {
    return jsonOk(
      await executeParticipationPlan({
        planId,
        participantId: user.id,
        ...parsed.data,
      }),
    );
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleParticipantPlanCancel(
  _req: Request,
  { params }: RouteParams<"planId">,
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { planId } = await params;
  try {
    return jsonOk(
      await cancelParticipationPlan({ planId, participantId: user.id }),
    );
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleReflectionsPost(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const parsed = reflectionSchema
    .required({ body: true })
    .safeParse(await readJson(req));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    return jsonOk(
      await createReflection({ ...parsed.data, participantId: user.id }),
      201,
    );
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleReflectionsPatch(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const parsed = reflectionSchema
    .required({ reflectionId: true })
    .safeParse(await readJson(req));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    return jsonOk(
      await updateReflection({ ...parsed.data, participantId: user.id }),
    );
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleOrganiserOpportunityWrite(req: Request) {
  return handleOpportunitiesPost(req);
}

export async function handleOrganiserEventWrite(req: Request) {
  return handleEventsPost(req);
}

export async function handleOrganiserAccessWrite(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const parsed = accessProfileSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    return jsonOk(await upsertEventAccessProfile(parsed.data), 201);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleOrganiserStatusWrite(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const parsed = z
    .object({
      opportunityId: z.string().optional(),
      eventId: z.string().optional(),
      status: z.enum([
        "draft",
        "pending_review",
        "published",
        "hidden",
        "suspended",
        "expired",
        "archived",
      ]),
    })
    .safeParse(await readJson(req));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  if (!parsed.data.opportunityId && !parsed.data.eventId) {
    return jsonError("opportunityId or eventId required", 400);
  }
  if (parsed.data.opportunityId) {
    return jsonOk(
      await prisma.participationOpportunity.update({
        where: { id: parsed.data.opportunityId },
        data: { status: parsed.data.status },
      }),
    );
  }
  return jsonOk(
    await prisma.communityEvent.update({
      where: { id: parsed.data.eventId },
      data: { status: parsed.data.status },
    }),
  );
}
