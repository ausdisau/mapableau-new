import { CapacityDeclarationForm } from "@/components/provider-capacity/CapacityDeclarationForm";
import { CapacityExchangeDashboard } from "@/components/provider-capacity/CapacityExchangeDashboard";

export default function ProviderCapacityPage() {
  return (
    <div className="space-y-8 p-4">
      <h1 className="font-heading text-2xl font-bold">Capacity exchange</h1>
      <CapacityDeclarationForm />
      <CapacityExchangeDashboard />
    </div>
  );
}
