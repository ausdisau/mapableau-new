"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type PilotListItem = { id: string; name: string; status: string; fictionalWarning: string };

type PilotDetail = {
  id: string;
  name: string;
  fictionalWarning: string;
  organisations: Array<{ id: string; name: string; type: string }>;
  cohorts: Array<{ id: string; name: string; size: number; consentComplete: number }>;
  journeys: Array<{
    id: string;
    predictedStatus: string;
    observedStatus: string;
    abandoned: boolean;
    planningMinutes: number;
    reportedConfidence: number;
  }>;
  learning: Record<string, number>;
  evidenceQuality: Record<string, number>;
  venueOps: Record<string, number>;
  safetyGates: Array<{ id: string; label: string; status: string; note: string }>;
};

export function PilotConsoleClient({ pilotId }: { pilotId?: string }) {
  const [list, setList] = useState<PilotListItem[]>([]);
  const [detail, setDetail] = useState<PilotDetail | null>(null);
  const [exportJson, setExportJson] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/access-intelligence/pilots")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setList(data.pilots ?? []);
      });
  }, []);

  useEffect(() => {
    const id = pilotId ?? list[0]?.id;
    if (!id) return;
    void fetch(`/api/access-intelligence/pilots?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setDetail(data);
      });
  }, [pilotId, list]);

  async function runExport() {
    if (!detail) return;
    const res = await fetch(
      `/api/access-intelligence/pilots?export=${encodeURIComponent(detail.id)}`,
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setExportJson(JSON.stringify(data, null, 2));
  }

  return (
    <div className="space-y-8">
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
        {detail?.fictionalWarning ??
          "All pilot metrics are synthetic demonstration data. Do not claim research validity."}
      </p>
      {error ? (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      ) : null}

      <section>
        <h2 className="text-xl font-black">Pilots</h2>
        <ul className="mt-2 space-y-2">
          {list.map((p) => (
            <li key={p.id}>
              <Link
                href={`/access-intelligence/pilots/${p.id}`}
                className={`font-bold text-[#005B7F] ${mapableCareFocusRing}`}
              >
                {p.name}
              </Link>{" "}
              <span className="text-sm text-slate-500">({p.status})</span>
            </li>
          ))}
        </ul>
      </section>

      {detail ? (
        <>
          <section>
            <h2 className="text-xl font-black">Organisations & cohorts</h2>
            <ul className="mt-2 list-disc pl-5 text-sm">
              {detail.organisations.map((o) => (
                <li key={o.id}>
                  {o.name} · {o.type}
                </li>
              ))}
              {detail.cohorts.map((c) => (
                <li key={c.id}>
                  Cohort {c.name}: {c.size} (consent {c.consentComplete}/{c.size})
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black">Predicted vs observed journeys</h2>
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <caption className="sr-only">Synthetic journey outcomes</caption>
                <thead>
                  <tr>
                    <th scope="col" className="px-2 py-1">
                      ID
                    </th>
                    <th scope="col" className="px-2 py-1">
                      Predicted
                    </th>
                    <th scope="col" className="px-2 py-1">
                      Observed
                    </th>
                    <th scope="col" className="px-2 py-1">
                      Confidence
                    </th>
                    <th scope="col" className="px-2 py-1">
                      Minutes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detail.journeys.map((j) => (
                    <tr key={j.id} className="border-t">
                      <td className="px-2 py-1">{j.id}</td>
                      <td className="px-2 py-1">{j.predictedStatus}</td>
                      <td className="px-2 py-1">{j.observedStatus}</td>
                      <td className="px-2 py-1">{j.reportedConfidence}%</td>
                      <td className="px-2 py-1">{j.planningMinutes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3 text-sm">
            <div className="rounded-xl border p-4">
              <h3 className="font-black">Learning</h3>
              <ul className="mt-2 space-y-1">
                {Object.entries(detail.learning).map(([k, v]) => (
                  <li key={k}>
                    {k}: {(v * 100).toFixed(0)}%
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border p-4">
              <h3 className="font-black">Evidence quality</h3>
              <ul className="mt-2 space-y-1">
                {Object.entries(detail.evidenceQuality).map(([k, v]) => (
                  <li key={k}>
                    {k}: {typeof v === "number" && v <= 1 ? `${(v * 100).toFixed(0)}%` : v}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border p-4">
              <h3 className="font-black">Venue ops</h3>
              <ul className="mt-2 space-y-1">
                {Object.entries(detail.venueOps).map(([k, v]) => (
                  <li key={k}>
                    {k}: {v}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-black">Safety gates</h2>
            <ul className="mt-2 space-y-2">
              {detail.safetyGates.map((g) => (
                <li key={g.id} className="rounded-lg border p-3 text-sm">
                  <span className="font-black">{g.label}</span> — {g.status}
                  <p className="text-slate-600">{g.note}</p>
                </li>
              ))}
            </ul>
          </section>

          <button
            type="button"
            className={`min-h-11 rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
            onClick={() => void runExport()}
          >
            Export de-identified dataset
          </button>
          {exportJson ? (
            <pre className="max-h-80 overflow-auto rounded-xl border bg-slate-50 p-3 text-xs">
              {exportJson}
            </pre>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
