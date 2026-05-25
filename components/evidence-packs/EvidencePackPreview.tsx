export function EvidencePackPreview({ title }: { title: string }) {
  return (
    <section className="rounded-xl border p-4">
      <h2 className="font-medium">Preview: {title}</h2>
      <p className="text-sm text-muted-foreground">Plain-language section summaries appear here.</p>
    </section>
  );
}
