import type { AccessNeedId } from "@/types/wedges";
import { ACCESS_NEED_LABELS } from "@/types/wedges";

/**
 * Suggested questions to ask a provider based on access needs and gaps.
 */
export function suggestedQuestionsForNeeds(
  accessNeeds: AccessNeedId[],
  unknownNeedIds: AccessNeedId[] = accessNeeds,
): string[] {
  const questions: string[] = [
    "What is your current wait time for new participants?",
    "How do you handle changes to support on the day of a session?",
  ];

  for (const needId of unknownNeedIds) {
    const label = ACCESS_NEED_LABELS[needId];
    questions.push(`Can you confirm whether your service supports: ${label}?`);
  }

  if (accessNeeds.includes("transportSupportNeeded")) {
    questions.push(
      "Is there accessible parking or a suitable drop-off point at your location?",
      "Do you offer mobile or telehealth options if transport is difficult?",
    );
  }

  if (accessNeeds.includes("genderPreferenceForPersonalCare")) {
    questions.push(
      "Can you accommodate gender preferences for personal care support?",
    );
  }

  return [...new Set(questions)];
}

export function transportRemindersForNeeds(
  accessNeeds: AccessNeedId[],
): string[] {
  const reminders: string[] = [];
  if (
    accessNeeds.includes("wheelchairAccess") ||
    accessNeeds.includes("powerchairAccess") ||
    accessNeeds.includes("transportSupportNeeded")
  ) {
    reminders.push(
      "Plan accessible transport to and from the appointment.",
      "Allow extra time for boarding and finding accessible drop-off points.",
    );
  }
  if (accessNeeds.includes("homeVisit")) {
    reminders.push(
      "Confirm whether the provider travels to your home and any access requirements at your address.",
    );
  }
  return reminders;
}

export function buildConciergeSummaryFilters(input: {
  urgency: string;
  serviceMode: string;
  fundingType: string;
  accessNeeds: AccessNeedId[];
  postcode: string;
  suburb: string;
}) {
  return {
    availableThisWeek: input.urgency === "this_week",
    noWaitlist: input.urgency === "this_week",
    mobileService: input.serviceMode === "mobile_home_visit" || input.serviceMode === "flexible",
    telehealth: input.serviceMode === "telehealth" || input.serviceMode === "flexible",
    urgentCapacity: input.urgency === "this_week",
    fundingType:
      input.fundingType !== "unsure"
        ? (input.fundingType as "agency-managed" | "plan-managed" | "self-managed" | "private")
        : undefined,
    postcode: input.postcode || undefined,
    suburb: input.suburb || undefined,
  };
}
