import { notFound } from "next/navigation";

import { QuoteComparisonTable } from "@/components/quotes/QuoteComparisonTable";
import { QuoteStatusTimeline } from "@/components/quotes/QuoteStatusTimeline";
import { QuoteToBookingButton } from "@/components/quotes/QuoteToBookingButton";
import { requireAuth } from "@/lib/auth/guards";
import { getQuoteRequest } from "@/lib/quotes/quote-request-service";
import { buildQuoteComparison } from "@/lib/quotes/quote-comparison-service";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const quote = await getQuoteRequest(id);
  if (!quote || quote.participantId !== user.id) notFound();
  const comparison = await buildQuoteComparison(id);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">{quote.title}</h1>
      <QuoteStatusTimeline events={quote.events} />
      <QuoteComparisonTable comparison={comparison} />
      <QuoteToBookingButton quoteId={quote.id} />
    </div>
  );
}
