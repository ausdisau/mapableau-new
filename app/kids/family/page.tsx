"use client";

import { useState } from "react";

export default function KidsFamilyPage() {
  const [nickname, setNickname] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/kids/family-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "Our family", childNickname: nickname }),
    });
  }

  return (
    <main className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="font-heading text-2xl font-bold">Family profile</h1>
      <p className="text-sm text-muted-foreground">
        Only nicknames are stored. You control what is shared.
      </p>
      <form onSubmit={save} className="space-y-3">
        <label htmlFor="nick" className="block text-sm font-medium">
          Child nickname (not full name)
        </label>
        <input
          id="nick"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="min-h-11 w-full rounded border px-3"
        />
        <button type="submit" className="min-h-11 rounded bg-primary px-4 text-primary-foreground">
          Save
        </button>
      </form>
    </main>
  );
}
