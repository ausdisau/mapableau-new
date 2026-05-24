"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewItineraryPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/tourism/itineraries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/tourism/itinerary/${data.itinerary.id}`);
    }
  }

  return (
    <main className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="font-heading text-2xl font-bold">New itinerary</h1>
      <form onSubmit={create} className="space-y-3">
        <input
          aria-label="Itinerary title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="min-h-11 w-full rounded border px-3"
          placeholder="Weekend in Melbourne"
        />
        <button type="submit" className="min-h-11 rounded bg-primary px-4 text-primary-foreground">
          Create
        </button>
      </form>
    </main>
  );
}
