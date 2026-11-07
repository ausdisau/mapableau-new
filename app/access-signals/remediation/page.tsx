import { AccessSignalsShell } from "@/components/access-signals/AccessSignalsShell";
import { RemediationWorkspace } from "@/components/access-signals/RemediationWorkspace";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Remediation workspace (synthetic demo) | MapAble Access Signals",
};

export default function AccessSignalsRemediationPage() {
  return (
    <AccessSignalsShell activePath="/access-signals/remediation">
      <RemediationWorkspace />
    </AccessSignalsShell>
  );
}
