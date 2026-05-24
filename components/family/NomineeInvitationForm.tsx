"use client";

import { useState } from "react";

import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";

const DEFAULT_SCOPES = ["view_dashboard", "view_bookings", "approve_invoice"];

export function NomineeInvitationForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const res = await fetch("/api/family/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nomineeEmail: email,
        nomineeName: name,
        relationship,
        scopes: DEFAULT_SCOPES,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Invitation sent. The supporter can now access granted permissions.");
      setEmail("");
      setName("");
    } else {
      setError(data.error ?? "Could not send invitation");
    }
  }

  return (
    <MapAbleCard title="Invite family supporter">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
            {error}
          </div>
        ) : null}
        {message ? (
          <div role="status" aria-live="polite" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
            {message}
          </div>
        ) : null}
        <div>
          <label htmlFor="nominee-name" className="block text-sm font-medium">Name</label>
          <input id="nominee-name" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full min-h-11 rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label htmlFor="nominee-email" className="block text-sm font-medium">Email</label>
          <input id="nominee-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full min-h-11 rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label htmlFor="relationship" className="block text-sm font-medium">Relationship</label>
          <input id="relationship" value={relationship} onChange={(e) => setRelationship(e.target.value)} className="mt-1 w-full min-h-11 rounded-lg border px-3 py-2" />
        </div>
        <button type="submit" className="min-h-11 rounded-lg bg-primary px-4 py-2 text-primary-foreground">
          Send invitation
        </button>
      </form>
    </MapAbleCard>
  );
}
