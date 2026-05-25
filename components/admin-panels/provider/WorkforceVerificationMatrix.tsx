import { PanelSection } from "@/components/admin-panels/PanelSection";

type Worker = {
  id: string;
  displayName: string;
  workerScreeningStatus: string;
  wwccStatus: string;
  firstAidStatus: string;
  matchEligible: boolean;
};

export function WorkforceVerificationMatrix({ workers }: { workers: Worker[] }) {
  return (
    <PanelSection title="Workforce verification">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-3">Worker</th>
              <th className="py-2 pr-3">Screening</th>
              <th className="py-2 pr-3">WWCC</th>
              <th className="py-2 pr-3">First aid</th>
              <th className="py-2">Match</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w) => (
              <tr key={w.id} className="border-b border-border/60">
                <td className="py-2 pr-3 font-medium">{w.displayName}</td>
                <td className="py-2 pr-3">{w.workerScreeningStatus}</td>
                <td className="py-2 pr-3">{w.wwccStatus}</td>
                <td className="py-2 pr-3">{w.firstAidStatus}</td>
                <td className="py-2">{w.matchEligible ? "Eligible" : "Blocked"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PanelSection>
  );
}
