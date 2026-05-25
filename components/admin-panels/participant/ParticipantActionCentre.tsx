import { ActionQueueList, type ActionQueueItem } from "@/components/admin-panels/ActionQueueList";

export function ParticipantActionCentre({ items }: { items: ActionQueueItem[] }) {
  return <ActionQueueList items={items} title="Your action centre" />;
}
