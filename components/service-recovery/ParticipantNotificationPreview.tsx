export function ParticipantNotificationPreview({ message }: { message: string }) {
  return (
    <aside
      className="rounded-lg border border-border bg-muted/30 p-4 text-sm"
      aria-label="Notification preview"
    >
      <p className="font-medium">Message you would receive</p>
      <p className="mt-2">{message}</p>
    </aside>
  );
}
