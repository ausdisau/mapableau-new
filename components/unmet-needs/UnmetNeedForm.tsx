"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UnmetNeedForm() {
  const router = useRouter();
  const [needType, setNeedType] = useState("no_provider_found");
  const [description, setDescription] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/unmet-needs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ needType, description }),
    });
    router.push("/unmet-needs");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm">
        What couldn&apos;t you find?
        <select value={needType} onChange={(e) => setNeedType(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border px-3">
          <option value="no_provider_found">No suitable provider</option>
          <option value="no_accessible_transport">No accessible transport</option>
          <option value="wait_time_too_long">Wait time too long</option>
        </select>
      </label>
      <label className="block text-sm">
        Tell us more (optional)
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 min-h-24 w-full rounded-lg border px-3" />
      </label>
      <button type="submit" className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground">
        Save
      </button>
    </form>
  );
}
