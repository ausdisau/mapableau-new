type ConsentGateCardProps = {
  title: string;
  explanation: string;
};

export function ConsentGateCard({ title, explanation }: ConsentGateCardProps) {
  return (
    <section
      aria-labelledby="consent-gate-heading"
      className="rounded-xl border border-amber-200 bg-amber-50 p-4"
    >
      <h2 id="consent-gate-heading" className="text-lg font-semibold text-amber-950">
        {title}
      </h2>
      <p className="mt-2 text-amber-900">{explanation}</p>
    </section>
  );
}
