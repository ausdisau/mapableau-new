"use client";

export function QuoteToBookingButton({ quoteId }: { quoteId: string }) {
  async function convert() {
    await fetch(`/api/quotes/${quoteId}/convert-to-booking`, { method: "POST" });
  }
  return (
    <button type="button" onClick={() => void convert()} className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground">
      Convert to booking draft
    </button>
  );
}
