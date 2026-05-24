export function MessageBubble({
  body,
  senderName,
  createdAt,
  isOwn,
  isSystemMessage,
}: {
  body: string;
  senderName: string;
  createdAt: string | Date;
  isOwn: boolean;
  isSystemMessage?: boolean;
}) {
  if (isSystemMessage) {
    return (
      <article
        className="mx-auto max-w-[90%] rounded-md border border-dashed bg-muted/50 px-4 py-2 text-center"
        aria-label={`System message: ${body}`}
      >
        <p className="text-sm text-muted-foreground">{body}</p>
        <time
          className="mt-1 block text-xs opacity-70"
          dateTime={new Date(createdAt).toISOString()}
        >
          {new Date(createdAt).toLocaleString("en-AU")}
        </time>
      </article>
    );
  }

  return (
    <article
      className={`max-w-[85%] rounded-xl px-4 py-3 ${
        isOwn ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"
      }`}
      aria-label={`Message from ${senderName}`}
    >
      <p className="text-xs font-medium opacity-80">{senderName}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm">{body}</p>
      <time className="mt-2 block text-xs opacity-70" dateTime={new Date(createdAt).toISOString()}>
        {new Date(createdAt).toLocaleString("en-AU")}
      </time>
    </article>
  );
}
