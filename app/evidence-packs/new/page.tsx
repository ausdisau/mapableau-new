"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewEvidencePackPage() {
  const router = useRouter();
  const [title, setTitle] = useState("Plan review evidence");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/evidence-packs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, packType: "ndis_plan_review" }),
    });
    if (res.ok) {
      const { pack } = await res.json();
      router.push(`/evidence-packs/${pack.id}`);
    }
  }

  return (
    <div className="mx-auto max-w-xl p-4">
      <h1 className="font-heading text-2xl font-bold">New evidence pack</h1>
      <form onSubmit={create} className="mt-6 space-y-4">
        <label className="block text-sm">
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border px-3" />
        </label>
        <button type="submit" className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground">
          Create
        </button>
      </form>
    </div>
  );
}
