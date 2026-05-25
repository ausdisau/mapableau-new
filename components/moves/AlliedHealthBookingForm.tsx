"use client";

import { useState } from "react";

import { TherapistSearch } from "@/components/moves/TherapistSearch";

export function AlliedHealthBookingForm() {
  const [therapistId, setTherapistId] = useState("");
  const [therapyType, setTherapyType] = useState("physiotherapy");
  const [deliveryMode, setDeliveryMode] = useState("telehealth");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [location, setLocation] = useState("");
  const [transportRequired, setTransportRequired] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch("/api/moves/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        therapistProfileId: therapistId,
        therapyType,
        deliveryMode,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        location: location || undefined,
        transportRequired,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Booking failed");
      return;
    }
    window.location.href = `/dashboard/moves/appointments/${data.appointment.id}`;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-2xl">
      <TherapistSearch selectedId={therapistId} onSelect={setTherapistId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="therapyType" className="block text-sm font-medium">
            Therapy type
          </label>
          <select
            id="therapyType"
            value={therapyType}
            onChange={(e) => setTherapyType(e.target.value)}
            className="mt-1 w-full min-h-10 rounded-lg border border-border px-3"
          >
            <option value="physiotherapy">Physiotherapy</option>
            <option value="occupational_therapy">Occupational therapy</option>
            <option value="speech_pathology">Speech pathology</option>
            <option value="exercise_physiology">Exercise physiology</option>
            <option value="psychology">Psychology</option>
          </select>
        </div>
        <div>
          <label htmlFor="deliveryMode" className="block text-sm font-medium">
            Delivery mode
          </label>
          <select
            id="deliveryMode"
            value={deliveryMode}
            onChange={(e) => setDeliveryMode(e.target.value)}
            className="mt-1 w-full min-h-10 rounded-lg border border-border px-3"
          >
            <option value="telehealth">Telehealth</option>
            <option value="home_visit">Home visit</option>
            <option value="clinic">Clinic</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startsAt" className="block text-sm font-medium">
            Start
          </label>
          <input
            id="startsAt"
            type="datetime-local"
            required
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="mt-1 w-full min-h-10 rounded-lg border border-border px-3"
          />
        </div>
        <div>
          <label htmlFor="endsAt" className="block text-sm font-medium">
            End
          </label>
          <input
            id="endsAt"
            type="datetime-local"
            required
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="mt-1 w-full min-h-10 rounded-lg border border-border px-3"
          />
        </div>
      </div>
      {deliveryMode !== "telehealth" ? (
        <div>
          <label htmlFor="location" className="block text-sm font-medium">
            Location
          </label>
          <input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 w-full min-h-10 rounded-lg border border-border px-3"
          />
        </div>
      ) : null}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={transportRequired}
          onChange={(e) => setTransportRequired(e.target.checked)}
        />
        Link MapAble Transport for this appointment
      </label>
      <button
        type="submit"
        disabled={!therapistId}
        className="min-h-11 rounded-lg bg-primary px-4 font-medium text-primary-foreground disabled:opacity-50"
      >
        Request appointment
      </button>
      {message ? (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      ) : null}
    </form>
  );
}
