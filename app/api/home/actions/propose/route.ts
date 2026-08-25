import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  mapableHomeDisabledResponse,
  mapableHomeFlags,
} from "@/lib/config/mapable-home";
import {
  HOME_AUTONOMY_LEVELS,
  HOME_CAPABILITY_KINDS,
} from "@/lib/home/contracts/capability";
import {
  HomeServiceError,
  proposeHomeAction,
} from "@/lib/home/service";

const proposeSchema = z.object({
  endpointId: z.string().min(1),
  capabilityKind: z.enum(HOME_CAPABILITY_KINDS),
  parameters: z.record(z.string(), z.unknown()).optional(),
  confirmationToken: z.string().uuid().optional(),
  delegationId: z.string().optional(),
  vendorPermissionClaimed: z.boolean().optional(),
  participantAutonomyCeiling: z.enum(HOME_AUTONOMY_LEVELS).optional(),
  preAuthorisedCapabilityKinds: z.array(z.enum(HOME_CAPABILITY_KINDS)).optional(),
  participantRefused: z.boolean().optional(),
});

export async function POST(req: Request) {
  if (!mapableHomeFlags.enabled || !mapableHomeFlags.simulatorEnabled) {
    return mapableHomeDisabledResponse("MAPABLE_HOME_ENV_SIMULATOR_ENABLED");
  }
  if (mapableHomeFlags.realDeviceActionsEnabled) {
    return Response.json(
      {
        error: "Real device actions must remain disabled in P0.",
        code: "REAL_DEVICE_ACTIONS_DISABLED",
      },
      { status: 403 },
    );
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => null);
  const parsed = proposeSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await proposeHomeAction({
      participantId: user.id,
      actorId: user.id,
      ...parsed.data,
    });

    await createAuditEvent({
      actorUserId: user.id,
      action: "home.action.propose",
      entityType: "HomeAction",
      entityId:
        result.status === "EXECUTED" ? result.action.id : parsed.data.endpointId,
      participantId: user.id,
      metadata: {
        status: result.status,
        capabilityKind: parsed.data.capabilityKind,
        simulation: true,
      },
    });

    return jsonOk({ simulation: true, result });
  } catch (err) {
    if (err instanceof HomeServiceError) {
      return Response.json(
        { error: err.message, code: err.code },
        { status: err.status },
      );
    }
    throw err;
  }
}
