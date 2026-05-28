import { DispatchConsole } from "@/components/admin/DispatchConsole";
import { requireAdmin } from "@/lib/auth/guards";

export default async function DispatchConsolePage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Dispatch console</h1>
        <p className="text-muted-foreground">
          Operational queues for care allocation, transport planning, dispatch,
          and critical incidents.
        </p>
      </header>
      <DispatchConsole />
    </div>
  );
}
