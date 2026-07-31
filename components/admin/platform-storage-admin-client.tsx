"use client";

import { useMemo, useState } from "react";

type StorageObject = {
  key: string;
  size: number;
  contentType: string;
  updatedAt: string;
};

type MaintenanceResult = {
  backend: string;
  scanned: number;
  deleted: number;
  skipped: number;
  cutoffIso: string;
};

export function PlatformStorageAdminClient() {
  const [prefix, setPrefix] = useState("quotes");
  const [objects, setObjects] = useState<StorageObject[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingCron, setLoadingCron] = useState(false);
  const [retentionHours, setRetentionHours] = useState(24 * 14);
  const [dryRun, setDryRun] = useState(true);
  const [maintenance, setMaintenance] = useState<MaintenanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalSize = useMemo(
    () => objects.reduce((sum, object) => sum + object.size, 0),
    [objects],
  );

  const refresh = async () => {
    setLoadingList(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/platform/storage?prefix=${encodeURIComponent(prefix)}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to fetch objects");
      setObjects(json.objects ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoadingList(false);
    }
  };

  const runMaintenance = async () => {
    setLoadingCron(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/platform/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retentionHours, dryRun }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Maintenance run failed");
      setMaintenance(json.result);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoadingCron(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 p-4">
        <h2 className="text-lg font-semibold">Storage browser</h2>
        <p className="text-sm text-slate-600">
          List objects under a prefix in platform storage.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={prefix}
            onChange={(event) => setPrefix(event.target.value)}
            placeholder="prefix (e.g. quotes)"
          />
          <button
            className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-60"
            onClick={refresh}
            disabled={loadingList}
          >
            {loadingList ? "Loading..." : "Load objects"}
          </button>
        </div>

        <div className="mt-3 text-sm text-slate-700">
          {objects.length} object(s), total {totalSize} bytes
        </div>

        <div className="mt-3 overflow-auto rounded border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2">Key</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Size</th>
                <th className="px-3 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {objects.map((object) => (
                <tr key={object.key} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono text-xs">{object.key}</td>
                  <td className="px-3 py-2">{object.contentType}</td>
                  <td className="px-3 py-2">{object.size}</td>
                  <td className="px-3 py-2">
                    {new Date(object.updatedAt).toLocaleString("en-AU")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 p-4">
        <h2 className="text-lg font-semibold">Storage maintenance</h2>
        <p className="text-sm text-slate-600">
          Trigger stale-object cleanup (same logic as cron endpoint).
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="text-sm">
            Retention hours
            <input
              className="ml-2 w-24 rounded border border-slate-300 px-2 py-1"
              type="number"
              value={retentionHours}
              onChange={(event) => setRetentionHours(Number(event.target.value) || 0)}
            />
          </label>
          <label className="text-sm">
            <input
              className="mr-2"
              type="checkbox"
              checked={dryRun}
              onChange={(event) => setDryRun(event.target.checked)}
            />
            Dry run
          </label>
          <button
            className="rounded bg-emerald-700 px-3 py-2 text-sm text-white disabled:opacity-60"
            onClick={runMaintenance}
            disabled={loadingCron}
          >
            {loadingCron ? "Running..." : "Run maintenance"}
          </button>
        </div>

        {maintenance ? (
          <div className="mt-3 rounded bg-slate-50 p-3 text-sm text-slate-700">
            <div>Backend: {maintenance.backend}</div>
            <div>Scanned: {maintenance.scanned}</div>
            <div>Deleted: {maintenance.deleted}</div>
            <div>Skipped: {maintenance.skipped}</div>
            <div>Cutoff: {new Date(maintenance.cutoffIso).toLocaleString("en-AU")}</div>
          </div>
        ) : null}
      </section>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
