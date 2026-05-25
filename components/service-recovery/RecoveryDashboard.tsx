import { RecoveryCaseCard } from "./RecoveryCaseCard";

type Case = {
  id: string;
  summary: string;
  status: string;
  trigger: string;
  createdAt: Date;
};

export function RecoveryDashboard({ cases }: { cases: Case[] }) {
  if (!cases.length) {
    return (
      <p className="rounded-lg border border-border p-4 text-muted-foreground">
        No active recovery cases. If a booking is disrupted, options will appear here.
      </p>
    );
  }

  return (
    <ul className="space-y-3" aria-label="Recovery cases">
      {cases.map((c) => (
        <li key={c.id}>
          <RecoveryCaseCard caseRecord={c} />
        </li>
      ))}
    </ul>
  );
}
