import { PanelSection } from "@/components/admin-panels/PanelSection";

type Job = {
  id: string;
  title: string;
  status: string;
  participant: { name: string };
};

export function JobAndReferralQueue({ jobs }: { jobs: Job[] }) {
  return (
    <PanelSection title="Jobs & referrals">
      <ul className="space-y-2">
        {jobs.map((j) => (
          <li key={j.id} className="rounded-lg border border-border px-3 py-2 text-sm">
            <span className="font-medium">{j.title}</span>
            <span className="text-muted-foreground"> · {j.participant.name}</span>
          </li>
        ))}
      </ul>
      {jobs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No open job posts.</p>
      ) : null}
    </PanelSection>
  );
}
