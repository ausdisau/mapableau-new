import Link from "next/link";

export function CoverageCareDisabledState() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold text-[color:var(--cc-olive)]">
        Coverage Care is not enabled
      </h1>
      <p className="mt-4 text-base leading-relaxed text-[color:var(--cc-ink)]/80">
        This white-label pilot is gated behind{" "}
        <code className="rounded bg-black/5 px-1.5 py-0.5 text-sm">
          MAPABLE_COVERAGE_CARE_ENABLED=true
        </code>
        . Flags default off to preserve production MapAble behaviour.
      </p>
      <p className="mt-6">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-md bg-[color:var(--cc-olive)] px-4 text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
        >
          Return to MapAble
        </Link>
      </p>
    </div>
  );
}
