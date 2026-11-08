"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { mockTourismProvider } from "@/lib/tourism/mock-provider";
import { planSydneyTrip } from "@/lib/tourism/planner";
import { readPlannerPrefs, writePlannerPrefs, writeTourismTrip } from "@/lib/tourism/storage";
import {
  defaultPlannerInput,
  TOURISM_NEEDS,
  type TourismNeed,
  type TourismPlannerInput,
} from "@/lib/tourism/types";

const modes = [
  { id: "walk", label: "Walking" },
  { id: "public-transport", label: "Public transport" },
  { id: "taxi", label: "Taxi or rideshare" },
];

function accessPrefChecked(
  prefs: TourismPlannerInput["accessPrefs"],
  need: TourismNeed,
): boolean {
  switch (need) {
    case "step-free":
      return prefs.stepFree;
    case "accessible-toilet":
      return prefs.accessibleToilets;
    case "wheelchair-transport":
      return prefs.wheelchairTransport;
    case "accessible-accommodation":
      return prefs.accessibleAccommodation;
    case "sensory":
      return prefs.sensory;
    case "communication-access":
      return prefs.communicationAccess;
    default: {
      const _exhaustive: never = need;
      return _exhaustive;
    }
  }
}

function withAccessPref(
  prefs: TourismPlannerInput["accessPrefs"],
  need: TourismNeed,
  value: boolean,
): TourismPlannerInput["accessPrefs"] {
  switch (need) {
    case "step-free":
      return { ...prefs, stepFree: value };
    case "accessible-toilet":
      return { ...prefs, accessibleToilets: value };
    case "wheelchair-transport":
      return { ...prefs, wheelchairTransport: value };
    case "accessible-accommodation":
      return { ...prefs, accessibleAccommodation: value };
    case "sensory":
      return { ...prefs, sensory: value };
    case "communication-access":
      return { ...prefs, communicationAccess: value };
    default: {
      const _exhaustive: never = need;
      return _exhaustive;
    }
  }
}

export function PlannerForm({
  onGenerated,
}: {
  onGenerated?: (message: string) => void;
}) {
  const [input, setInput] = useState<TourismPlannerInput>(defaultPlannerInput);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const saved = readPlannerPrefs();
    if (saved) setInput({ ...defaultPlannerInput(), ...saved });
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: string[] = [];
    if (input.destination !== "Sydney") {
      nextErrors.push("The prototype currently supports Sydney only.");
    }
    if (input.travellers < 1) {
      nextErrors.push("Enter at least one traveller.");
    }
    setErrors(nextErrors);
    if (nextErrors.length > 0) return;
    writePlannerPrefs(input);
    const trip = planSydneyTrip(input);
    writeTourismTrip(trip);
    await mockTourismProvider.createItinerary(trip);
    const text =
      "Your illustrative itinerary is saved locally. Preferences stay in this browser and are not sent to OpenTripMap, Alpaca or analytics.";
    setMessage(text);
    onGenerated?.(text);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label className="block font-bold" htmlFor="tourism-destination">
          Destination
        </label>
        <select
          id="tourism-destination"
          value={input.destination}
          onChange={(event) => setInput((prev) => ({ ...prev, destination: event.target.value }))}
          className="mt-2 min-h-11 w-full rounded-xl border border-slate-400 px-3"
        >
          <option>Sydney</option>
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block font-bold" htmlFor="tourism-start">
            Start date (optional)
          </label>
          <input
            id="tourism-start"
            type="date"
            value={input.startDate}
            onChange={(event) => setInput((prev) => ({ ...prev, startDate: event.target.value }))}
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-400 px-3"
          />
        </div>
        <div>
          <label className="block font-bold" htmlFor="tourism-end">
            End date (optional)
          </label>
          <input
            id="tourism-end"
            type="date"
            value={input.endDate}
            onChange={(event) => setInput((prev) => ({ ...prev, endDate: event.target.value }))}
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-400 px-3"
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block font-bold" htmlFor="tourism-days">
            Trip duration
          </label>
          <select
            id="tourism-days"
            value={input.durationDays}
            onChange={(event) =>
              setInput((prev) => ({ ...prev, durationDays: Number(event.target.value) }))
            }
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-400 px-3"
          >
            {[1, 2, 3, 4, 5].map((day) => (
              <option key={day} value={day}>
                {day} {day === 1 ? "day" : "days"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-bold" htmlFor="tourism-travellers">
            Travellers
          </label>
          <input
            id="tourism-travellers"
            type="number"
            min={1}
            max={12}
            value={input.travellers}
            onChange={(event) =>
              setInput((prev) => ({ ...prev, travellers: Number(event.target.value) }))
            }
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-400 px-3"
          />
        </div>
      </div>
      <fieldset className="space-y-3">
        <legend className="font-bold">Your access priorities</legend>
        {TOURISM_NEEDS.map((need) => (
            <label
              key={need.id}
              htmlFor={`tourism-need-${need.id}`}
              className="flex min-h-12 items-start gap-3 rounded-xl bg-[#F6FBFC] p-4"
            >
              <input
                id={`tourism-need-${need.id}`}
                className="mt-1 h-5 w-5 accent-[#005B7F]"
                type="checkbox"
                checked={accessPrefChecked(input.accessPrefs, need.id)}
                onChange={(event) => {
                  const value = event.target.checked;
                  setInput((prev) => ({
                    ...prev,
                    accessPrefs: withAccessPref(prev.accessPrefs, need.id, value),
                  }));
                }}
              />
              <strong className="block">{need.label}</strong>
              <span className="mt-1 block text-sm text-slate-600">{need.hint}</span>
            </label>
        ))}
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="font-bold">Travel modes</legend>
        {modes.map((mode) => (
          <label key={mode.id} className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[#005B7F]"
              checked={input.modes.includes(mode.id)}
              onChange={(event) =>
                setInput((prev) => ({
                  ...prev,
                  modes: event.target.checked
                    ? [...prev.modes, mode.id]
                    : prev.modes.filter((item) => item !== mode.id),
                }))
              }
            />
            {mode.label}
          </label>
        ))}
      </fieldset>
      <div>
        <label className="block font-bold" htmlFor="tourism-budget">
          Budget (optional)
        </label>
        <select
          id="tourism-budget"
          value={input.budget}
          onChange={(event) =>
            setInput((prev) => ({
              ...prev,
              budget: event.target.value as TourismPlannerInput["budget"],
            }))
          }
          className="mt-2 min-h-11 w-full rounded-xl border border-slate-400 px-3"
        >
          <option value="unspecified">Not specified</option>
          <option value="low">Lower spend</option>
          <option value="medium">Medium</option>
          <option value="high">Flexible</option>
        </select>
      </div>
      <div>
        <label className="block font-bold" htmlFor="tourism-interests">
          Interests
        </label>
        <input
          id="tourism-interests"
          value={input.interests.join(", ")}
          onChange={(event) =>
            setInput((prev) => ({
              ...prev,
              interests: event.target.value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
            }))
          }
          className="mt-2 min-h-11 w-full rounded-xl border border-slate-400 px-3"
        />
      </div>
      <div>
        <label className="block font-bold" htmlFor="tourism-rest">
          Rest-break preference
        </label>
        <select
          id="tourism-rest"
          value={input.restBreakPreference}
          onChange={(event) =>
            setInput((prev) => ({
              ...prev,
              restBreakPreference: event.target.value as TourismPlannerInput["restBreakPreference"],
            }))
          }
          className="mt-2 min-h-11 w-full rounded-xl border border-slate-400 px-3"
        >
          <option value="frequent">Frequent rests</option>
          <option value="standard">Standard rests</option>
          <option value="minimal">Fewer planned rests</option>
        </select>
      </div>
      <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950">
        Selecting a preference is stored locally. It does not certify that an entire journey will be accessible, and it is never inferred from a disability label.
      </p>
      {errors.length > 0 ? (
        <ul className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
      <button
        className="min-h-11 rounded-xl bg-[#005B7F] px-6 py-3 font-bold text-white focus-visible:outline-4 focus-visible:outline-offset-2"
        type="submit"
      >
        Generate sample itinerary
      </button>
      <p role="status" aria-live="polite">
        {message}
      </p>
      {message ? (
        <Link href="/tourism/trips/sydney-demo" className="inline-block font-bold text-[#005B7F] underline">
          Open your itinerary →
        </Link>
      ) : null}
    </form>
  );
}
