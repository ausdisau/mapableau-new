import { ActionQueueList, type ActionQueueItem } from "@/components/admin-panels/ActionQueueList";

export function ProviderActionQueue({ items }: { items: ActionQueueItem[] }) {
  return <ActionQueueList items={items} title="Provider action queue" />;
}
