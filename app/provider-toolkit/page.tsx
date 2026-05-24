import Link from "next/link";

export const metadata = { title: "Provider Toolkit" };

export default function ProviderToolkitPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Provider Toolkit</h1>
      <p className="text-muted-foreground">
        Lightweight tools for small providers — rosters, service logs, invoices, and compliance checklists.
      </p>
      <Link href="/provider" className="text-primary underline">
        Go to provider portal
      </Link>
    </main>
  );
}
