"use client";

import { useState } from "react";

export function FeatureFlagEditor({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, name, description, enabled: false }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Could not create flag");
        return;
      }
      setKey("");
      setName("");
      setDescription("");
      onCreated?.();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-border p-4" aria-labelledby="ff-create-heading">
      <h2 id="ff-create-heading" className="font-heading text-lg font-semibold">
        Create feature flag
      </h2>
      {error ? (
        <div role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm">
          {error}
        </div>
      ) : null}
      <label className="block">
        <span className="text-sm font-medium">Key</span>
        <input
          required
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="mt-1 min-h-11 w-full rounded-lg border border-input px-3"
          placeholder="service_recovery_enabled"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Name</span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 min-h-11 w-full rounded-lg border border-input px-3"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 min-h-24 w-full rounded-lg border border-input px-3"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create flag"}
      </button>
    </form>
  );
}
