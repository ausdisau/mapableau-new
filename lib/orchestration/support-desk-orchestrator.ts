import { createTicketWithTimeline } from "@/lib/support-desk/support-ticket-service";
import { isModuleEnabled } from "@/lib/feature-flags/server-feature-flag";

export async function openSupportTicketWithDesk(params: Parameters<typeof createTicketWithTimeline>[0]) {
  if (!(await isModuleEnabled("support_desk_enabled"))) {
    const { createSupportTicket } = await import("@/lib/support/ticket-service");
    return createSupportTicket(params);
  }
  return createTicketWithTimeline(params);
}
