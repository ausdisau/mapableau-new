"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AGENCY_CAN, AGENCY_MUST_ASK } from "@/lib/personal-agency/agency-copy";

const HELP_AREAS = [
  "Get somewhere",
  "Find support",
  "Work or study",
  "Sport & recreation",
  "Plan something",
  "Just explore",
] as const;

const INTERFACE_METHODS = [
  "Touch",
  "Keyboard",
  "Switch",
  "Eye gaze",
  "Voice",
  "AAC",
  "Screen reader",
  "Braille",
  "Another method",
] as const;

const TRAVEL_MODES = [
  "Power wheelchair",
  "Manual wheelchair",
  "Mobility scooter",
  "Walking",
  "Exoskeleton",
  "Other",
  "It changes",
] as const;

export function FirstRunSetup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [helpAreas, setHelpAreas] = useState<string[]>([]);
  const [interfaceMethods, setInterfaceMethods] = useState<string[]>([]);
  const [travelMode, setTravelMode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function toggle(
    list: string[],
    value: string,
    setter: (v: string[]) => void,
  ) {
    setter(
      list.includes(value) ? list.filter((x) => x !== value) : [...list, value],
    );
  }

  async function finish() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/my/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ helpAreas, interfaceMethods, travelMode }),
      });
      if (!res.ok) {
        setError("Could not save setup. You can continue to My MapAble.");
        return;
      }
      router.push("/my");
      router.refresh();
    } catch {
      setError("Could not save setup. You can continue to My MapAble.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <p className="text-sm text-slate-600" aria-live="polite">
        Step {step} of 4
      </p>

      {step === 1 ? (
        <section aria-labelledby="setup-step-1">
          <h2 id="setup-step-1" className="text-2xl font-bold">
            What would you like MapAble to help with?
          </h2>
          <ul className="mt-4 space-y-2">
            {HELP_AREAS.map((area) => (
              <li key={area}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={helpAreas.includes(area)}
                    onChange={() => toggle(helpAreas, area, setHelpAreas)}
                  />
                  <span>{area}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {step === 2 ? (
        <section aria-labelledby="setup-step-2">
          <h2 id="setup-step-2" className="text-2xl font-bold">
            How do you prefer to use MapAble?
          </h2>
          <ul className="mt-4 space-y-2">
            {INTERFACE_METHODS.map((method) => (
              <li key={method}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={interfaceMethods.includes(method)}
                    onChange={() =>
                      toggle(interfaceMethods, method, setInterfaceMethods)
                    }
                  />
                  <span>{method}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {step === 3 ? (
        <section aria-labelledby="setup-step-3">
          <h2 id="setup-step-3" className="text-2xl font-bold">
            How are you travelling today?
          </h2>
          <ul className="mt-4 space-y-2">
            {TRAVEL_MODES.map((mode) => (
              <li key={mode}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                  <input
                    type="radio"
                    name="travelMode"
                    checked={travelMode === mode}
                    onChange={() => setTravelMode(mode)}
                  />
                  <span>{mode}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {step === 4 ? (
        <section aria-labelledby="setup-step-4">
          <h2 id="setup-step-4" className="text-2xl font-bold">
            MapAble agency
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-bold text-[#005B7F]">MapAble can</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {AGENCY_CAN.map((item) => (
                  <li key={item}>✓ {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="font-bold text-[#B45309]">
                MapAble must ask before
              </h3>
              <ul className="mt-2 space-y-1 text-sm">
                {AGENCY_MUST_ASK.map((item) => (
                  <li key={item}>! {item}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            You can change this later in Privacy & control.
          </p>
        </section>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
          >
            Back
          </button>
        ) : null}
        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="min-h-11 rounded-lg bg-[#005B7F] px-4 py-2 text-sm font-semibold text-white"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={finish}
            className="min-h-11 rounded-lg bg-[#F8C51C] px-4 py-2 text-sm font-bold text-[#0C1833] disabled:opacity-60"
          >
            {pending ? "Saving…" : "Go to My MapAble"}
          </button>
        )}
        <button
          type="button"
          onClick={() => router.push("/my")}
          className="min-h-11 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 underline-offset-2 hover:underline"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
