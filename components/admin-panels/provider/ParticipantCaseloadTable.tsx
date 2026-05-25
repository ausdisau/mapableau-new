import { PanelSection } from "@/components/admin-panels/PanelSection";

type Row = {
  userId: string;
  displayName: string;
  user: { name: string; email: string };
};

export function ParticipantCaseloadTable({ rows }: { rows: Row[] }) {
  return (
    <PanelSection title="Participant caseload">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-4 font-semibold">Name</th>
              <th className="py-2 pr-4 font-semibold">Contact</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.userId} className="border-b border-border/60">
                <td className="py-3 pr-4">{r.displayName}</td>
                <td className="py-3 pr-4 text-muted-foreground">{r.user.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="py-4 text-muted-foreground">No participants in caseload yet.</p>
        ) : null}
      </div>
    </PanelSection>
  );
}
