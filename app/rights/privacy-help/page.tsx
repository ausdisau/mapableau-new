import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";

export default async function PrivacyHelpPage() {
  await requireAuth();

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Privacy help</h2>
      <p className="text-sm text-muted-foreground">
        MapAble does not treat legal rights as identical across every data type and
        jurisdiction. A human privacy or rights officer can help you understand your
        options.
      </p>
      <ul className="space-y-3 rounded-lg border p-4 text-sm">
        <li>
          <span className="font-medium">Approve</span> — share only the fields you choose
        </li>
        <li>
          <span className="font-medium">Refuse</span> — as easy as approve; no penalty
        </li>
        <li>
          <span className="font-medium">Revoke</span> — stop future MapAble-mediated access
        </li>
        <li>
          <span className="font-medium">Export</span> — download your information where permitted
        </li>
        <li>
          <span className="font-medium">Complaint</span> — report misuse or challenge a decision
        </li>
      </ul>
      <p className="text-sm">
        Contact: <Link href="/contact" className="underline">MapAble contact</Link> or your
        organisation privacy officer.
      </p>
    </div>
  );
}
