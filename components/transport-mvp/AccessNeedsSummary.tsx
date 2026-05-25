export function AccessNeedsSummary({
  lines,
  shared,
}: {
  lines: string[];
  shared: boolean;
}) {
  return (
    <section
      className="rounded-xl border p-4"
      aria-labelledby="access-needs-heading"
    >
      <h2 id="access-needs-heading" className="font-heading text-lg font-semibold">
        Access needs
      </h2>
      {!shared ? (
        <p className="mt-2 text-sm text-muted-foreground" role="note">
          Detailed access needs are withheld until consent is granted to the provider.
        </p>
      ) : null}
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}
