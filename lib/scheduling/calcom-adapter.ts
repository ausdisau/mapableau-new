import type { SchedulingAdapter } from "@/lib/scheduling/scheduling-adapter";
import { internalSchedulingAdapter } from "@/lib/scheduling/internal-scheduling-adapter";

export const calcomAdapter: SchedulingAdapter = {
  async listAvailability(practitionerId, from, to) {
    void process.env.CALCOM_API_KEY;
    return internalSchedulingAdapter.listAvailability(practitionerId, from, to);
  },
  async createExternalBookingReference(slotId: string) {
    return { externalBookingId: `calcom_${slotId}` };
  },
};
