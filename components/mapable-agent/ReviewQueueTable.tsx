import { Button } from "@/components/ui/button";

export type ReviewTaskRow = {
  id: string;
  title: string;
  summary: string;
  category: string;
  priority: string;
  status: string;
};

type ReviewQueueTableProps = {
  tasks: ReviewTaskRow[];
  onApprove: (id: string) => void;
};

export function ReviewQueueTable({ tasks, onApprove }: ReviewQueueTableProps) {
  return (
    <ul className="mt-6 space-y-4" aria-label="Pending review tasks">
      {tasks.map((task) => (
        <li key={task.id} className="rounded-xl border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900">{task.title}</h2>
          <p className="mt-1 text-slate-700">{task.summary}</p>
          <p className="mt-2 text-sm text-slate-500">
            {task.category} · {task.priority}
          </p>
          <Button
            type="button"
            variant="default"
            size="default"
            className="mt-3 min-h-11 touch-manipulation"
            onClick={() => onApprove(task.id)}
          >
            Approve for staff follow-up
          </Button>
        </li>
      ))}
      {tasks.length === 0 ? (
        <li role="status" className="text-slate-600">
          No pending reviews.
        </li>
      ) : null}
    </ul>
  );
}
