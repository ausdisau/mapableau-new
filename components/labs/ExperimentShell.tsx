import type { ReactNode } from "react";

import { ExperimentStatusBadge } from "@/components/labs/ExperimentStatusBadge";
import type { LabExperimentStatus } from "@/lib/labs/contracts";

export function ExperimentShell({
  title,
  summary,
  status,
  children,
}: {
  title: string;
  summary: string;
  status: LabExperimentStatus;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div>
          <ExperimentStatusBadge status={status} />
          <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/75">{summary}</p>
        </div>
        <aside
          className="rounded-3xl border border-[#F8C51C]/25 bg-[#F8C51C]/10 p-5"
          aria-label="Safety boundary"
        >
          <p className="font-black text-[#F8C51C]">Simulation only</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-white/75">
            <li>No motor, steering or braking control.</li>
            <li>No clinical or safety certification claim.</li>
            <li>No simulated observation becomes live GAIS evidence.</li>
            <li>You can pause or leave at any time. No time limits.</li>
          </ul>
        </aside>
      </header>
      <div className="mt-10">{children}</div>
    </div>
  );
}
