import { classifyIntent } from "@/lib/copilot/intentRouter";
import type { SupportClassificationOutput } from "@/lib/mapable-graphs/types";

/**
 * Deterministic support classification from participant narrative.
 * Aligns with MapAble Co-Pilot (no external LLM calls).
 */
export function classifySupportFromQuery(
  query: string
): SupportClassificationOutput {
  const q = query.toLowerCase();
  const goals: SupportClassificationOutput["goals"] = [];
  const supportNeeds: SupportClassificationOutput["supportNeeds"] = [];
  const accessNeeds: string[] = [];
  const missingInformation: string[] = [];
  const riskFlags: SupportClassificationOutput["riskFlags"] = [];
  const sensorySignals: string[] = [];

  if (
    /\b(work|job|office|getting ready|getting to work|morning routine)\b/i.test(
      query
    )
  ) {
    goals.push({ key: "get_to_work_reliably", label: "Get to work reliably" });
    if (
      !supportNeeds.some((n) => n.key === "accessible_transport") &&
      /\b(getting to work|to work|work)\b/i.test(query)
    ) {
      supportNeeds.push({
        key: "accessible_transport",
        label: "Accessible transport",
      });
    }
  }

  if (
    /\b(get ready|getting ready|morning|dress|shower|personal care)\b/i.test(q)
  ) {
    supportNeeds.push({
      key: "morning_routine_support",
      label: "Morning routine support",
    });
  }

  if (/\b(transport|bus|train|taxi|ride|pick up|wheelchair)\b/i.test(q)) {
    supportNeeds.push({
      key: "accessible_transport",
      label: "Accessible transport",
    });
  }

  if (/\b(bus(es)?\s+overwhelm|sensory|noise|crowded)\b/i.test(q)) {
    sensorySignals.push("sensory_overload_public_transport");
    accessNeeds.push("sensory_aware_transport");
    supportNeeds.push({
      key: "sensory_aware_transport",
      label: "Sensory-aware transport",
    });
  }

  if (/\b(plain language|easy read|aac)\b/i.test(q)) {
    accessNeeds.push("plain_language");
  }

  if (/\b(angry|unsafe|abuse|complain about worker)\b/i.test(q)) {
    riskFlags.push({
      tier: "tier_4",
      reason: "Possible safeguarding concern in participant narrative",
    });
  }

  const intent = classifyIntent(query);
  if (intent.type === "combined" && !supportNeeds.length) {
    supportNeeds.push(
      { key: "morning_routine_support", label: "Morning routine support" },
      { key: "accessible_transport", label: "Accessible transport" }
    );
  }

  if (!goals.length && supportNeeds.length) {
    goals.push({ key: "daily_participation", label: "Participate in daily activities" });
  }

  if (!supportNeeds.length && goals.length) {
    missingInformation.push("Specific support types not yet described");
  }

  return {
    goals,
    supportNeeds,
    accessNeeds,
    missingInformation,
    riskFlags,
    sensorySignals: sensorySignals.length ? sensorySignals : undefined,
  };
}
