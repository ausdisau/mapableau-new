import {
  hardConstraintsSchema,
  type HardConstraints,
  type HardConstraintsInput,
} from "@/lib/ai/navigator/matching/types";
import { listMemoryItems } from "@/lib/ai/navigator/memory/service";
import { isNavigatorMemoryEnabled } from "@/lib/config/navigator-pilot";

/**
 * Merge approved-category governed memory into Stage-1 hard constraints.
 * Never invents clinical/capacity labels; only explicit participant memory.
 */
export async function applyMemoryToHardConstraints(input: {
  tenantId: string;
  participantId: string;
  constraints: HardConstraints;
}): Promise<HardConstraints> {
  if (!isNavigatorMemoryEnabled()) {
    return input.constraints;
  }

  let items;
  try {
    items = await listMemoryItems({
      tenantId: input.tenantId,
      participantId: input.participantId,
      take: 50,
    });
  } catch {
    return input.constraints;
  }

  const next: HardConstraintsInput = {
    ...input.constraints,
    exclusions: [...input.constraints.exclusions],
    accessibilityRequirements: [
      ...input.constraints.accessibilityRequirements,
    ],
    communicationRequirements: [
      ...input.constraints.communicationRequirements,
    ],
    nonNegotiableKeys: [...input.constraints.nonNegotiableKeys],
  };

  for (const item of items) {
    const summary = item.contentSummary.trim();
    if (!summary) continue;
    switch (item.category) {
      case "participant_exclusion":
        if (!next.exclusions?.includes(summary)) {
          next.exclusions = [...(next.exclusions ?? []), summary];
        }
        if (!next.nonNegotiableKeys?.includes("exclusions")) {
          next.nonNegotiableKeys = [
            ...(next.nonNegotiableKeys ?? []),
            "exclusions",
          ];
        }
        break;
      case "accessibility_requirement":
        if (!next.accessibilityRequirements?.includes(summary)) {
          next.accessibilityRequirements = [
            ...(next.accessibilityRequirements ?? []),
            summary,
          ];
        }
        break;
      case "communication_requirement":
        if (!next.communicationRequirements?.includes(summary)) {
          next.communicationRequirements = [
            ...(next.communicationRequirements ?? []),
            summary,
          ];
        }
        break;
      case "explicit_preference":
      case "consented_workflow_state":
        // Preferences inform ranking via participantPreference weights;
        // do not invent hard constraints from soft preferences.
        break;
      default: {
        const _exhaustive: never = item.category;
        void _exhaustive;
        break;
      }
    }
  }

  return hardConstraintsSchema.parse(next);
}
