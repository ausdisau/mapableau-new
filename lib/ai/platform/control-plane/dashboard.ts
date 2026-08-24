import { actionKernelConfig } from "@/lib/config/action-kernel";
import { adaptiveRecoveryConfig } from "@/lib/config/adaptive-recovery";
import {
  aiControlPlaneConfig,
  isAiControlPlaneEnabled,
} from "@/lib/config/ai-control-plane";
import { aiPlatformConfig } from "@/lib/config/ai-platform";
import { agenticNerveCentreConfig } from "@/lib/config/agentic-nerve-centre";

import { listControlPlaneAlerts } from "./alerts";
import { listBudgets } from "./budgets";
import { listCircuitBreakers, listOpenCircuits } from "./circuit-breakers";
import {
  getFailureReasonCounts,
  getMetric,
  humanReviewBacklog,
  snapshotMetrics,
} from "./metrics";
import { listSloCandidates } from "./slo";
import type {
  ControlPlaneDashboard,
  ControlPlaneHealthStatus,
  ControlPlaneSubsystem,
} from "./types";

const PRIVACY_NOTE =
  "Internal system health only. No participant behavioural scores, " +
  "no raw participant free text, no compliance scoring.";

function subsystemStatus(
  subsystem: ControlPlaneSubsystem,
  openTargets: Set<string>,
): { status: ControlPlaneHealthStatus; notes: string[] } {
  if (!isAiControlPlaneEnabled()) {
    return { status: "disabled", notes: ["control_plane_flag_off"] };
  }

  const notes: string[] = [];
  let status: ControlPlaneHealthStatus = "healthy";

  switch (subsystem) {
    case "mission_runtime": {
      if (!agenticNerveCentreConfig.enabled) {
        notes.push("nerve_centre_flag_off");
        status = "disabled";
      }
      if (getMetric("missions_failed_planning") > 0) {
        notes.push("recent_planning_failures");
        status = status === "disabled" ? status : "degraded";
      }
      break;
    }
    case "action_kernel": {
      if (!actionKernelConfig.enabled) {
        notes.push("action_kernel_flag_off");
        status = "disabled";
      }
      if (actionKernelConfig.killSwitchEngaged) {
        notes.push("action_kernel_kill_switch");
        status = "critical";
      }
      if (getMetric("actions_failed") > 0) {
        notes.push("action_execution_failures");
        status = status === "critical" ? status : "degraded";
      }
      break;
    }
    case "recovery_engine": {
      if (!adaptiveRecoveryConfig.enabled) {
        notes.push("recovery_flag_off");
        status = "disabled";
      }
      if (adaptiveRecoveryConfig.killSwitchActive) {
        notes.push("recovery_kill_switch");
        status = "critical";
      }
      break;
    }
    case "model_gateway": {
      if (aiPlatformConfig.globalKillSwitch) {
        notes.push("global_kill_switch");
        status = "critical";
      }
      if (openTargets.has("model_provider:default")) {
        notes.push("model_provider_circuit_open");
        status = "critical";
      }
      if (getMetric("budget_exhaustions") > 0) {
        notes.push("budget_exhaustions");
        status = status === "critical" ? status : "degraded";
      }
      break;
    }
    case "connector_gateway": {
      if (getMetric("connector_failed") > 0) {
        notes.push("connector_failures");
        status = "degraded";
      }
      for (const key of openTargets) {
        if (key.startsWith("connector:")) {
          notes.push(`circuit_open:${key}`);
          status = "critical";
        }
      }
      break;
    }
    case "human_review": {
      const backlog = humanReviewBacklog();
      if (backlog > 0) notes.push(`backlog:${backlog}`);
      if (backlog >= 25) status = "degraded";
      break;
    }
    case "evaluations": {
      if (getMetric("eval_fail") > 0) {
        notes.push("eval_failures");
        status = "degraded";
      }
      break;
    }
    case "context_fabric":
    case "agents":
    case "capabilities":
      break;
    default: {
      const _exhaustive: never = subsystem;
      return _exhaustive;
    }
  }

  return { status, notes };
}

function aggregateOverall(
  statuses: ControlPlaneHealthStatus[],
): ControlPlaneHealthStatus {
  if (!isAiControlPlaneEnabled()) return "disabled";
  if (statuses.some((s) => s === "critical")) return "critical";
  if (statuses.some((s) => s === "degraded")) return "degraded";
  if (statuses.every((s) => s === "disabled")) return "disabled";
  return "healthy";
}

/**
 * Internal operations dashboard snapshot.
 * Never includes unnecessary participant content.
 */
export function buildControlPlaneDashboard(): ControlPlaneDashboard {
  const open = listOpenCircuits();
  const openTargets = new Set(open.map((c) => `${c.name}:${c.targetId}`));
  const subsystemIds: ControlPlaneSubsystem[] = [
    "mission_runtime",
    "action_kernel",
    "context_fabric",
    "recovery_engine",
    "connector_gateway",
    "model_gateway",
    "human_review",
    "evaluations",
    "agents",
    "capabilities",
  ];
  const subsystems = subsystemIds.map((subsystem) => {
    const result = subsystemStatus(subsystem, openTargets);
    return {
      subsystem,
      status: result.status,
      notes: result.notes,
    };
  });

  const metrics = snapshotMetrics();
  const connectorKeys = [
    ...new Set(
      listCircuitBreakers()
        .filter((c) => c.name === "connector")
        .map((c) => c.targetId),
    ),
  ];

  return {
    generatedAt: new Date().toISOString(),
    controlPlaneEnabled: isAiControlPlaneEnabled(),
    overallHealth: aggregateOverall(subsystems.map((s) => s.status)),
    subsystems,
    failureReasons: getFailureReasonCounts().slice(0, 20),
    connectorHealth: connectorKeys.map((connectorKey) => {
      const circuit = open.find(
        (c) => c.name === "connector" && c.targetId === connectorKey,
      );
      return {
        connectorKey,
        status: circuit ? ("critical" as const) : ("healthy" as const),
        circuitState: circuit?.state ?? ("closed" as const),
      };
    }),
    queueHealth: {
      humanReviewBacklog: humanReviewBacklog(),
      pendingActions: Math.max(
        0,
        metrics.actions_proposed -
          metrics.actions_executed -
          metrics.actions_blocked,
      ),
    },
    modelSpend: {
      totalTokens: metrics.model_tokens,
      totalModelCalls: metrics.model_calls,
      budgetExhaustions: metrics.budget_exhaustions,
    },
    evalState: {
      passCount: metrics.eval_pass,
      failCount: metrics.eval_fail,
      lastRegressionAt:
        metrics.eval_fail > 0
          ? listControlPlaneAlerts().find((a) => a.kind === "eval_regression")
              ?.at ?? null
          : null,
    },
    featureFlags: [
      {
        name: "MAPABLE_AI_CONTROL_PLANE_ENABLED",
        enabled: aiControlPlaneConfig.enabled,
      },
      {
        name: "MAPABLE_AI_CONTROL_PLANE_CHEAPER_FALLBACK_ENABLED",
        enabled: aiControlPlaneConfig.cheaperFallbackRouteEnabled,
      },
      { name: "MAPABLE_AI_PLATFORM_ENABLED", enabled: aiPlatformConfig.enabled },
      {
        name: "MAPABLE_AI_MODEL_GENERATION_ENABLED",
        enabled: aiPlatformConfig.modelGenerationEnabled,
      },
      {
        name: "MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED",
        enabled: agenticNerveCentreConfig.enabled,
      },
      {
        name: "MAPABLE_ACTION_KERNEL_ENABLED",
        enabled: actionKernelConfig.enabled,
      },
      {
        name: "MAPABLE_ADAPTIVE_RECOVERY_ENABLED",
        enabled: adaptiveRecoveryConfig.enabled,
      },
    ],
    killSwitches: [
      {
        name: "MAPABLE_AI_GLOBAL_KILL_SWITCH",
        engaged: aiPlatformConfig.globalKillSwitch,
      },
      {
        name: "MAPABLE_ACTION_KERNEL_KILL_SWITCH",
        engaged: actionKernelConfig.killSwitchEngaged,
      },
      {
        name: "MAPABLE_RECOVERY_KILL_SWITCH",
        engaged: adaptiveRecoveryConfig.killSwitchActive,
      },
    ],
    openCircuits: open,
    recentAlerts: listControlPlaneAlerts(25),
    sloCandidates: listSloCandidates(),
    privacyNote: PRIVACY_NOTE,
  };
}

export function dashboardBudgetSummary(): Array<{
  scope: string;
  scopeId: string;
  usedTokens: number;
  maxTokens: number;
}> {
  return listBudgets().map((b) => ({
    scope: b.scope,
    scopeId: b.scopeId,
    usedTokens: b.usedTokens,
    maxTokens: b.maxTokens,
  }));
}
