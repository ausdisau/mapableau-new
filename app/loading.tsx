export default function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-background px-4 py-16">
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm"
        role="status"
        aria-live="polite"
      >
        <div
          className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary motion-reduce:animate-none"
          aria-hidden="true"
        />
        <p className="text-base font-semibold text-foreground">Loading page</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Please wait while this page is prepared.
        </p>
      </div>
    </div>
  );
}
