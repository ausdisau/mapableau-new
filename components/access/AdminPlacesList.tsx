"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminPlacesList({
  places,
}: {
  places: {
    id: string;
    name: string;
    category: string;
    status: string;
    suburb?: string | null;
    reviewCount: number;
    alertCount: number;
    updatedAt: string;
  }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function updateStatus(placeId: string, status: string) {
    setBusy(placeId);
    await fetch("/api/admin/access/places", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId, status }),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2" scope="col">
              Name
            </th>
            <th className="p-2" scope="col">
              Status
            </th>
            <th className="p-2" scope="col">
              Reports
            </th>
            <th className="p-2" scope="col">
              Alerts
            </th>
            <th className="p-2" scope="col">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {places.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="p-2">
                <a href={`/access/places/${p.id}`} className="underline">
                  {p.name}
                </a>
                <p className="text-muted-foreground capitalize">
                  {p.category.replace(/_/g, " ")}
                  {p.suburb ? ` · ${p.suburb}` : ""}
                </p>
              </td>
              <td className="p-2">{p.status.replace(/_/g, " ")}</td>
              <td className="p-2">{p.reviewCount}</td>
              <td className="p-2">{p.alertCount}</td>
              <td className="p-2">
                <div className="flex flex-wrap gap-2">
                  {p.status !== "published" ? (
                    <button
                      type="button"
                      className="min-h-11 rounded-lg border px-3"
                      disabled={busy === p.id}
                      onClick={() => updateStatus(p.id, "published")}
                    >
                      Publish
                    </button>
                  ) : null}
                  {p.status !== "hidden" ? (
                    <button
                      type="button"
                      className="min-h-11 rounded-lg border px-3"
                      disabled={busy === p.id}
                      onClick={() => updateStatus(p.id, "hidden")}
                    >
                      Hide
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
