export function WaitlistStatusCard({
  waitlist,
}: {
  waitlist: {
    id: string;
    requestedServiceType: string;
    status: string;
    suburb: string | null;
  };
}) {
  return (
    <article className="rounded-xl border p-4">
      <h2 className="font-medium">{waitlist.requestedServiceType}</h2>
      <p className="text-sm text-muted-foreground">
        Status: {waitlist.status}
        {waitlist.suburb ? ` · ${waitlist.suburb}` : ""}
      </p>
    </article>
  );
}
