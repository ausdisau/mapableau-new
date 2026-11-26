"use client";

import { ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";

import {
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSecondaryButtonClass,
} from "@/lib/marketing/public-page-styles";
import {
  APPOINTMENT_PLAN_PATH,
  PASSENGER_PATH,
  sampleCareAppointment,
  storeAppointmentDraft,
} from "@/lib/transport/passenger-appointment";

export function CarePassengerEntry() {
  return (
    <section
      aria-labelledby="care-passenger-heading"
      className="border-b border-slate-200 bg-white"
    >
      <div
        className={`${mapablePublicPageContainerClass} grid gap-6 py-10 md:grid-cols-2 md:items-center`}
      >
        <div>
          <h2
            id="care-passenger-heading"
            className="mapable-display text-3xl font-bold text-[#0C1833]"
          >
            Passenger travel
          </h2>
          <p className="mb-4 mt-2 max-w-prose text-slate-700">
            Practise a trip with MapAble Transport. Choose a pickup, review a
            sample fare and decide what your driver can see.
          </p>
          <Link
            href={PASSENGER_PATH}
            className={mapablePublicSecondaryButtonClass}
          >
            My trips
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-[#F6FBFC] p-5">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <CalendarDays aria-hidden="true" size={20} /> Sample Care
            appointment
          </h3>
          <p className="mt-2 font-semibold">
            Tomorrow at 10:30 am, Sydney time
          </p>
          <p className="mb-4 mt-1 text-sm text-slate-700">
            Choosing Plan transport copies only the date and time into an
            editable practice trip.
          </p>
          <Link
            href={APPOINTMENT_PLAN_PATH}
            prefetch={false}
            className={mapablePublicPrimaryButtonClass}
            onClick={() =>
              storeAppointmentDraft(sampleCareAppointment(new Date()))
            }
          >
            Plan transport <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
