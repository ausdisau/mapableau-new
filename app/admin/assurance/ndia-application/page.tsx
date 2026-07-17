import Link from "next/link";

import { listNdiaDigitalPartnershipApplications } from "@/lib/assurance/ndia-application/digital-partnership-service";
import { requireAdmin } from "@/lib/auth/guards";

export default async function NdiaApplicationPage() {
  await requireAdmin();
  const applications = await listNdiaDigitalPartnershipApplications();

  return (
    <div className="space-y-6">
      <p>
        <Link className="underline" href="/admin/assurance">
          Back to assurance
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">NDIA digital partnership</h1>
      <p className="text-sm">
        Tracks application state only. myID/RAM credentials are never stored here.
      </p>
      <ul className="space-y-3">
        {applications.map((app) => (
          <li key={app.id} className="border-b py-2">
            <div className="font-medium">{app.status}</div>
            <div className="text-sm">
              myID configured flag: {app.myIdConfigured ? "yes" : "no"} · RAM flag:{" "}
              {app.ramConfigured ? "yes" : "no"} · credentials present flag:{" "}
              {app.credentialsPresent ? "yes" : "no"}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
