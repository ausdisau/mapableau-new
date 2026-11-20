import { notFound } from "next/navigation";

import {
  OneActionCentre,
  OneAppShell,
  OneEmptyState,
  OneMetric,
  OnePrivacyNote,
  OneServiceCard,
  OneStatus,
} from "@/components/mapable-one";
import { isMapAbleOneUnifiedShellEnabled } from "@/lib/config/mapable-one-shell";
import type { ActionCentreProjection } from "@/lib/mapable-one/action-centre";
import { CORE_ONE_NAV } from "@/lib/mapable-one/shell-nav";
import type { WorkspaceAvailability } from "@/lib/mapable-one/workspace-access";

export const metadata = {
  title: "MapAble One synthetic preview | MapAble",
  robots: { index: false, follow: false },
};

const SYNTHETIC_WORKSPACES: WorkspaceAvailability[] = [
  { id: "search", label: "MapAble Search", href: "/search", available: true },
  { id: "core", label: "MapAble Core", href: "/dashboard", available: true },
  {
    id: "provider",
    label: "MapAble Provider",
    href: "/provider",
    available: false,
    reason: "Synthetic preview — provider membership not simulated as live.",
  },
  {
    id: "worker",
    label: "MapAble Worker",
    href: "/worker/today",
    available: false,
    reason: "Synthetic preview — worker affiliation not simulated as live.",
  },
];

const SYNTHETIC_ACTIONS: ActionCentreProjection = {
  state: "ready",
  items: [
    {
      id: "demo-1",
      title: "Synthetic: review today’s arrangements",
      detail: "Demo item only — not a live booking or participant record.",
      href: "/dashboard",
      urgency: "info",
      sourceLabel: "synthetic/demo fixture",
    },
  ],
};

/**
 * Visual QA surface for MapAble One skin. Clearly labelled synthetic —
 * does not read private production records.
 */
export default function MapAbleOnePreviewPage() {
  if (!isMapAbleOneUnifiedShellEnabled()) {
    notFound();
  }

  return (
    <OneAppShell
      workspaces={SYNTHETIC_WORKSPACES}
      currentWorkspace="core"
      workspaceLabel="MapAble One · synthetic/demo"
      contextLabel="Visual preview — not live operational data"
      userName="Preview user"
      logoHref="/"
      navLinks={CORE_ONE_NAV}
    >
      <div className="space-y-6">
        <div
          className="mo-card border-2 border-dashed border-[var(--mo-orange)] p-4"
          role="status"
        >
          <p className="font-bold text-[var(--mo-ink)]">
            synthetic/demo — MapAble One visual preview
          </p>
          <p className="mt-1 text-sm text-[var(--mo-muted)]">
            This route is for design review at desktop, tablet and mobile. It
            does not create bookings, expose participants, or enable dispatch.
          </p>
        </div>

        <OneActionCentre projection={SYNTHETIC_ACTIONS} />

        <div className="grid gap-3 sm:grid-cols-3">
          <OneMetric
            label="Demo metric"
            value="—"
            detail="Placeholder only"
            sourceLabel="synthetic/demo"
          />
          <OneStatus tone="attention" label="Needs attention (demo)" />
          <OneEmptyState
            title="Empty state sample"
            description="Authorised actions appear when real services return them."
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <OneServiceCard
            title="Care (demo link)"
            description="Navigates to the real Care area when signed in."
            href="/care"
            badge="Pilot"
          />
          <OneServiceCard
            title="Search"
            description="Public discovery remains available without entitlement claims."
            href="/search"
          />
        </div>

        <OnePrivacyNote>
          Screenshots of this page must retain the synthetic/demo banner. Do not
          present demo metrics as live GTV, NDIS status, or workforce clearance.
        </OnePrivacyNote>
      </div>
    </OneAppShell>
  );
}
