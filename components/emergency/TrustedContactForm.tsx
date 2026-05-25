"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TrustedContactForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/emergency/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, relationship, isPrimary }),
    });
    router.refresh();
    setName("");
    setPhone("");
    setRelationship("");
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-border p-4">
      <h3 className="font-medium">Add trusted contact</h3>
      <input
        required
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full min-h-10 rounded-lg border border-border px-3"
      />
      <input
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full min-h-10 rounded-lg border border-border px-3"
      />
      <input
        placeholder="Relationship"
        value={relationship}
        onChange={(e) => setRelationship(e.target.value)}
        className="w-full min-h-10 rounded-lg border border-border px-3"
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.target.checked)}
        />
        Primary contact
      </label>
      <button
        type="submit"
        className="min-h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        Add contact
      </button>
    </form>
  );
}
