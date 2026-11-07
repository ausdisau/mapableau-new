import { AccessSignalsShell } from "@/components/access-signals/AccessSignalsShell";
import { PlaceholderPanel } from "@/components/access-signals/PlaceholderPanel";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Change ledger (placeholder) | Access Signals",
};

export default function AccessSignalsChangeLedgerPage() {
  return (
    <AccessSignalsShell activePath="/access-signals/change-ledger">
      <PlaceholderPanel
        title="Change ledger"
        description="A durable change ledger is not connected in this synthetic demo."
      />
    </AccessSignalsShell>
  );
}
