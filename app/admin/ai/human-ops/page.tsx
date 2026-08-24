import { HumanOpsConsole } from "@/components/admin/ai/HumanOpsConsole";
import { requireAdminOpsAccess } from "@/lib/auth/guards";
import { isHumanOperationsConsoleEnabled } from "@/lib/config/human-operations";

export const metadata = {
  title: "Human Operations Console | MapAble Admin",
};

export default async function AdminHumanOpsPage() {
  await requireAdminOpsAccess();

  if (!isHumanOperationsConsoleEnabled()) {
    return (
      <div className="space-y-3 p-4 sm:p-6">
        <h1 className="font-heading text-2xl font-bold">
          Human Operations Console
        </h1>
        <p className="text-muted-foreground" role="status">
          Disabled. Set{" "}
          <code>MAPABLE_HUMAN_OPERATIONS_CONSOLE_ENABLED=true</code> to enable
          (fail-closed; not for production without review).
        </p>
      </div>
    );
  }

  return <HumanOpsConsole />;
}
