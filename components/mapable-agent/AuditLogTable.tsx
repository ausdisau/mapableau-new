export type AuditLogRow = {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
};

type AuditLogTableProps = {
  events: AuditLogRow[];
};

export function AuditLogTable({ events }: AuditLogTableProps) {
  return (
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
  );
}
