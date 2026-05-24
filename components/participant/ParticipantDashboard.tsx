import Link from "next/link";

type Props = {
  displayName: string;
  unpaidInvoices: number;
  upcomingCareCount: number;
  upcomingTransportCount: number;
};

export function ParticipantDashboard({
  displayName,
  unpaidInvoices,
  upcomingCareCount,
  upcomingTransportCount,
}: Props) {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Hello {displayName}. Here is what is coming up for you.
      </p>
      <ul className="grid gap-4 sm:grid-cols-3">
        <li className="rounded-lg border p-4">
          <p className="font-medium">Care shifts</p>
          <p className="text-2xl font-bold">{upcomingCareCount}</p>
          <Link href="/dashboard/care" className="text-sm text-primary underline">
            View care
          </Link>
        </li>
        <li className="rounded-lg border p-4">
          <p className="font-medium">Transport trips</p>
          <p className="text-2xl font-bold">{upcomingTransportCount}</p>
          <Link href="/dashboard/transport" className="text-sm text-primary underline">
            View transport
          </Link>
        </li>
        <li className="rounded-lg border p-4">
          <p className="font-medium">Invoices to review</p>
          <p className="text-2xl font-bold">{unpaidInvoices}</p>
          <Link href="/dashboard/invoices" className="text-sm text-primary underline">
            View invoices
          </Link>
        </li>
      </ul>
    </div>
  );
}
