export function PeerAnswerCard({
  body,
  authorName,
  highlighted,
}: {
  body: string;
  authorName: string;
  highlighted?: boolean;
}) {
  return (
    <article
      className={`rounded-lg border p-4 ${highlighted ? "border-primary bg-primary/5" : ""}`}
    >
      {highlighted ? (
        <p className="text-xs font-medium text-primary" aria-label="Moderator highlighted">
          Helpful answer (moderator highlighted)
        </p>
      ) : null}
      <p className="text-sm font-medium">{authorName}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm">{body}</p>
    </article>
  );
}
