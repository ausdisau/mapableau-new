"use client";

import { useEffect, useState } from "react";

import { AuditLogTable } from "@/components/mapable-agent/AuditLogTable";

type AuditRow = {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
};

export default function AgentAuditPage() {
  const [events, setEvents] = useState<AuditRow[]>([]);

  useEffect(() => {
    void fetch("/api/mapable-agent/audit")
      .then((r) => r.json())
      .then((data: { events?: AuditRow[] }) => setEvents(data.events ?? []));
  }, []);

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Agent audit log</h1>
      <AuditLogTable events={events} />
    </>
  );
}
