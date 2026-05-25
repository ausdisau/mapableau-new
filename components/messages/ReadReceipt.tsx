import type { MessageStatus } from "@/types/messages";

const STATUS_LABELS: Record<MessageStatus, string> = {
  draft: "Draft",
  sending: "Sending",
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
  failed: "Failed to send",
  deleted: "Deleted",
};

export function ReadReceipt({ status }: { status: MessageStatus }) {
  return (
    <span className="text-xs text-muted-foreground" aria-label={`Message status: ${STATUS_LABELS[status]}`}>
      <span aria-hidden="true">{STATUS_LABELS[status]}</span>
    </span>
  );
}
