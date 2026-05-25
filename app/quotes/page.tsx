import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { listQuoteRequests } from "@/lib/quotes/quote-request-service";

export default async function QuotesPage() {
  const user = await requireAuth();
  let quotes: Awaited<ReturnType<typeof listQuoteRequests>> = [];
  try {
    quotes = await listQuoteRequests(user.id);
  } catch {
    quotes = [];
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <header className="flex justify-between">
        <h1 className="font-heading text-2xl font-bold">Quote requests</h1>
        <Link href="/quotes/new" className="min-h-11 rounded-lg bg-primary px-4 py-2 text-primary-foreground">
          Request quotes
        </Link>
      </header>
      <ul className="space-y-2">
        {quotes.map((q) => (
          <li key={q.id}>
            <Link href={`/quotes/${q.id}`} className="block rounded-lg border p-3 underline">
              {q.title} — {q.status}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
