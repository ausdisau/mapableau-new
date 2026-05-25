type TelehealthJoinPanelProps = {
  secureLinkToken?: string | null;
  linkExpiresAt?: Date | string | null;
};

export function TelehealthJoinPanel({
  secureLinkToken,
  linkExpiresAt,
}: TelehealthJoinPanelProps) {
  if (!secureLinkToken) return null;
  const expires = linkExpiresAt
    ? new Date(linkExpiresAt).toLocaleString()
    : "unknown";

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="font-medium">Telehealth session</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Secure join link (placeholder for integrated video provider). Link
        expires {expires}.
      </p>
      <p className="mt-2 font-mono text-xs break-all">{secureLinkToken}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        Do not share this token outside your care team.
      </p>
    </section>
  );
}
