"use client";

import { useState } from "react";

import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";
import { FUNDING_DISCLAIMER } from "@/lib/home-modifications/home-modification-service";

export function HomeModificationRequestForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/home-modifications/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Request submitted. You control who sees photos and documents.");
      window.location.href = `/home-modifications/projects/${data.request.projects?.[0]?.id ?? ""}`;
    } else {
      setError(data.error ?? "Could not submit request");
    }
  }

  return (
    <MapAbleCard title="Home modification request">
      <p className="mb-4 text-sm text-muted-foreground">{FUNDING_DISCLAIMER}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">{error}</div> : null}
        {message ? <div role="status" aria-live="polite" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm">{message}</div> : null}
        <div>
          <label htmlFor="hm-title" className="block text-sm font-medium">Project title</label>
          <input id="hm-title" required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full min-h-11 rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label htmlFor="hm-desc" className="block text-sm font-medium">What needs to change?</label>
          <textarea id="hm-desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <button type="submit" className="min-h-11 rounded-lg bg-primary px-4 py-2 text-primary-foreground">Submit request</button>
      </form>
    </MapAbleCard>
  );
}
