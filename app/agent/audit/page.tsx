"use client";

import { useEffect, useState } from "react";

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
      <table className="mt-6 w-full text-left text-sm">
        <caption className="sr-only">MapAble Agent audit events</caption>
        <thead>
          <tr className="border-b border-slate-200">
            <th scope="col" className="py-2 pr-4">
              Action
            </th>
            <th scope="col" className="py-2 pr-4">
              Entity
            </th>
            <th scope="col" className="py-2">
              When
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id} className="border-b border-slate-100">
              <td className="py-2 pr-4 font-mono text-xs">{e.action}</td>
              <td className="py-2 pr-4">{e.entityType}</td>
              <td className="py-2">{new Date(e.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
