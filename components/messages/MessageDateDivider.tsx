export function MessageDateDivider({ label }: { label: string }) {
  return (
    <div className="relative my-4 flex items-center justify-center" role="separator" aria-label={label}>
      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
