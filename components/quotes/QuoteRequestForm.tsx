"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function QuoteRequestForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [quoteType, setQuoteType] = useState("care_package");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, quoteType }),
    });
    if (res.ok) router.push("/quotes");
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block text-sm">
        Title
        <input required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border px-3" />
      </label>
      <label className="block text-sm">
        Quote type
        <select value={quoteType} onChange={(e) => setQuoteType(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border px-3">
          <option value="care_package">Care package</option>
          <option value="home_modification">Home modification</option>
          <option value="accessible_transport">Accessible transport</option>
        </select>
      </label>
      <button type="submit" className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground">
        Create request
      </button>
    </form>
  );
}
