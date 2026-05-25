export function PeerReplyThread({
  replies,
}: {
  replies: { id: string; body: string; authorName: string }[];
}) {
  return (
    <section aria-label="Replies">
      <h3 className="text-sm font-semibold">Replies</h3>
      <ol className="mt-2 space-y-3">
        {replies.map((r) => (
          <li key={r.id}>
            <article className="rounded-md bg-muted/50 p-3">
              <p className="text-xs font-medium">{r.authorName}</p>
              <p className="mt-1 text-sm whitespace-pre-wrap">{r.body}</p>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
