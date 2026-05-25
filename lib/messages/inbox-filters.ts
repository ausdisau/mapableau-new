import type { ConversationThread, ThreadType } from "@/types/messages";

export type PrimaryInboxTab = "all" | "direct" | "groups" | "linked" | "safety";
export type LinkedInboxSubTab =
  | "all_linked"
  | "booking"
  | "transport"
  | "invoice"
  | "support";

const DIRECT_TYPES: ThreadType[] = ["direct", "telehealth"];
const GROUP_TYPES: ThreadType[] = ["group", "provider_team"];
const LINKED_TYPES: ThreadType[] = [
  "booking",
  "transport_trip",
  "invoice",
  "service_agreement",
  "support_ticket",
];
const SAFETY_TYPES: ThreadType[] = [
  "complaint",
  "incident_safe_comms",
  "admin_support",
];

export function filterInboxThreads(
  threads: ConversationThread[],
  primary: PrimaryInboxTab,
  linkedSub: LinkedInboxSubTab
): ConversationThread[] {
  let list = threads;
  if (primary === "direct") {
    list = list.filter((t) => DIRECT_TYPES.includes(t.threadType));
  } else if (primary === "groups") {
    list = list.filter((t) => GROUP_TYPES.includes(t.threadType));
  } else if (primary === "linked") {
    list = list.filter((t) => LINKED_TYPES.includes(t.threadType));
    if (linkedSub === "booking") {
      list = list.filter((t) => t.threadType === "booking");
    } else if (linkedSub === "transport") {
      list = list.filter((t) => t.threadType === "transport_trip");
    } else if (linkedSub === "invoice") {
      list = list.filter((t) =>
        t.threadType === "invoice" || t.threadType === "service_agreement"
      );
    } else if (linkedSub === "support") {
      list = list.filter((t) => t.threadType === "support_ticket");
    }
  } else if (primary === "safety") {
    list = list.filter((t) => SAFETY_TYPES.includes(t.threadType));
  }
  return list;
}
