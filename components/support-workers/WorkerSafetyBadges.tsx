import type { WorkerSafetyBadge } from "@/types/support-workers";

export function WorkerSafetyBadges({ badges }: { badges: WorkerSafetyBadge[] }) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Worker safety and verification">
      {badges.map((b) => (
        <li
          key={b.code}
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
        >
          <span aria-hidden="true">
            {b.status === "ok" ? "✓" : b.status === "caution" ? "!" : "?"}
          </span>
          <span>{b.label}</span>
          <span className="sr-only">
            {b.status === "ok"
              ? "Status OK"
              : b.status === "caution"
                ? "Needs attention"
                : "Status unknown"}
          </span>
        </li>
      ))}
    </ul>
  );
}
