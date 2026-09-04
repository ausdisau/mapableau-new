import {
  isGuardianExternalProcessingAllowed,
  isGuardianPrivateInferenceAllowed,
  guardianConfig,
} from "@/lib/config/guardian";

import type {
  ProcessingSensitivity,
  ProcessingZone,
} from "./contracts";
import type { GuardianReasonCode } from "./reason-codes";
import { selectEligibleProviders } from "./providers/policy";
import type { ProcessingProviderRecord } from "./providers/contracts";
import type { DataClass } from "@/lib/ai/platform/types/classification";

export type ProcessingRouterInput = {
  sensitivity: ProcessingSensitivity;
  dataClasses: DataClass[];
  purpose: string;
  privateInferenceAvailable?: boolean;
  deviceEdgeAvailable?: boolean;
  /** Rejected — cannot force external. */
  useCloudModel?: boolean;
  preferDeviceEdge?: boolean;
};

export type ProcessingRouterResult =
  | {
      ok: true;
      zone: ProcessingZone;
      processorId: string;
      provider: ProcessingProviderRecord;
      reasonCodes: GuardianReasonCode[];
      modelProcessingAllowed: boolean;
    }
  | {
      ok: false;
      reasonCodes: GuardianReasonCode[];
      fallback: "deterministic" | "human_review" | "deny";
      zone?: ProcessingZone;
    };

function pickProvider(
  zone: ProcessingZone,
  input: ProcessingRouterInput
): ProcessingProviderRecord | undefined {
  const eligible = selectEligibleProviders({
    zone,
    sensitivity: input.sensitivity,
    dataClasses: input.dataClasses,
    purpose: input.purpose,
  });
  return eligible[0];
}

/**
 * Deterministic processing-zone router.
 * CRITICAL: private unavailable must NOT silently fall through to external cloud.
 */
export function routeProcessing(
  input: ProcessingRouterInput
): ProcessingRouterResult {
  const reasonCodes: GuardianReasonCode[] = [];

  if (input.useCloudModel === true) {
    reasonCodes.push("CLOUD_BYPASS_REJECTED");
  }

  // D4: no general-purpose model by default — deterministic only
  if (input.sensitivity === "D4_RESTRICTED") {
    reasonCodes.push("SENSITIVITY_NO_GENERAL_PURPOSE_MODEL", "DETERMINISTIC_FALLBACK");
    const det = pickProvider("MAPABLE_PRIVATE", {
      ...input,
      purpose: input.purpose,
    });
    // Prefer deterministic provider
    const deterministic = selectEligibleProviders({
      zone: "MAPABLE_PRIVATE",
      sensitivity: input.sensitivity,
      dataClasses: input.dataClasses,
      purpose: input.purpose,
    }).find((p) => p.processorType === "deterministic_only");

    if (deterministic) {
      return {
        ok: true,
        zone: "MAPABLE_PRIVATE",
        processorId: deterministic.providerId,
        provider: deterministic,
        reasonCodes,
        modelProcessingAllowed: false,
      };
    }

    return {
      ok: false,
      reasonCodes,
      fallback: "deterministic",
      zone: undefined,
      ...(det
        ? {}
        : {}),
    };
  }

  // D3: device or private only — never external by default
  if (input.sensitivity === "D3_SENSITIVE") {
    reasonCodes.push("SENSITIVITY_REQUIRES_PRIVATE");

    if (input.preferDeviceEdge || input.deviceEdgeAvailable) {
      const edge = pickProvider("DEVICE_EDGE", input);
      if (edge && (input.deviceEdgeAvailable !== false)) {
        return {
          ok: true,
          zone: "DEVICE_EDGE",
          processorId: edge.providerId,
          provider: edge,
          reasonCodes,
          modelProcessingAllowed: guardianConfig.modelInferenceEnabled,
        };
      }
    }

    if (
      isGuardianPrivateInferenceAllowed() &&
      input.privateInferenceAvailable !== false
    ) {
      const priv = pickProvider("MAPABLE_PRIVATE", input);
      if (priv) {
        return {
          ok: true,
          zone: "MAPABLE_PRIVATE",
          processorId: priv.providerId,
          provider: priv,
          reasonCodes,
          modelProcessingAllowed:
            priv.processorType !== "deterministic_only" &&
            guardianConfig.modelInferenceEnabled,
        };
      }
    }

    // Private unavailable — NO cloud fallthrough
    reasonCodes.push("PRIVATE_INFERENCE_UNAVAILABLE", "PRIVATE_FAILOVER_NO_CLOUD");
    return {
      ok: false,
      reasonCodes,
      fallback: "human_review",
    };
  }

  // D2: private by default; external only with explicit flag + policy
  if (input.sensitivity === "D2_PERSONAL") {
    if (
      isGuardianPrivateInferenceAllowed() &&
      input.privateInferenceAvailable !== false
    ) {
      const priv = pickProvider("MAPABLE_PRIVATE", input);
      if (priv) {
        return {
          ok: true,
          zone: "MAPABLE_PRIVATE",
          processorId: priv.providerId,
          provider: priv,
          reasonCodes,
          modelProcessingAllowed:
            priv.processorType !== "deterministic_only" &&
            guardianConfig.modelInferenceEnabled,
        };
      }
    }

    if (input.useCloudModel === true) {
      // Already noted CLOUD_BYPASS_REJECTED — still no silent external
      reasonCodes.push("PRIVATE_FAILOVER_NO_CLOUD");
      return { ok: false, reasonCodes, fallback: "human_review" };
    }

    if (
      isGuardianExternalProcessingAllowed() &&
      // Explicit external only when private was not required / separately approved
      false
    ) {
      // unreachable placeholder — D2 external requires future explicit policy path
    }

    reasonCodes.push("PRIVATE_INFERENCE_UNAVAILABLE", "PRIVATE_FAILOVER_NO_CLOUD");
    return { ok: false, reasonCodes, fallback: "deterministic" };
  }

  // D0 / D1: external allowed when flags + provider approved
  if (
    (input.sensitivity === "D0_PUBLIC" ||
      input.sensitivity === "D1_INTERNAL") &&
    isGuardianExternalProcessingAllowed()
  ) {
    const ext = pickProvider("APPROVED_EXTERNAL", input);
    if (ext) {
      return {
        ok: true,
        zone: "APPROVED_EXTERNAL",
        processorId: ext.providerId,
        provider: ext,
        reasonCodes,
        modelProcessingAllowed: guardianConfig.modelInferenceEnabled,
      };
    }
    reasonCodes.push("PROCESSOR_NOT_APPROVED");
  }

  // Prefer private/deterministic for D0/D1 when external off
  if (
    isGuardianPrivateInferenceAllowed() &&
    input.privateInferenceAvailable !== false
  ) {
    const priv = pickProvider("MAPABLE_PRIVATE", input);
    if (priv) {
      return {
        ok: true,
        zone: "MAPABLE_PRIVATE",
        processorId: priv.providerId,
        provider: priv,
        reasonCodes,
        modelProcessingAllowed:
          priv.processorType !== "deterministic_only" &&
          guardianConfig.modelInferenceEnabled,
      };
    }
  }

  const det = selectEligibleProviders({
    zone: "MAPABLE_PRIVATE",
    sensitivity: input.sensitivity,
    dataClasses: input.dataClasses,
    purpose: input.purpose,
  }).find((p) => p.processorType === "deterministic_only");

  if (det) {
    reasonCodes.push("DETERMINISTIC_FALLBACK");
    if (!isGuardianExternalProcessingAllowed()) {
      reasonCodes.push("EXTERNAL_PROCESSING_DISABLED");
    }
    return {
      ok: true,
      zone: "MAPABLE_PRIVATE",
      processorId: det.providerId,
      provider: det,
      reasonCodes,
      modelProcessingAllowed: false,
    };
  }

  reasonCodes.push("EXTERNAL_PROCESSING_DISABLED");
  return { ok: false, reasonCodes, fallback: "deterministic" };
}
