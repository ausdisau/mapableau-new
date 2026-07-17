/**
 * Internal shadow evaluation console — evaluation only, no execute actions.
 */
export default function AuraShadowEvaluationsAdminPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">AURA shadow evaluations</h1>
      <p role="status" className="mt-2 rounded border border-amber-700 bg-amber-50 p-3 text-sm">
        Evaluation console only. No button on this page sends, books, publishes
        or notifies. Aggregate metrics must not profile participants.
      </p>
      <p className="mt-4 text-sm text-slate-700">
        Role-gated operational view for Wave 3 shadow outcomes (allowed,
        blocked, indeterminate, adapter not configured, duplicate risk). Wire
        to authenticated admin metrics when Prisma persistence is enabled.
      </p>
    </main>
  );
}
