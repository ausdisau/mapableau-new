/**
 * Channel budget allocations — integer minor units (cents).
 */

export type BuyingChannel =
  | "mapable"
  | "meta"
  | "google"
  | "tiktok"
  | "linkedin"
  | "dooh";

export type ChannelAllocation = {
  channel: BuyingChannel;
  capMinor: number;
};

export class AllocationValidationError extends Error {
  readonly code = "ALLOCATION_INVALID";
  constructor(message: string) {
    super(message);
    this.name = "AllocationValidationError";
  }
}

export function assertAllocationsWithinBudget(
  budgetMinor: number,
  allocations: ChannelAllocation[],
): void {
  if (!Number.isInteger(budgetMinor) || budgetMinor < 0) {
    throw new AllocationValidationError("budgetMinor must be a non-negative integer");
  }
  if (allocations.length === 0) {
    throw new AllocationValidationError("at least one channel allocation is required");
  }
  const seen = new Set<BuyingChannel>();
  let sum = 0;
  for (const row of allocations) {
    if (seen.has(row.channel)) {
      throw new AllocationValidationError(`duplicate channel allocation: ${row.channel}`);
    }
    seen.add(row.channel);
    if (!Number.isInteger(row.capMinor) || row.capMinor < 0) {
      throw new AllocationValidationError(
        `capMinor for ${row.channel} must be a non-negative integer`,
      );
    }
    sum += row.capMinor;
  }
  if (sum > budgetMinor) {
    throw new AllocationValidationError(
      `sum of channel caps (${sum}) exceeds campaign budget (${budgetMinor})`,
    );
  }
}

export function sumAllocationCaps(allocations: ChannelAllocation[]): number {
  return allocations.reduce((acc, row) => acc + row.capMinor, 0);
}
