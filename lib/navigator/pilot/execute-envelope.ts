import type { CareRequestType } from "@prisma/client";
import { z } from "zod";

import {
  executeGovernedActionEnvelope,
  governedNavigatorActionSchema,
  validateGovernedActionPayload,
} from "@/intelligence/actions/governed-envelope";
import { createCareRequest } from "@/lib/care/care-request-service";
import { assertNavigatorPilotEnabled } from "@/lib/config/navigator-pilot";
import { buildProviderFinderTransferUrl } from "@/lib/navigator/pilot/build-provider-finder-url";
import {
  createNavigatorEscalation,
  navigatorEscalationReasonSchema,
} from "@/lib/navigator/pilot/escalation";
import { createCareRequestSchema } from "@/lib/validation/care";
import { prisma } from "@/lib/prisma";

const executeInputSchema = z.object({
  envelopeId: z.string().min(1),
  actorUserId: z.string().min(1),
  participantId: z.string().min(1),
  tenantId: z.string().min(1).optional().nullable(),
  nonce: z.string().min(1),
});

/**
 * Executes an approved Navigator envelope against deterministic services only.
 * Draft care requests and filter transfer — never booking or payment.
 */
export async function executeNavigatorEnvelope(
  raw: z.infer<typeof executeInputSchema>,
) {
  assertNavigatorPilotEnabled();
  const input = executeInputSchema.parse(raw);

  const envelope = await prisma.governedActionEnvelope.findFirst({
    where: {
      id: input.envelopeId,
      participantId: input.participantId,
      ...(input.tenantId ? { tenantId: input.tenantId } : {}),
    },
  });
  if (!envelope) throw new Error("ENVELOPE_NOT_FOUND");

  const actionType = governedNavigatorActionSchema.parse(envelope.actionType);

  const updated = await executeGovernedActionEnvelope({
    envelopeId: input.envelopeId,
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    tenantId: input.tenantId,
    nonce: input.nonce,
    execute: async (payload) => {
      const validated = validateGovernedActionPayload(actionType, payload);

      switch (actionType) {
        case "create_care_request_draft": {
          const carePayload = createCareRequestSchema.parse(validated);
          const careRequest = await createCareRequest({
            ...carePayload,
            requestType: carePayload.requestType as CareRequestType,
            preferredDate: carePayload.preferredDate
              ? new Date(carePayload.preferredDate)
              : undefined,
            participantId: input.participantId,
            createdById: input.actorUserId,
          });
          return {
            kind: "care_request_draft",
            careRequestId: careRequest.id,
            status: careRequest.status,
          };
        }
        case "transfer_provider_finder_filters": {
          const url = buildProviderFinderTransferUrl({
            q: typeof validated.q === "string" ? validated.q : undefined,
            state:
              typeof validated.state === "string" ? validated.state : undefined,
            postcode:
              typeof validated.postcode === "string"
                ? validated.postcode
                : undefined,
            service:
              typeof validated.service === "string"
                ? validated.service
                : undefined,
            accessNeeds: Array.isArray(validated.accessNeeds)
              ? (validated.accessNeeds as string[])
              : [],
            providerFinderPath:
              typeof validated.providerFinderPath === "string"
                ? validated.providerFinderPath
                : "/provider-finder",
          });
          return {
            kind: "provider_finder_transfer",
            providerFinderUrl: url,
          };
        }
        case "open_human_escalation": {
          if (!input.tenantId) {
            throw new Error("TENANT_REQUIRED_FOR_ESCALATION");
          }
          const reasonParse = navigatorEscalationReasonSchema.safeParse(
            validated.reason,
          );
          const escalation = await createNavigatorEscalation({
            tenantId: input.tenantId,
            participantId: input.participantId,
            actorUserId: input.actorUserId,
            reason: reasonParse.success
              ? reasonParse.data
              : "unsupported_or_uncertain_request",
            urgency: z
              .enum(["low", "medium", "high", "immediate"])
              .parse(validated.urgency),
            preferredContactMethod: String(validated.preferredContactMethod),
            confidentialityRestrictions: Array.isArray(
              validated.confidentialityRestrictions,
            )
              ? (validated.confidentialityRestrictions as string[])
              : [],
            requiredReviewerRole: "coordinator",
            summary: String(validated.summary),
            conflictOfInterestCheckPassed: true,
            responseDeadlineAt: new Date(
              Date.now() + 48 * 60 * 60 * 1000,
            ).toISOString(),
            evidenceRefs: [],
            envelopeId: input.envelopeId,
          });
          return {
            kind: "human_escalation",
            escalationId: escalation.id,
            participantVisibleStatus: escalation.participantVisibleStatus,
          };
        }
        default: {
          const _exhaustive: never = actionType;
          throw new Error(`UNSUPPORTED_GOVERNED_ACTION:${String(_exhaustive)}`);
        }
      }
    },
  });

  return {
    envelope: updated,
    result: updated.executionResultJson as Record<string, unknown> | null,
  };
}
