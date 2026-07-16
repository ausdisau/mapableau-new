import type { KernelCapability } from "@/lib/care-intelligence/kernel/types";

export const CSI_KERNEL_CAPABILITIES: readonly KernelCapability[] =
  Object.freeze([
    capability(
      "read_synthetic_world",
      "Read the fixed synthetic participant world state.",
      "read",
    ),
    capability(
      "validate_participant_authority",
      "Validate consent, mandate, autonomy ceiling and participant stop.",
      "reason",
    ),
    capability(
      "consult_bounded_specialists",
      "Collect evidence-backed observations from bounded specialist functions.",
      "reason",
    ),
    capability(
      "simulate_counterfactual_plans",
      "Simulate complete care and transport consequences.",
      "simulate",
    ),
    capability(
      "arbitrate_locked_policy",
      "Apply deterministic rights and safety rules.",
      "reason",
    ),
    capability(
      "prepare_non_executable_intents",
      "Prepare expiring intents that require participant confirmation.",
      "prepare",
    ),
    capability(
      "explain_with_evidence",
      "Expose concise explanations and evidence references.",
      "reason",
    ),
    capability(
      "append_tamper_evident_audit",
      "Append an in-memory hash-chained synthetic audit event.",
      "audit",
    ),
  ]);

const PROHIBITED_CAPABILITY_TERMS = [
  "execute",
  "book",
  "payment",
  "message_provider",
  "emergency",
  "external_model",
  "persistent_memory",
  "self_modify",
];

export function validateCapabilityRegistry(
  capabilities: readonly KernelCapability[],
) {
  const ids = new Set<string>();
  for (const capability of capabilities) {
    if (ids.has(capability.id))
      throw new Error(`DUPLICATE_KERNEL_CAPABILITY:${capability.id}`);
    ids.add(capability.id);
    if (
      capability.sideEffects ||
      capability.externalNetwork ||
      capability.persistentWrite ||
      !capability.participantScoped
    )
      throw new Error(`UNSAFE_KERNEL_CAPABILITY:${capability.id}`);
    if (
      PROHIBITED_CAPABILITY_TERMS.some((term) =>
        capability.id.toLowerCase().includes(term),
      )
    )
      throw new Error(`PROHIBITED_KERNEL_CAPABILITY:${capability.id}`);
  }
  return true;
}

function capability(
  id: string,
  description: string,
  capabilityClass: KernelCapability["capabilityClass"],
): KernelCapability {
  return {
    id,
    description,
    capabilityClass,
    sideEffects: false,
    externalNetwork: false,
    persistentWrite: false,
    participantScoped: true,
  };
}
