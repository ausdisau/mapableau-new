import { SafetyReportForm } from "@/components/transport-mvp/SafetyReportForm";

export default function DriverReportIssuePage() {
  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold">Report a safety issue</h2>
      <p className="text-sm text-muted-foreground">
        Critical reports are escalated to the MapAble support desk. This is not an NDIS claim
        submission.
      </p>
      <SafetyReportForm />
    </div>
  );
}
