"use client";

import { useState } from "react";

import { PanelSection } from "@/components/admin-panels/PanelSection";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Invoice, InvoiceLine, Organisation } from "@prisma/client";

type InvoiceRow = Invoice & {
  organisation: Pick<Organisation, "name"> | null;
  lines: InvoiceLine[];
};

export function InvoiceApprovalPanel({ invoices }: { invoices: InvoiceRow[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const pending = invoices.filter((i) => !i.participantApprovedAt);

  async function approve(id: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/participant/invoices/${id}/approve`, {
        method: "POST",
      });
      if (res.ok) window.location.reload();
    } finally {
      setBusy(null);
    }
  }

  return (
    <PanelSection title="Invoice approval">
      {pending.length === 0 ? (
        <p className="text-sm text-muted-foreground">No invoices awaiting your approval.</p>
      ) : (
        <ul className="space-y-4">
          {pending.map((inv) => (
            <li key={inv.id} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  {inv.organisation?.name ?? "Provider"} · $
                  {(inv.totalCents / 100).toFixed(2)}
                </span>
                <StatusBadge status={inv.status} />
              </div>
              <button
                type="button"
                disabled={busy === inv.id}
                onClick={() => approve(inv.id)}
                className="mt-3 min-h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring"
              >
                {busy === inv.id ? "Approving…" : "Approve invoice"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </PanelSection>
  );
}
