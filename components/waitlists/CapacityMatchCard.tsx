export function CapacityMatchCard({
  organisationName,
  status,
}: {
  organisationName: string;
  status: string;
}) {
  return (
    <article className="rounded-lg border p-3 text-sm">
      <p className="font-medium">{organisationName}</p>
      <p className="text-muted-foreground">Match status: {status}</p>
    </article>
  );
}
