import type { AccessSloBreach } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function createSloBreachReview(input: {
  sloProfileId: string;
  observedValue: number;
  assetId?: string | null;
  errorBudgetRemaining?: number | null;
  narrative?: string | null;
}): Promise<AccessSloBreach> {
  return prisma.accessSloBreach.create({
    data: {
      sloProfileId: input.sloProfileId,
      assetId: input.assetId ?? null,
      observedValue: input.observedValue,
      errorBudgetRemaining: input.errorBudgetRemaining ?? null,
      reviewRequired: true,
      penaltyAutomatic: false,
      narrative: input.narrative ?? null,
    },
  });
}
