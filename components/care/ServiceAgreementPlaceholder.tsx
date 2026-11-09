export function ServiceAgreementPlaceholder({
  title,
  summary,
}: {
  title?: string;
  summary?: string | null;
}) {
  return (
    <section className="rounded-xl border border-dashed p-4" aria-labelledby="sa-heading">
      <h2 id="sa-heading" className="font-semibold">
        {title ?? "Service agreement — awaiting issue"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {summary ??
          "No agreement has been issued or signed here. Request the full terms from your provider and review them before agreeing."}
      </p>
    </section>
  );
}
