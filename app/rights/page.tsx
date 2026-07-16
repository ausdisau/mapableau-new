import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { listPurposes } from "@/lib/rights-os/purpose-registry";

export default async function RightsOverviewPage() {
  await requireAuth();
  const purposes = listPurposes().slice(0, 6);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border p-4">
        <h2 className="font-heading text-lg font-semibold">Your rights tools</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          <li>
            <Link href="/rights/active-access" className="block rounded-md border p-3 hover:bg-muted">
              <span className="font-medium">Active access</span>
              <p className="text-sm text-muted-foreground">
                See who currently has permission to use your information.
              </p>
            </Link>
          </li>
          <li>
            <Link href="/rights/history" className="block rounded-md border p-3 hover:bg-muted">
              <span className="font-medium">History</span>
              <p className="text-sm text-muted-foreground">
                Review past disclosures and policy decisions.
              </p>
            </Link>
          </li>
          <li>
            <Link href="/rights/requests" className="block rounded-md border p-3 hover:bg-muted">
              <span className="font-medium">Rights requests</span>
              <p className="text-sm text-muted-foreground">
                Access, correct, export, or delete your information where permitted.
              </p>
            </Link>
          </li>
          <li>
            <Link href="/rights/privacy-help" className="block rounded-md border p-3 hover:bg-muted">
              <span className="font-medium">Privacy help</span>
              <p className="text-sm text-muted-foreground">
                Contact a human privacy or rights officer.
              </p>
            </Link>
          </li>
        </ul>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="font-heading text-lg font-semibold">Registered purposes</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          MapAble only shares information for specific registered purposes.
        </p>
        <ul className="mt-3 divide-y rounded-lg border">
          {purposes.map((p) => (
            <li key={p.code} className="p-3">
              <p className="font-medium">{p.code}</p>
              <p className="text-sm text-muted-foreground">{p.description}</p>
            </li>
          ))}
        </ul>
        <Link href="/rights/purposes" className="mt-3 inline-block text-sm underline">
          View all purposes
        </Link>
      </section>
    </div>
  );
}
