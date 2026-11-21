import { AccessSignalsShell } from "@/components/access-signals/AccessSignalsShell";
import { PlaceholderPanel } from "@/components/access-signals/PlaceholderPanel";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Change history — not connected | Access Signals",
};

export default function AccessSignalsChangeLedgerPage() {
  return (
    <AccessSignalsShell activePath="/access-signals/change-ledger">
      <PlaceholderPanel
        title="Change ledger"
        description="No verified change history is connected here. A future ledger would record dated updates, sources and human review; this screen cannot create an entry."
      />
    </AccessSignalsShell>
  );
}
