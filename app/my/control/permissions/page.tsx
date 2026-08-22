import Link from "next/link";

import { listConsentTimeline } from "@/lib/consent/consent-receipt-service";
import { requirePersonalAgencyGate } from "@/lib/personal-agency/gates";

export const metadata = { title: "Permissions | My MapAble" };

export default async function MyPermissionsPage() {
  const user = await requirePersonalAgencyGate();
  const receipts = await listConsentTimeline(user.id, user.id).catch(() => []);

  return (
    <div className="space-y-6">
      <header>
        <Link href="/my/control" className="text-sm font-semibold text-[#005B7F]">
          ← Privacy & control
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Permissions</h1>
        <p className="mt-2 text-muted-foreground">
          Consent and permission history for your account.
        </p>
      </header>
      {receipts.length ? (
        <ul className="space-y-3">
          {receipts.slice(0, 20).map((receipt) => (
            <li key={receipt.id} className="rounded-lg border border-slate-200 px-4 py-3 text-sm">
              <p className="font-semibold">{receipt.scope}</p>
              <p className="text-slate-600">{receipt.purpose}</p>
              <p className="text-xs text-slate-500">
                {new Date(receipt.createdAt).toLocaleString("en-AU")}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
          No permission history recorded yet.
        </p>
      )}
    </div>
  );
}
