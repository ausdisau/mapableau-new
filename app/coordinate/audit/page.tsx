"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  coordinateFetch,
  participantQuery,
} from "@/components/coordinate/coordinate-client";
import { AuditTrail } from "@/components/coordinate/AuditTrail";
import { CoordinatePageHeader } from "@/components/coordinate/CoordinateShell";

export default function CoordinateAuditPage() {
  const searchParams = useSearchParams();
  const participantId = searchParams.get("participantId");
  const query = participantQuery(participantId);

  const [events, setEvents] = useState<
    Array<{
      id: string;
      action: string;
      createdAt: string;
      actorUser?: { name?: string | null } | null;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await coordinateFetch<{ events: typeof events }>(
        `/api/coordinate/audit${query}`,
      );
      setEvents(res.events);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <CoordinatePageHeader title="Activity log" />
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      <AuditTrail events={events} />
    </div>
  );
}
