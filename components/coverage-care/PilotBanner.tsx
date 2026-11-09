export function PilotBanner() {
  return (
    <aside
      className="border-b border-[color:var(--cc-olive)]/20 bg-[color:var(--cc-olive)] text-[color:var(--cc-cream)]"
      aria-label="Pilot notice"
    >
      <p className="mx-auto max-w-6xl px-4 py-2 text-sm sm:px-6">
        Coverage Care pilot — synthetic data only. No live bookings, NDIA
        submissions, payments, or verified NDIS registration claims.
      </p>
    </aside>
  );
}
