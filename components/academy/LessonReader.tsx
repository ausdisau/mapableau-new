"use client";

type LessonReaderProps = {
  title: string;
  contentMarkdown: string;
  videoUrl?: string | null;
  captionsRequired?: boolean;
  completed: boolean;
  onComplete: () => void;
  completing?: boolean;
};

export function LessonReader({
  title,
  contentMarkdown,
  videoUrl,
  captionsRequired,
  completed,
  onComplete,
  completing,
}: LessonReaderProps) {
  return (
    <article className="rounded-xl border border-border bg-card p-6 space-y-4">
      <h2 className="font-heading text-xl font-bold">{title}</h2>
      {videoUrl ? (
        <div className="space-y-2">
          <video
            controls
            className="w-full max-w-2xl rounded-lg border border-border"
            src={videoUrl}
          >
            <track kind="captions" label="English captions" srcLang="en" default />
          </video>
          {captionsRequired ? (
            <p className="text-sm text-muted-foreground">
              Captions are required for this lesson. Contact support if captions
              are missing.
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
        {contentMarkdown}
      </div>
      {!completed ? (
        <button
          type="button"
          onClick={onComplete}
          disabled={completing}
          className="min-h-11 rounded-lg bg-primary px-4 font-medium text-primary-foreground disabled:opacity-50"
        >
          {completing ? "Saving…" : "Mark lesson complete"}
        </button>
      ) : (
        <p role="status" className="text-sm font-medium text-primary">
          Lesson completed
        </p>
      )}
    </article>
  );
}
