import type { AccessNeed } from "@/lib/access-fit/types";

/** True when the participant has selected at least one meaningful access need. */
export function hasActiveAccessNeeds(needs: AccessNeed): boolean {
  return (Object.keys(needs) as (keyof AccessNeed)[]).some((key) => needs[key] === true);
}
