import { QuoteRequestForm } from "@/components/quotes/QuoteRequestForm";

export default function NewQuotePage() {
  return (
    <div className="mx-auto max-w-xl p-4">
      <h1 className="font-heading text-2xl font-bold">Request quotes</h1>
      <QuoteRequestForm />
    </div>
  );
}
