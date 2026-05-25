interface DocumentUploadPlaceholderProps {
  label: string;
  hint?: string;
}

export function DocumentUploadPlaceholder({
  label,
  hint = "Documents are private by default and only shared with people you authorise.",
}: DocumentUploadPlaceholderProps) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
      <p className="font-medium">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Upload will be available after your profile is saved. You can return to add
        documents from your dashboard.
      </p>
    </div>
  );
}
