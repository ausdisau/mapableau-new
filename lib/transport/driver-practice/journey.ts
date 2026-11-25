import { checks, stages } from "../driver-journey";
export { checks, stages };

/** Synthetic shift. These identifiers never enter the booking or dispatch APIs. */
export const jobs = [
  {
    id: "MT-021",
    time: "09:00",
    from: "Parramatta",
    to: "Sydney Olympic Park",
    origin: "Parramatta Park",
    destination: "Olympic Park Aquatic Centre",
    corridor: "park-aquatic",
    notes: [
      "I use a communication device. Please give me time to reply.",
      "Ask me before positioning the ramp.",
    ],
    shares: true,
  },
  {
    id: "MT-022",
    time: "11:30",
    from: "Sydney Olympic Park",
    to: "Parramatta",
    origin: "Olympic Park Aquatic Centre",
    destination: "Parramatta Park",
    corridor: "aquatic-park",
    notes: [],
    shares: false,
  },
  {
    id: "MT-023",
    time: "14:15",
    from: "Parramatta Park",
    to: "Parramatta Square",
    origin: "Parramatta Park",
    destination: "Parramatta Library at PHIVE",
    corridor: "park-library",
    notes: ["Please offer a written greeting when we meet."],
    shares: true,
  },
] as const;
export type Job = (typeof jobs)[number];
export type Corridor = Job["corridor"];

export const issueKinds = [
  "Pickup access blocked",
  "Vehicle or equipment issue",
  "Rider requests a pause",
  "Dispatch assistance needed",
] as const;
export type Issue = (typeof issueKinds)[number];
export type Action =
  | {
      kind: "advance";
      expected: number;
      confirmed?: boolean;
      checks?: boolean[];
    }
  | { kind: "decline" }
  | { kind: "pause"; reason: Issue }
  | { kind: "resume" }
  | { kind: "withdraw" };
export type Run = {
  step: number;
  declined: boolean;
  shared: boolean;
  hold: Issue | null;
  events: string[];
};
export type Shift = { version: 1; runs: Record<string, Run> };
export const initialShift = (): Shift => ({
  version: 1,
  runs: Object.fromEntries(
    jobs.map((job) => [
      job.id,
      { step: 0, declined: false, shared: job.shares, hold: null, events: [] },
    ]),
  ),
});
export const finished = (r: Run) => r.declined || r.step === stages.length - 1;
export const detailsVisible = (r: Run) => !finished(r) && r.step > 0;
export const status = (r: Run) =>
  r.declined
    ? "Returned to dispatch"
    : r.hold
      ? "Paused"
      : stages[r.step]!.label;
export function primaryJob(shift: Shift) {
  const open = jobs.filter((j) => !finished(shift.runs[j.id]!));
  return open.find((j) => shift.runs[j.id]!.step > 0) ?? open[0];
}
export function decodeShift(raw: string | null): Shift {
  if (!raw) return initialShift();
  try {
    const s = JSON.parse(raw);
    if (s?.version !== 1) return initialShift();
    const clean = initialShift();
    for (const job of jobs) {
      const r = s.runs?.[job.id];
      if (
        !r ||
        !Number.isInteger(r.step) ||
        r.step < 0 ||
        r.step >= stages.length ||
        typeof r.declined !== "boolean" ||
        typeof r.shared !== "boolean" ||
        !(r.hold === null || issueKinds.includes(r.hold)) ||
        !Array.isArray(r.events) ||
        !r.events.every((e: unknown) => typeof e === "string" && e.length < 100)
      )
        return initialShift();
      clean.runs[job.id] = {
        step: r.step,
        declined: r.declined,
        shared: job.shares && r.shared,
        hold: r.hold,
        events: r.events.slice(-40),
      };
    }
    return clean;
  } catch {
    return initialShift();
  }
}
export function applyAction(shift: Shift, id: string, action: Action): Shift {
  const old = shift.runs[id];
  if (!old || finished(old)) throw new Error("This trip is closed.");
  const run: Run = { ...old, events: [...old.events] };
  let event: string;
  switch (action.kind) {
    case "advance":
      if (action.expected !== run.step)
        throw new Error("The trip has changed. Review its current stage.");
      if (run.hold) throw new Error("Resolve the pause before continuing.");
      if (
        run.step === 0 &&
        jobs.some((j) => j.id !== id && detailsVisible(shift.runs[j.id]!))
      )
        throw new Error("Finish or return to your current trip first.");
      if (
        run.step === 2 &&
        !(
          action.checks?.length === checks.length &&
          action.checks.every((c) => c === true)
        )
      )
        throw new Error("Complete all three checks before departure.");
      if ((run.step === 4 || run.step === 7) && !action.confirmed)
        throw new Error("Confirm the rider’s decision before continuing.");
      run.step += 1;
      event = stages[run.step]!.label;
      break;
    case "decline":
      if (run.step !== 0)
        throw new Error("Only an open offer can be declined.");
      run.declined = true;
      event = "Offer returned to dispatch";
      break;
    case "pause":
      if (
        !detailsVisible(run) ||
        run.hold ||
        !issueKinds.includes(action.reason)
      )
        throw new Error("Choose an active trip and a reason for the pause.");
      run.hold = action.reason;
      event = "Paused · " + action.reason;
      break;
    case "resume":
      if (!run.hold) throw new Error("This trip is already active.");
      run.hold = null;
      event = "Driver confirmed the issue was resolved";
      break;
    case "withdraw":
      if (!detailsVisible(run) || !run.shared)
        throw new Error("No shared instructions on this trip.");
      run.shared = false;
      event = "Rider withdrew shared instructions";
      break;
  }
  run.events = [...run.events, event].slice(-40);
  return { version: 1, runs: { ...shift.runs, [id]: run } };
}
