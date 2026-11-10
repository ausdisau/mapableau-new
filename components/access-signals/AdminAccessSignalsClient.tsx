"use client";

import { useMemo, useState } from "react";

import {
  makeSyntheticRemediationQueue,
  remediationImpliesGreen,
  REMEDIATION_STATUSES,
  type RemediationStatus,
  type SyntheticRemediationItem,
} from "@/lib/access/signals/remediation";

export function AdminAccessSignalsClient() {
  const [items, setItems] = useState<SyntheticRemediationItem[]>(() =>
    makeSyntheticRemediationQueue(),
  );

  const csv = useMemo(() => {
    const header = "id,title,zoneId,featureId,status,requiresFollowUpAssessment";
    const rows = items.map(
      (item) =>
        `${item.id},"${item.title}",${item.zoneId},${item.featureId},${item.status},${item.requiresFollowUpAssessment}`,
    );
    return [header, ...rows].join("\n");
  }, [items]);

  function advance(id: string, status: RemediationStatus) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              requiresFollowUpAssessment: true,
              notes:
                status === "closed"
                  ? "Closed ≠ Green. Follow-up assessment required."
                  : item.notes,
            }
          : item,
      ),
    );
  }

  return (
    <div className="space-y-4" data-testid="admin-signals-queue">
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white p-4 text-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-bold text-[#0C1833]">{item.title}</p>
                <p className="text-slate-600">
                  {item.zoneId} · {item.featureId}
                </p>
                <p className="mt-1">{item.notes}</p>
                <p className="mt-1 font-semibold">
                  Status: {item.status}
                  {remediationImpliesGreen(item)
                    ? " (illegal Green implication)"
                    : " · does not imply Green"}
                </p>
              </div>
              <label className="text-xs font-semibold">
                Lifecycle
                <select
                  className="mt-1 block min-h-11 rounded-lg border border-slate-200 px-2"
                  value={item.status}
                  onChange={(event) =>
                    advance(item.id, event.target.value as RemediationStatus)
                  }
                >
                  {REMEDIATION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </li>
        ))}
      </ul>

      <div>
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">
          Synthetic CSV export
        </h2>
        <pre
          className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"
          aria-label="Synthetic remediation CSV"
        >
          {csv}
        </pre>
      </div>
    </div>
  );
}
