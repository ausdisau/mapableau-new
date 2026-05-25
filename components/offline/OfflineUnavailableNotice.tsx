export function OfflineUnavailableNotice({
  featureName,
}: {
  featureName: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-border bg-muted/40 p-4 text-sm"
    >
      <p className="font-semibold">{featureName} needs a connection</p>
      <p className="mt-1 text-muted-foreground">
        This information is not stored on your device for privacy. Connect to
        the internet and try again.
      </p>
    </div>
  );
}
