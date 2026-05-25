import { SafetyEscalationPanel } from "@/components/peer";

export default function AdminPeerSafetyPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Peer safety</h1>
      <SafetyEscalationPanel />
    </div>
  );
}
