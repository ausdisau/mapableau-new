import Link from "next/link";
import { redirect } from "next/navigation";

import { listPeopleWithAccess } from "@/lib/authority/authority-decision-service";
import { personalAgencyFlags } from "@/lib/config/personal-agency";
import { AGENCY_CAN, AGENCY_MUST_ASK } from "@/lib/personal-agency/agency-copy";
import { requirePersonalAgencyGate } from "@/lib/personal-agency/gates";


export const metadata = { title: "Privacy & control | My MapAble" };

export default async function MyControlPage() {
  if (!personalAgencyFlags.agencyControlEnabled) redirect("/my");
  const user = await requirePersonalAgencyGate();

  const people = await listPeopleWithAccess(user.id).catch(() => []);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold">Privacy & control</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          See what MapAble may do, what requires your approval, and who has access.
        </p>
      </header>

      <section aria-labelledby="assistant-policy" className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 id="assistant-policy" className="text-lg font-bold">
          MapAble Assistant
        </h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-bold uppercase text-[#005B7F]">Can</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {AGENCY_CAN.map((item) => (
                <li key={item}>✓ {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase text-[#B45309]">Must ask before</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {AGENCY_MUST_ASK.map((item) => (
                <li key={item}>! {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="my-people-summary">
        <h2 id="my-people-summary" className="text-lg font-bold">
          My people
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          A relationship does not create access. Delegates are separately authorised.
        </p>
        {people.length ? (
          <ul className="mt-4 space-y-3">
            {people.slice(0, 5).map((grant) => (
              <li key={grant.id} className="rounded-lg border border-slate-200 px-4 py-3 text-sm">
                <p className="font-semibold">{grant.delegate?.name ?? grant.recipientRole}</p>
                <p className="text-slate-600">{grant.purpose}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-600">No one else has access yet.</p>
        )}
        <Link href="/my/people" className="mt-3 inline-block text-sm font-semibold text-[#005B7F]">
          Manage My people →
        </Link>
      </section>

      <section aria-labelledby="connected-services">
        <h2 id="connected-services" className="text-lg font-bold">
          Connected services
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Only services you have actually connected appear here. MapAble does not invent
          connections.
        </p>
        <p className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          No connected services recorded for this account in this slice.
        </p>
      </section>

      <section aria-labelledby="activity-link">
        <h2 id="activity-link" className="text-lg font-bold">
          Activity
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Plain-language history of what MapAble did and what you approved.
        </p>
        <Link
          href="/my/control/activity"
          className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-[#005B7F] px-4 py-2 text-sm font-semibold text-white"
        >
          View agency activity
        </Link>
        <Link
          href="/my/control/permissions"
          className="ml-3 inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
        >
          Permissions detail
        </Link>
      </section>

      <section aria-labelledby="agency-memory-link">
        <h2 id="agency-memory-link" className="text-lg font-bold">
          My Preferences
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          See what MapAble remembers, why, where it is used, and who can see it.
          You can edit, revoke, delete, export, pause personalisation, or disable
          AI use.
        </p>
        <Link
          href="/my/control/preferences"
          className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-[#005B7F] px-4 py-2 text-sm font-semibold text-white"
        >
          Open Agency Memory
        </Link>
      </section>

      <p className="text-sm text-slate-600">
        Full consent history is also available at{" "}
        <Link href="/dashboard/consent" className="font-semibold text-[#005B7F]">
          Consent centre
        </Link>{" "}
        and{" "}
        <Link href="/participant/privacy" className="font-semibold text-[#005B7F]">
          Privacy & access
        </Link>
        .
      </p>
    </div>
  );
}
