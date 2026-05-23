import dynamic from "next/dynamic";

import { requireAdmin } from "@/lib/auth/guards";
import { syncOperationalQueues } from "@/lib/dispatch-console/dispatch-service";
import { prisma } from "@/lib/prisma";

const DispatchMapPanel = dynamic(
  () =>
    import("@/components/dispatch/DispatchMapPanel").then(
      (m) => m.DispatchMapPanel
    ),
  { ssr: false }
);

export default async function DispatchConsolePage() {
  const user = await requireAdmin();
  const queues = await syncOperationalQueues(user.id);
  const list = Array.isArray(queues) ? queues : [];

  const transports = await prisma.transportBooking.findMany({
    where: {
      pickupLat: { not: null },
      pickupLng: { not: null },
      status: { in: ["confirmed", "driver_en_route", "in_transit", "requested"] },
    },
    take: 15,
  });

  const markers = transports.map((t) => ({
    id: t.id,
    lat: t.pickupLat!,
    lng: t.pickupLng!,
    label: "Trip",
    variant: "vehicle" as const,
  }));
  const center =
    markers[0] != null
      ? { lat: markers[0].lat, lng: markers[0].lng }
      : { lat: -33.8688, lng: 151.2093 };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Dispatch console</h1>
      <p className="text-muted-foreground">
        Operational queues for care, transport and critical incidents. Human
        dispatch required — not autonomous assignment.
      </p>
      <DispatchMapPanel markers={markers} center={center} />
      <table className="w-full text-sm">
        <caption className="sr-only">Open dispatch queue items</caption>
        <thead>
          <tr>
            <th scope="col">Priority</th>
            <th scope="col">Type</th>
            <th scope="col">Summary</th>
          </tr>
        </thead>
        <tbody>
          {list.map((q) => (
            <tr key={q.id} className="border-t">
              <td>{q.priority}</td>
              <td>{q.queueType.replace(/_/g, " ")}</td>
              <td>{q.plainLanguageSummary ?? q.title}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
