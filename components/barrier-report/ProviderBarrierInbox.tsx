"use client";

import { useMemo, useState } from "react";

import { AccessibleFormField } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import {
  canTransitionBarrierStatus,
  PROVIDER_STATUS_TRANSITIONS,
  type ProviderBarrierStatus,
} from "@/lib/barrier-report/status";

export type ProviderBarrierReportRow = {
  id: string;
  referenceNumber: string;
  category: string;
  description: string;
  placeName: string | null;
  placeSlug: string | null;
  locationDetail: string | null;
  urgency: string;
  status: ProviderBarrierStatus | "draft";
  observedAt: string | null;
  imageUrl: string | null;
  imageDescription: string | null;
  anonymous: boolean;
  createdAt: string;
  updatedAt: string;
};

function nextStatuses(
  status: ProviderBarrierReportRow["status"],
): ProviderBarrierStatus[] {
  if (status === "draft") return [];
  return PROVIDER_STATUS_TRANSITIONS[status];
}

export function ProviderBarrierInbox({
  initialReports,
  canManage,
}: {
  initialReports: ProviderBarrierReportRow[];
  canManage: boolean;
}) {
  const [reports, setReports] = useState(initialReports);
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const visible = useMemo(() => {
    if (filter === "all") return reports;
    return reports.filter((report) => report.status !== "closed");
  }, [filter, reports]);

  async function updateStatus(id: string, status: ProviderBarrierStatus) {
    setBusyId(id);
    setMessage("");
    const res = await fetch(`/api/provider/access-barrier-reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setMessage(data.error || "Could not update status.");
      return;
    }
    const data = (await res.json()) as {
      report: { id: string; status: ProviderBarrierStatus; updatedAt: string };
    };
    setReports((prev) =>
      prev.map((report) =>
        report.id === id
          ? {
              ...report,
              status: data.report.status,
              updatedAt: data.report.updatedAt,
            }
          : report,
      ),
    );
    setMessage(`Report updated to ${status}.`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <AccessibleFormField id="barrier-filter" label="Show">
          <select
            id="barrier-filter"
            className="min-h-11 rounded-xl border border-slate-300 px-3"
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value === "all" ? "all" : "open")
            }
          >
            <option value="open">Open reports</option>
            <option value="all">All reports</option>
          </select>
        </AccessibleFormField>
        <p className="text-sm text-slate-600" role="status">
          {visible.length} report{visible.length === 1 ? "" : "s"}
        </p>
      </div>
      {message ? (
        <p className="text-sm font-semibold text-[#0C1833]" role="status">
          {message}
        </p>
      ) : null}
      {visible.length === 0 ? (
        <p className="text-sm text-slate-600">No barrier reports to show.</p>
      ) : (
        <ul className="space-y-4">
          {visible.map((report) => {
            const transitions = nextStatuses(report.status);
            return (
              <li
                key={report.id}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-black text-[#0C1833]">
                    {report.referenceNumber}
                  </h2>
                  <p className="text-sm font-semibold capitalize text-slate-700">
                    {report.status} · {report.urgency.replace("_", " ")}
                  </p>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {report.placeName || "Unspecified place"} · {report.category}
                  {report.anonymous ? " · Anonymous report" : ""}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-800">
                  {report.description}
                </p>
                {report.locationDetail ? (
                  <p className="mt-2 text-sm text-slate-600">
                    Location detail: {report.locationDetail}
                  </p>
                ) : null}
                {report.imageDescription ? (
                  <p className="mt-2 text-sm text-slate-600">
                    Image description: {report.imageDescription}
                  </p>
                ) : null}
                {canManage && transitions.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {transitions.map((status) => (
                      <Button
                        key={status}
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={
                          busyId === report.id ||
                          !canTransitionBarrierStatus(report.status, status)
                        }
                        loading={busyId === report.id}
                        onClick={() => void updateStatus(report.id, status)}
                      >
                        Mark {status}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-xs text-slate-500">
        Reporter contact details are never shown here. Place ownership scoping
        for multi-org providers is a planned follow-up.
      </p>
    </div>
  );
}
