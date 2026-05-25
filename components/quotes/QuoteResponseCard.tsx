export function QuoteResponseCard({
  totalCents,
  notes,
}: {
  totalCents: number;
  notes?: string | null;
}) {
  return (
    <article className="rounded-lg border p-3">
      <p className="font-medium">${(totalCents / 100).toFixed(2)}</p>
      {notes ? <p className="text-sm text-muted-foreground">{notes}</p> : null}
    </article>
  );
}
