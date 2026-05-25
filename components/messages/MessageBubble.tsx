import { ReadReceipt } from "@/components/messages/ReadReceipt";
import type { MessageStatus } from "@/types/messages";

export function MessageBubble({
  body,
  senderName,
  createdAt,
  isOwn,
  status,
}: {
  body: string;
  senderName: string;
  createdAt: string | Date;
  isOwn: boolean;
  status?: MessageStatus;
}) {
  return (
    <article
      className={`max-w-[85%] rounded-xl px-4 py-3 ${
        isOwn ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"
      }`}
      aria-label={`Message from ${senderName}`}
    >
      <p className="text-xs font-medium opacity-80">{senderName}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm">{body}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <time className="text-xs opacity-70" dateTime={new Date(createdAt).toISOString()}>
          {new Date(createdAt).toLocaleString("en-AU")}
        </time>
        {isOwn && status ? <ReadReceipt status={status} /> : null}
      </div>
    </article>
  );
}
