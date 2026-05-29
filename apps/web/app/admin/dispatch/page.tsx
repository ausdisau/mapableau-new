import { requireAdmin } from "@/lib/auth/guards";
import { syncOperationalQueues } from "@/lib/dispatch-console/dispatch-service";

export default async function DispatchConsolePage() {
  const user = await requireAdmin();
  const queues = await syncOperationalQueues(user.id);
  const list = Array.isArray(queues) ? queues : [];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Dispatch console</h1>
      <p className="text-muted-foreground">
        Operational queues for care, transport and critical incidents. Human
        dispatch required — not autonomous assignment.
      </p>
      <table className="w-full text-sm">
        <caption className="sr-only">Open dispatch queue items</caption>
        <thead>
          <tr>
            <th scope="col">Priority</th>
            <th scope="col">Type</th>
            <th scope="col">Summary</th>
          </tr>
        </thead>
        <tbody>
          {list.map((q) => (
            <tr key={q.id} className="border-t">
              <td>{q.priority}</td>
              <td>{q.queueType.replace(/_/g, " ")}</td>
              <td>{q.plainLanguageSummary ?? q.title}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
