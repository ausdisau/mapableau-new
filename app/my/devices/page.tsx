import Link from "next/link";

import { AGENCY_NEVER } from "@/lib/personal-agency/agency-copy";
import { requirePersonalAgencyGate } from "@/lib/personal-agency/gates";

export const metadata = { title: "My devices | My MapAble" };

export default async function MyDevicesPage() {
  await requirePersonalAgencyGate();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">My devices</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Assistive capability fabric — connect devices when available. MapAble never controls
          movement or seating.
        </p>
      </header>

      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8">
        <p className="text-lg font-semibold">No devices connected.</p>
        <p className="mt-2 text-sm text-slate-600">
          You can use MapAble without connecting assistive technology. Future device classes may
          include manual wheelchairs, AAC, braille displays, and environmental controls — none
          are integrated in this slice.
        </p>
      </div>

      <section aria-labelledby="device-policy" className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 id="device-policy" className="text-lg font-bold">
          What MapAble cannot do
        </h2>
        <ul className="mt-3 space-y-1 text-sm text-slate-700">
          {AGENCY_NEVER.filter((item) => item.includes("wheelchair")).map((item) => (
            <li key={item}>× {item}</li>
          ))}
        </ul>
      </section>

      <Link href="/my/control" className="text-sm font-semibold text-[#005B7F]">
        Learn about device connections in Privacy & control →
      </Link>
    </div>
  );
}
