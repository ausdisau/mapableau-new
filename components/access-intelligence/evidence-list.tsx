"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export type EvidenceItem = {
  id: string;
  title: string;
  capturedAt: string;
  sourceName: string;
  sourceType: string;
  status: string;
  description?: string;
};

export function EvidenceList({ items }: { items: EvidenceItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-600">No evidence items listed yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="rounded-lg border border-slate-200 p-3 text-sm">
          <p className="font-semibold text-[#0C1833]">{item.title}</p>
          <p className="text-slate-600">
            {item.sourceName} · {item.sourceType.replaceAll("_", " ")} ·{" "}
            {item.status} · {new Date(item.capturedAt).toLocaleDateString()}
          </p>
          {item.description ? (
            <p className="mt-1 text-slate-700">{item.description}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function EvidenceDrawer({ items }: { items: EvidenceItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-[#0C1833]">Evidence</h2>
        <Button size="default"
          type="button"
          variant="outline"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={mapableCareFocusRing}
        >
          {open ? "Hide evidence" : "Show evidence"}
        </Button>
      </div>
      {open ? (
        <div className="mt-3" id="evidence-drawer-panel">
          <EvidenceList items={items} />
          <p className="mt-2 text-xs text-slate-500">
            AI inferences are never shown as measured evidence.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function UnknownsPanel({ unknowns }: { unknowns: string[] }) {
  return (
    <section
      aria-labelledby="unknowns-heading"
      className="rounded-2xl border border-slate-300 bg-slate-50 p-4"
    >
      <h2 id="unknowns-heading" className="text-lg font-black text-[#0C1833]">
        Unknown information
      </h2>
      {unknowns.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">
          No required unknowns identified in the latest plan.
        </p>
      ) : (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
          {unknowns.map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-sm text-slate-600">
        Incomplete information is not the same as inaccessible. You can ask the venue to
        confirm details.
      </p>
    </section>
  );
}

export function LiveIncidentBanner({
  message,
}: {
  message: string | null;
}) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="rounded-xl border-2 border-amber-700 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <strong className="font-black">Live condition:</strong> {message}
    </div>
  );
}

export function PlaceResultCard({
  name,
  address,
  reason,
  href,
}: {
  name: string;
  address: string;
  reason?: string;
  href?: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 p-4">
      <h3 className="font-black text-[#0C1833]">{name}</h3>
      <p className="text-sm text-slate-600">{address}</p>
      {reason ? <p className="mt-1 text-sm text-slate-700">{reason}</p> : null}
      {href ? (
        <a
          href={href}
          className={`mt-2 inline-flex min-h-11 items-center text-sm font-bold text-[#005B7F] underline ${mapableCareFocusRing}`}
        >
          Open place details
        </a>
      ) : null}
    </article>
  );
}
