"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";

export function ModerationActionPanel({
  queueId,
  entityType,
  flagReason,
  preview,
}: {
  queueId: string;
  entityType: string;
  flagReason?: string | null;
  preview?: string | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function decide(status: "approved" | "rejected" | "hidden" | "needs_changes") {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/access/moderation/${queueId}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes: notes || undefined }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? "Action failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <p className="font-medium">{entityType}</p>
      {flagReason ? (
        <p className="text-sm text-muted-foreground">{flagReason}</p>
      ) : null}
      {preview ? <p className="text-sm line-clamp-4">{preview}</p> : null}

      <AccessibleFormField id={`notes-${queueId}`} label="Moderator notes">
        <textarea
          id={`notes-${queueId}`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={formInputClass}
        />
      </AccessibleFormField>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="default"
          disabled={loading}
          onClick={() => decide("approved")}
        >
          Approve
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => decide("needs_changes")}
        >
          Needs changes
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => decide("hidden")}
        >
          Hide
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={loading}
          onClick={() => decide("rejected")}
        >
          Reject
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
