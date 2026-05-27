export interface DataAccessLogRow {
  id: string;
  entityType: string;
  entityId: string | null;
  sensitivityLevel: string;
  accessReason: string | null;
  result: string;
  createdAt: string | Date;
  actorUser?: { name: string; email: string } | null;
}

export function DataAccessLogTable({ logs }: { logs: DataAccessLogRow[] }) {
  if (!logs.length) {
    return <p className="text-muted-foreground">No data access logs found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">Data access logs</caption>
        <thead className="bg-muted/50">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              When
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Entity
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Sensitivity
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Result
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Actor
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-t border-border">
              <td className="px-4 py-3 whitespace-nowrap">
                {new Date(log.createdAt).toLocaleString("en-AU")}
              </td>
              <td className="px-4 py-3">
                {log.entityType}
                {log.entityId ? ` (${log.entityId.slice(0, 8)}…)` : ""}
              </td>
              <td className="px-4 py-3">{log.sensitivityLevel}</td>
              <td className="px-4 py-3">{log.result}</td>
              <td className="px-4 py-3">{log.actorUser?.name ?? "System"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
