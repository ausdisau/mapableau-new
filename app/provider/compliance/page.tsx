import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";

export default async function ProviderCompliancePage() {
  await requirePermission("organisation:manage");

  return (
    <div className="space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">Compliance</h1>
      <p className="max-w-2xl text-muted-foreground">
        Upload and track verification documents. Changes are recorded in the audit
        log for your organisation.
      </p>
      <nav aria-label="Compliance sections">
        <ul className="flex flex-col gap-2">
          <li>
            <Link className="text-primary underline" href="/provider/documents">
              Documents
            </Link>
          </li>
          <li>
            <Link className="text-primary underline" href="/provider/onboarding">
              Onboarding checklist
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
