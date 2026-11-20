"use client";

import { useCallback, useEffect, useState } from "react";

import { ScheduleAdvisoryRoute } from "@/components/transport/schedule/ScheduleAdvisoryRoute";
import { ScheduleMap } from "@/components/transport/schedule/ScheduleMap";
import { ScheduleMatrixGrid } from "@/components/transport/schedule/ScheduleMatrixGrid";
import { ScheduleTripTable } from "@/components/transport/schedule/ScheduleTripTable";
import type { ScheduleMatrixProjection } from "@/lib/transport/schedule/schedule-matrix-service";
import {
  createTransportScheduleSocketSubscription,
  TRANSPORT_SCHEDULE_POLL_MS,
} from "@/lib/realtime/transport-schedule-socket-adapter";

type Props = {
  organisationId: string;
  initial: ScheduleMatrixProjection;
  initialDay: string;
  mapEnabled: boolean;
  socketEnabled: boolean;
};

export function ProviderTransportScheduleClient({
  organisationId,
  initial,
  initialDay,
  mapEnabled,
  socketEnabled,
}: Props) {
  const [matrix, setMatrix] = useState(initial);
  const [day, setDay] = useState(initialDay);
  const [view, setView] = useState<"table" | "drivers" | "vehicles">("table");
  const [status, setStatus] = useState<string>("");

  const refetch = useCallback(async () => {
    setStatus("Refreshing schedule…");
    try {
      const res = await fetch(
        `/api/provider/transport/schedule?organisationId=${encodeURIComponent(organisationId)}&day=${encodeURIComponent(day)}`
      );
      if (!res.ok) {
        setStatus("Unable to refresh schedule. Showing last loaded data.");
        return;
      }
      const body = (await res.json()) as ScheduleMatrixProjection;
      if (body?.trips && body?.rows) setMatrix(body);
      setStatus("Schedule updated.");
    } catch {
      setStatus("Network error while refreshing. Showing last loaded data.");
    }
  }, [organisationId, day]);

  useEffect(() => {
    void refetch();
  }, [day, refetch]);

  useEffect(() => {
    if (!socketEnabled) {
      const id = window.setInterval(() => {
        void refetch();
      }, TRANSPORT_SCHEDULE_POLL_MS);
      return () => window.clearInterval(id);
    }

    let lastSequence = 0;
    const unsubscribe = createTransportScheduleSocketSubscription({
      organisationId,
      authToken: "",
      lastSequence,
      onEvent: () => {
        void refetch();
      },
      onSequenceGap: () => {
        void refetch();
      },
      onDisconnect: () => {
        void refetch();
      },
    });

    const id = window.setInterval(() => {
      void refetch();
    }, TRANSPORT_SCHEDULE_POLL_MS);
    return () => {
      unsubscribe();
      window.clearInterval(id);
    };
  }, [organisationId, socketEnabled, refetch]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Day (Australia/Sydney)</span>
          <input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="rounded border border-border bg-background px-2 py-1"
          />
        </label>
        <fieldset className="flex flex-wrap gap-3 text-sm">
          <legend className="sr-only">Schedule view</legend>
          {(
            [
              ["table", "Trip list"],
              ["drivers", "Driver matrix"],
              ["vehicles", "Vehicle matrix"],
            ] as const
          ).map(([id, label]) => (
            <label key={id} className="inline-flex items-center gap-1">
              <input
                type="radio"
                name="schedule-view"
                value={id}
                checked={view === id}
                onChange={() => setView(id)}
              />
              {label}
            </label>
          ))}
        </fieldset>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded border border-border px-3 py-1 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Refresh
        </button>
      </div>

      <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
        {status ||
          `Showing ${matrix.trips.length} trips · ${matrix.slotMinutes}-minute slots · ${matrix.timeZone}`}
      </p>

      {view === "table" ? (
        <ScheduleTripTable trips={matrix.trips} timeZone={matrix.timeZone} />
      ) : null}
      {view === "drivers" ? (
        <ScheduleMatrixGrid matrix={matrix} resourceFilter="driver" />
      ) : null}
      {view === "vehicles" ? (
        <ScheduleMatrixGrid matrix={matrix} resourceFilter="vehicle" />
      ) : null}

      <section className="space-y-2" aria-labelledby="schedule-map-heading">
        <h2 id="schedule-map-heading" className="font-heading text-lg font-semibold">
          Map (optional)
        </h2>
        <ScheduleMap trips={matrix.trips} enabled={mapEnabled} />
      </section>

      <section className="space-y-2" aria-labelledby="schedule-route-heading">
        <h2 id="schedule-route-heading" className="font-heading text-lg font-semibold">
          Advisory routes
        </h2>
        <ScheduleAdvisoryRoute trips={matrix.trips} />
      </section>
    </div>
  );
}
