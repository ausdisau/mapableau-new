import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";

export function WwcVerificationQueue({
  items,
}: {
  items: {
    id: string;
    status: string;
    jurisdiction: string;
    checkType: string;
    updatedAt: Date | string;
    workerProfile: { displayName: string };
    organisation: { name: string };
  }[];
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No WWC verifications in queue.</p>;
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {items.map((item) => (
        <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
          <div>
            <Link
              href={`/admin/verification/wwc/${item.id}`}
              className="font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.workerProfile.displayName}
            </Link>
            <p className="text-sm text-muted-foreground">
              {item.organisation.name} · {item.jurisdiction} ·{" "}
              {item.checkType.replace(/_/g, " ")}
            </p>
          </div>
          <StatusBadge status={item.status} />
        </li>
      ))}
    </ul>
  );
}
