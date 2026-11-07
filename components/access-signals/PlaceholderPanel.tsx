import Link from "next/link";

import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function PlaceholderPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="mx-auto max-w-3xl space-y-4 px-4 py-12">
      <h1 className="font-heading text-3xl font-bold text-[#0C1833]">{title}</h1>
      <p className="text-slate-700">{description}</p>
      <p role="status" className="rounded-xl border border-slate-200 bg-white p-4">
        This tab is a placeholder in the Access Signals synthetic demo. No
        ledger, evidence store or settings backend is connected.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/access-signals"
          className={`inline-flex min-h-11 items-center rounded-xl bg-[#0C1833] px-4 font-bold text-white ${mapableInteractiveFocusRing}`}
        >
          Back to Explore
        </Link>
        <Link
          href="/access-signals/remediation"
          className={`inline-flex min-h-11 items-center rounded-xl border border-[#0C1833] px-4 font-bold ${mapableInteractiveFocusRing}`}
        >
          Open Remediation
        </Link>
      </div>
    </section>
  );
}
