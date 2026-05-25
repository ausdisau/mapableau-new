"use client";

import dynamic from "next/dynamic";

const MapNotice = dynamic(
  () =>
    Promise.resolve(function MapNoticeInner() {
      return (
        <div className="rounded-xl border bg-muted/30 p-4 text-sm">
          Delivery route approximation. Exact participant address is not shown on map labels.
        </div>
      );
    }),
  { ssr: false }
);

export function FoodDeliveryMap() {
  return <MapNotice />;
}

export { FoodDeliveryMap as TransportTripMap };
