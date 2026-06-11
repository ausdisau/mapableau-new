"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  coordinateFetch,
  participantQuery,
} from "@/components/coordinate/coordinate-client";
import { CommunicationDraftPanel } from "@/components/coordinate/CommunicationDraftPanel";
import { CoordinatePageHeader } from "@/components/coordinate/CoordinateShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CoordinateMessagesPage() {
  const searchParams = useSearchParams();
  const participantId = searchParams.get("participantId");
  const query = participantQuery(participantId);

  const [drafts, setDrafts] = useState<
    Array<{
      id: string;
      channel: string;
      subject?: string | null;
      body: string;
      plainLanguageBody?: string | null;
      status: string;
      confidence?: number | null;
      reason?: string | null;
    }>
  >([]);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await coordinateFetch<{ drafts: typeof drafts }>(
        `/api/coordinate/communications${query}`,
      );
      setDrafts(res.drafts);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <CoordinatePageHeader
        title="Messages"
        description="Draft and approve messages. MapAble never sends them for you."
      />
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium" htmlFor="draft-topic">
            New draft topic
          </label>
          <Input
            id="draft-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Check-in about community activities"
            className="min-h-11"
          />
        </div>
        <Button
          variant="default"
          size="default"
          className="min-h-11"
          disabled={creating || !topic.trim()}
          onClick={async () => {
            setCreating(true);
            try {
              await coordinateFetch(`/api/coordinate/communications${query}`, {
                method: "POST",
                body: JSON.stringify({
                  participantId,
                  channel: "email",
                  topic,
                }),
              });
              setTopic("");
              await load();
            } finally {
              setCreating(false);
            }
          }}
        >
          {creating ? "Drafting…" : "Create AI draft"}
        </Button>
      </div>

      <CommunicationDraftPanel
        drafts={drafts}
        onApprove={async (draftId) => {
          await coordinateFetch(`/api/coordinate/communications/${draftId}${query}`, {
            method: "PATCH",
            body: JSON.stringify({ participantId, action: "approve" }),
          });
          await load();
        }}
        onUpdate={async (draftId, data) => {
          await coordinateFetch(`/api/coordinate/communications/${draftId}${query}`, {
            method: "PATCH",
            body: JSON.stringify({ participantId, action: "update", ...data }),
          });
          await load();
        }}
      />
    </div>
  );
}
