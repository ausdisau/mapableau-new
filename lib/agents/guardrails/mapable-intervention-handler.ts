import {
  InterventionHandler,
  InterventionActions,
  type BeforeToolCallEvent,
} from "@strands-agents/sdk";

import { checkConsent } from "@/lib/consent/consent-service";
import type { ConsentScope } from "@/types/mapable";

import {
  MAPABLE_INVOCATION_STATE_KEY,
  type MapAbleInvocationState,
} from "../agent-types";
import { getToolPolicy } from "../tools/tool-policy";
import { assertToolPermission } from "../agent-permissions";
import { redactForTelemetry } from "./pii-redaction";

export class MapableInterventionHandler extends InterventionHandler {
  readonly name = "mapable-guardrails";
  readonly onError = "deny" as const;

  override async beforeToolCall(event: BeforeToolCallEvent) {
    const state = event.invocationState?.[MAPABLE_INVOCATION_STATE_KEY] as
      | MapAbleInvocationState
      | undefined;

    if (!state) {
      return InterventionActions.deny(
        "Agent context missing — tool blocked for safety."
      );
    }

    const toolName =
      typeof event.selectedTool === "string"
        ? event.selectedTool
        : event.toolUse.name;
    const policy = getToolPolicy(toolName);

    if (policy.blocked) {
      state.actionStatus = "blocked";
      state.requiresHumanConfirmation = true;
      return InterventionActions.deny(
        `Tool ${toolName} is not permitted on MapAble.`
      );
    }

    try {
      if (policy.permission) {
        assertToolPermission(
          policy.permission as Parameters<typeof assertToolPermission>[0],
          state.context
        );
      }

      if (policy.consentScope) {
        const participantId =
          state.context.participantId ?? state.context.userId;
        const ok = await checkConsent({
          subjectUserId: participantId,
          scope: policy.consentScope as ConsentScope,
          grantedToUserId: state.context.userId,
        });
        if (!ok) {
          return InterventionActions.deny(
            "I need consent before I can access this information."
          );
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Permission denied";
      return InterventionActions.deny(msg);
    }

    if (policy.draftOnly || policy.requiresConfirmation) {
      state.actionStatus = "requires_confirmation";
      state.requiresHumanConfirmation = true;
      return InterventionActions.confirm(
        `This will prepare a draft only (${toolName}). Confirm to continue.`
      );
    }

    if (
      /diagnos|prescribe|treatment plan|clinical decision/i.test(
        JSON.stringify(event.toolUse.input)
      )
    ) {
      return InterventionActions.deny(
        "I cannot make clinical decisions. I can prepare intake summaries for practitioner review."
      );
    }

    if (/approve.*invoice|submit.*claim|close.*incident/i.test(toolName)) {
      return InterventionActions.deny(
        "This action requires authorised human confirmation."
      );
    }

    event.toolUse.input = redactForTelemetry(
      event.toolUse.input as Record<string, unknown>
    ) as typeof event.toolUse.input;

    return InterventionActions.proceed();
  }
}
