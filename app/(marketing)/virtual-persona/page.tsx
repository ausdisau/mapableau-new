import type { Metadata } from "next";
import Link from "next/link";

import { MapAbleAppShell } from "@/components/marketing/MapAbleAppShell";
import { VirtualPersonaWorkspace } from "@/components/virtual-persona/VirtualPersonaWorkspace";
import { isVirtualPersonaUiEnabled } from "@/lib/config/virtual-persona";

export const metadata: Metadata = {
  title: "MapAble Guide — illustrative workspace | MapAble",
  description:
    "A text-first assistant workspace using fictional examples; not connected to private accounts or live bookings.",
};

export const dynamic = "force-dynamic";

export default function VirtualPersonaPage() {
  const enabled = isVirtualPersonaUiEnabled();

  return (
    <MapAbleAppShell variant="app" headerTitle="MapAble Guide">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-8 max-w-3xl space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#005B7F]">
            MapAble Guide · private development preview
          </p>
          <h1 className="text-3xl font-bold text-[#0C1833] sm:text-4xl">
            MapAble Guide
          </h1>
          <p className="text-base leading-relaxed text-slate-700">
            A text-first workspace to ask questions, review sources, and edit
            drafts. It preserves your decision-making authority. This build uses{" "}
            <strong>synthetic fixtures only</strong>—no live model calls, no
            private participant retrieval, and no bookings or payments.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>AI-assisted wording may be wrong or incomplete.</li>
            <li>actionAuthority is always none in this phase.</li>
            <li>
              Prefer the classic{" "}
              <Link href="/ask" className="font-semibold text-[#005B7F] underline">
                Ask MapAble
              </Link>{" "}
              path when you want a non-persona experience.
            </li>
          </ul>
        </header>

        {enabled ? (
          <VirtualPersonaWorkspace />
        ) : (
          <section
            aria-labelledby="vp-disabled-heading"
            className="rounded-xl border border-slate-200 bg-slate-50 p-6"
          >
            <h2
              id="vp-disabled-heading"
              className="text-xl font-bold text-[#0C1833]"
            >
              Interactive workspace is not available
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-700">
              Set <code className="rounded bg-white px-1">MAPABLE_VIRTUAL_PERSONA_UI=true</code>{" "}
              in an authorised non-production environment to explore fictional scenarios.
              The flag defaults to off. P01 policy enforcement for protected
              retrieval is not part of this page.
            </p>
            <p className="mt-4">
              <Link
                href="/ask"
                className="inline-flex min-h-11 items-center rounded-lg bg-[#005B7F] px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/50"
              >
                Continue with classic Ask MapAble
              </Link>
            </p>
          </section>
        )}
      </div>
    </MapAbleAppShell>
  );
}
