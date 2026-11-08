import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import type { TourismTrip } from "@/lib/tourism/types";

export function ItineraryCard({ trip }: { trip: TourismTrip }) {
  return (
    <Card className="rounded-3xl border-slate-200">
      <CardContent className="space-y-3 p-6">
        <p className="text-xs font-black uppercase tracking-widest text-[#005B7F]">Curated sample</p>
        <h3 className="text-2xl font-black">Sydney in {trip.days.length} days</h3>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
          {trip.days.map((day) => (
            <li key={day.day}>
              Day {day.day}: {day.title}
            </li>
          ))}
        </ol>
        <Link
          href="/tourism/trips/sydney-demo"
          className="inline-flex min-h-11 items-center font-bold text-[#005B7F] underline"
        >
          Open the sample itinerary
        </Link>
      </CardContent>
    </Card>
  );
}
