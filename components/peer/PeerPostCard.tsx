import { ReportContentButton } from "./ReportContentButton";

export function PeerPostCard({
  id,
  body,
  authorName,
  contentWarning,
}: {
  id: string;
  body: string;
  authorName: string;
  contentWarning?: string | null;
}) {
  return (
    <article className="rounded-lg border p-4" aria-labelledby={`post-${id}-author`}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <p id={`post-${id}-author`} className="text-sm font-medium">
          {authorName}
        </p>
        <ReportContentButton contentType="PeerCirclePost" contentId={id} />
      </header>
      {contentWarning ? (
        <p className="mt-2 text-sm font-medium text-amber-800" role="note">
          Content note: {contentWarning}
        </p>
      ) : null}
      <p className="mt-2 whitespace-pre-wrap">{body}</p>
    </article>
  );
}
