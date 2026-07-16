"use client";

import { useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

function resolveRoleHeader(param: string | null): string | null {
  if (!param || param === "visitor") return null;
  if (param === "admin" || param === "demo_preview") return "demo_preview";
  if (param === "venue_staff") return "venue_staff";
  return param;
}

export function OperateConsole({ placeId }: { placeId: string }) {
  const searchParams = useSearchParams();
  const roleHeader = resolveRoleHeader(searchParams.get("role")) ?? "demo_preview";

  const [data, setData] = useState<{
    incidents: Array<{ id: string; description: string; status: string; type: string }>;
    evidenceGaps: Array<{ id: string; featureType: string; notes?: string }>;
    disputedClaims: Array<{ id: string; featureType: string }>;
    coverageSummary: Record<string, number>;
    temporaryRoute: { text: string };
    liveStatus?: { westernLift?: { resolution: string; reason: string } };
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [createDesc, setCreateDesc] = useState("Temporary display narrowing western corridor");

  const load = useCallback(async () => {
    const headers: Record<string, string> = {};
    if (roleHeader) headers["x-access-role"] = roleHeader;
    const res = await fetch(`/api/access-intelligence/venue/${placeId}/operate`, {
      headers,
    });
    const json = await res.json();
    if (!res.ok) {
      setForbidden(res.status === 403);
      setMessage(json.error ?? json.recoveryHint ?? "Forbidden");
      setData(null);
      return;
    }
    setForbidden(false);
    setData(json);
  }, [placeId, roleHeader]);

  useEffect(() => {
    void load();
  }, [load]);

  async function resolveIncident(incidentId: string) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (roleHeader) headers["x-access-role"] = roleHeader;
    const res = await fetch(`/api/access-intelligence/venue/${placeId}/operate`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        incidentId,
        status: "resolved",
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      }),
    });
    const json = await res.json();
    setMessage(
      json.auditId
        ? `Incident updated. Audit ${json.auditId}. ${json.note}`
        : json.error,
    );
    await load();
  }

  async function createIncident() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (roleHeader) headers["x-access-role"] = roleHeader;
    const res = await fetch(`/api/access-intelligence/venue/${placeId}/operate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        type: "construction",
        description: createDesc,
        severity: "moderate",
        affectedEdgeIds: ["e-hcc-display"],
      }),
    });
    const json = await res.json();
    setMessage(
      json.auditId
        ? `Incident created. Audit ${json.auditId}.`
        : json.error ?? "Create failed",
    );
    await load();
  }

  if (forbidden) {
    return (
      <div className="space-y-4 rounded-2xl border border-red-200 bg-red-50 p-5" role="alert">
        <h2 className="text-xl font-black text-red-900">Not authorised</h2>
        <p className="text-red-900">{message}</p>
        <p className="text-sm text-red-800">
          In production, Operate requires a NextAuth <code>mapable_admin</code> /{" "}
          <code>provider_admin</code> session or an <code>AiVenueStaffAssignment</code>. Demo
          role preview headers are ignored when <code>ACCESS_INTELLIGENCE_DEMO_MODE=false</code>.
        </p>
        <p className="text-sm">
          From the Living Building hub, select Demo role preview → Venue staff (demo mode only),
          then reopen Operate.
        </p>
      </div>
    );
  }

  if (!data) {
    return <p role="status">{message ?? "Loading operations console…"}</p>;
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-slate-600">
        Venue attestations stay labelled as venue attestations — they do not become assessor
        verification. Role header in use: {roleHeader} (demo convenience only).
      </p>

      <section aria-labelledby="incidents-heading">
        <h2 id="incidents-heading" className="text-xl font-black">
          Active incidents
        </h2>
        <ul className="mt-3 space-y-3">
          {data.incidents.map((inc) => (
            <li key={inc.id} className="rounded-xl border border-slate-200 p-4">
              <p className="font-bold">
                {inc.type.replaceAll("_", " ")} · {inc.status}
              </p>
              <p className="text-slate-700">{inc.description}</p>
              <button
                type="button"
                className={`mt-3 min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-bold ${mapableCareFocusRing}`}
                onClick={() => void resolveIncident(inc.id)}
              >
                Resolve & set expiry
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block flex-1 font-semibold">
            New incident description
            <input
              className={`mt-1 w-full rounded-xl border px-3 py-2 font-normal ${mapableCareFocusRing}`}
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
            />
          </label>
          <button
            type="button"
            className={`min-h-11 rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
            onClick={() => void createIncident()}
          >
            Create incident
          </button>
        </div>
      </section>

      <section aria-labelledby="gaps-heading">
        <h2 id="gaps-heading" className="text-xl font-black">
          Evidence gaps & disputed claims
        </h2>
        <ul className="mt-3 list-disc pl-5 text-slate-700">
          {data.evidenceGaps.map((g) => (
            <li key={g.id}>
              {g.featureType.replaceAll("_", " ")} — {g.notes ?? "unknown"}
            </li>
          ))}
          {data.disputedClaims.map((d) => (
            <li key={d.id}>{d.featureType.replaceAll("_", " ")} — disputed</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="coverage-ops-heading">
        <h2 id="coverage-ops-heading" className="text-xl font-black">
          Affected synthetic profiles (Access Coverage snapshot)
        </h2>
        <p className="mt-2 text-slate-700">
          Blocked {data.coverageSummary.blocked} · Unknown {data.coverageSummary.unknown} ·
          Suitable {data.coverageSummary.suitable} · With conditions{" "}
          {data.coverageSummary.suitableWithConditions} (of{" "}
          {data.coverageSummary.testedProfileCount})
        </p>
      </section>

      <section aria-labelledby="temp-route-heading">
        <h2 id="temp-route-heading" className="text-xl font-black">
          Temporary western-lift route
        </h2>
        <p className="mt-2 text-slate-700">{data.temporaryRoute.text}</p>
        {data.liveStatus?.westernLift ? (
          <p className="mt-2 text-sm text-slate-600">
            Live cascade: {data.liveStatus.westernLift.resolution} —{" "}
            {data.liveStatus.westernLift.reason}
          </p>
        ) : null}
      </section>

      {message ? (
        <p role="status" className="text-slate-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}
