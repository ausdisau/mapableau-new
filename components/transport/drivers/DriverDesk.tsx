import React, { useEffect, useRef, useState } from "react";

import {
  applyAction,
  checks,
  decodeShift,
  detailsVisible,
  finished,
  initialShift,
  issueKinds,
  jobs,
  primaryJob,
  stages,
  status,
} from "../../../lib/transport/driver-practice/journey";
import type { Action } from "../../../lib/transport/driver-practice/journey";
import routes from "../../../lib/transport/driver-practice/routes.json";

import { buttonColours, colour as c } from "./kit";
import type { DriverUI, IconName, TapProps } from "./kit";

type Page = "shift" | "schedule" | "trip" | "route" | "support" | "vehicle";
type Dialog = "decline" | "reset" | "withdraw" | null;
const practiceDate = "Wednesday, 25 November 2026";
const sectionColour = "#BCE5E4";

export function DriverDesk({ ui }: { ui: DriverUI }) {
  const { Box, T, Tap, Icon, Mark, Diagram } = ui;
  const narrow = ui.useNarrow();
  const [shift, setShift] = useState(initialShift);
  const [page, setPage] = useState<Page>("shift");
  const [selected, select] = useState<string>(jobs[0].id);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [ticks, setTicks] = useState<boolean[]>(checks.map(() => false));
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [estimate, setEstimate] = useState<Awaited<
    ReturnType<DriverUI["refreshEstimate"]>
  > | null>(null);
  const [now, setNow] = useState(Date.now);
  const estimateSeq = useRef(0);
  const saveQueue = useRef(Promise.resolve());
  const latestShift = useRef(shift);
  const headingStarted = useRef(false);
  const current = primaryJob(shift);
  const job = jobs.find((j) => j.id === selected) ?? jobs[0];
  const run = shift.runs[job.id]!;
  const route = routes[job.corridor];
  const active = detailsVisible(run);
  const complete = jobs.filter(
    (j) => shift.runs[j.id]!.step === stages.length - 1,
  ).length;

  useEffect(() => {
    let mounted = true;
    ui.load()
      .then((raw) => {
        if (mounted) {
          const s = decodeShift(raw);
          latestShift.current = s;
          setShift(s);
        }
      })
      .catch(() => {
        if (mounted)
          setNotice(
            "Local storage is unavailable. This practice shift will last for this session.",
          );
      })
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, [ui]);
  useEffect(() => {
    if (!headingStarted.current) {
      headingStarted.current = true;
      return;
    }
    ui.focusPage();
  }, [ui, page, selected, dialog]);
  useEffect(() => {
    if (!estimate) return;
    const id = setTimeout(
      () => setNow(Date.now()),
      Math.max(1, Date.parse(estimate.validUntil) - Date.now() + 30),
    );
    return () => clearTimeout(id);
  }, [estimate]);
  const write = (next: ReturnType<typeof initialShift>) => {
    latestShift.current = next;
    setShift(next);
    saveQueue.current = saveQueue.current
      .then(() => ui.save(JSON.stringify(next)))
      .catch(() => {
        setNotice(
          "This change is visible for this session. Saving it on this device failed.",
        );
      });
  };
  const go = (next: Page, id?: string) => {
    if (id) select(id);
    setPage(next);
    setNotice("");
    setDialog(null);
    setConfirmed(false);
    setTicks(checks.map(() => false));
    ++estimateSeq.current;
    setEstimate(null);
    setBusy(false);
  };
  const take = (action: Action) => {
    if (!ready) return;
    try {
      const s = applyAction(latestShift.current, job.id, action);
      write(s);
      setNotice(s.runs[job.id]!.events.at(-1) ?? "Updated");
      setDialog(null);
      setConfirmed(false);
      setTicks(checks.map(() => false));
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : "Review the trip and try again.",
      );
    }
  };
  const visit = (path: Parameters<DriverUI["open"]>[0]) => {
    ui.open(path).catch(() =>
      setNotice(
        "This link could not open. Try MapAble.com.au in your browser.",
      ),
    );
  };
  const refresh = async () => {
    const n = ++estimateSeq.current;
    setBusy(true);
    setNotice("");
    try {
      const value = await ui.refreshEstimate(job.corridor);
      if (n === estimateSeq.current) {
        setEstimate(value);
        setNow(Date.now());
        setNotice("Road estimate updated.");
      }
    } catch (e) {
      if (n === estimateSeq.current)
        setNotice(
          e instanceof Error
            ? e.message
            : "An updated estimate is unavailable.",
        );
    } finally {
      if (n === estimateSeq.current) setBusy(false);
    }
  };
  const button = (
    label: string,
    press: () => void,
    icon?: IconName,
    tone: TapProps["tone"] = "light",
    disabled = false,
  ) => (
    <Tap label={label} onPress={press} tone={tone} disabled={disabled}>
      {icon && <Icon name={icon} size={17} color={buttonColours(tone)[1]} />}
      <T kind="small" bold color={buttonColours(tone)[1]}>
        {label}
      </T>
    </Tap>
  );
  const tag = (label: string, dark = false) => (
    <Box row align="center" pad={7} radius={8} bg={dark ? "#214854" : c.pale}>
      <T kind="label" color={dark ? c.aqua : c.blue}>
        {label}
      </T>
    </Box>
  );
  const card = (children: React.ReactNode, grow = 0) => (
    <Box
      bg={c.white}
      border={c.line}
      radius={18}
      pad={narrow ? 16 : 23}
      gap={14}
      grow={grow}
    >
      {children}
    </Box>
  );
  const row = (
    name: string,
    detail: string,
    icon: IconName,
    act: () => void,
  ) => (
    <Tap label={name} onPress={act} tone="row">
      <Box bg={c.pale} pad={10} radius={10}>
        <Icon name={icon} color={c.blue} size={21} />
      </Box>
      <Box grow={1} basis={0} gap={2}>
        <T kind="sub">{name}</T>
        <T kind="small" color={c.muted}>
          {detail}
        </T>
      </Box>
      <Icon name="chevron" color={c.muted} size={16} />
    </Tap>
  );
  const schedule = (full: boolean) =>
    card(
      <>
        <Box row justify="space-between" align="center" wrap gap={8}>
          <T semantic="h2" kind="heading">
            Run sheet
          </T>
          {tag(complete + " of " + jobs.length + " complete")}
        </Box>
        {jobs.map((j) => {
          const r = shift.runs[j.id]!;
          return (
            <Tap
              key={j.id}
              label={j.time + " – " + j.from + " to " + j.to + ", " + status(r)}
              onPress={() => go("trip", j.id)}
              tone="row"
            >
              <Box min={54} gap={2}>
                <T kind="time">{j.time}</T>
                <T kind="label" color={c.muted}>
                  {j.id}
                </T>
              </Box>
              <Box grow={1} basis={0} gap={4}>
                <T kind="sub">
                  {j.from} → {j.to}
                </T>
                <T kind="small" color={c.muted}>
                  {status(r)}
                </T>
              </Box>
              <Icon name="chevron" size={16} color={c.blue} />
            </Tap>
          );
        })}
        {full && (
          <T kind="small" color={c.muted}>
            All pickup windows use Sydney time. Selecting a trip opens its
            details.
          </T>
        )}
      </>,
    );
  const preferences = () =>
    card(
      <>
        <Box row gap={8} align="center">
          <Icon name="message" color={c.blue} />
          <T semantic="h2" kind="heading">
            Rider preferences
          </T>
        </Box>
        {active && run.shared ? (
          <>
            {job.notes.map((s) => (
              <T key={s}>“{s}”</T>
            ))}
            <T kind="small" color={c.muted}>
              Shared for this practice trip. Address the rider directly.
            </T>
            {button(
              "Simulate withdrawal",
              () => setDialog("withdraw"),
              "shield",
              "link",
            )}
          </>
        ) : (
          <T color={c.muted}>
            {!active
              ? "Instructions are visible during an accepted trip when the rider has chosen to share."
              : "No instructions are shared. Ask the rider how they would like to communicate and what support they want."}
          </T>
        )}
      </>,
    );
  const back = () => go("shift");
  const sampleValid = estimate && now < Date.parse(estimate.validUntil);
  const shownEstimate = sampleValid ? estimate : route;
  const tripTitle = job.from + " to " + job.to;
  return (
    <Box bg={c.paper} full align="center">
      <Box full max={1160} pad={narrow ? 14 : 30} gap={narrow ? 16 : 23}>
        <Box row wrap align="center" justify="space-between" gap={10}>
          <Box row gap={9} align="center">
            <Mark />
            <Box>
              <T kind="sub">MapAble</T>
              <T kind="label" color={c.blue}>
                TRANSPORT DRIVERS
              </T>
            </Box>
          </Box>
          <Box row gap={6} wrap align="center">
            {tag("Practice shift")}
            {button("MapAble.com.au", () => visit("/"), "external", "link")}
          </Box>
        </Box>
        <Box row wrap gap={5} bg={c.white} border={c.line} radius={14} pad={5}>
          {(
            [
              ["shift", "My shift", "wheel"],
              ["schedule", "Trips", "list"],
              ["support", "Support", "support"],
            ] as const
          ).map(([p, label, ic]) => (
            <Tap
              key={p}
              label={label}
              selected={page === p}
              tone="nav"
              onPress={() => go(p)}
            >
              <Icon name={ic} size={17} color={c.blue} />
              <T kind="small" color={c.blue} bold>
                {label}
              </T>
            </Tap>
          ))}
        </Box>
        {page !== "shift" && (
          <Box row>{button("Back to my shift", back, "back", "link")}</Box>
        )}
        <Box gap={4}>
          <T kind="label" color={c.blue}>
            {page === "shift" || page === "schedule"
              ? practiceDate.toUpperCase()
              : (page === "trip" || page === "route" ? job.id + "  /  " : "") +
                "PRACTICE SHIFT"}
          </T>
          <T semantic="h1" kind="title">
            {
              {
                shift: "My shift",
                schedule: "My trips",
                trip: "Trip details",
                route: "Route overview",
                support: "Driver support",
                vehicle: "Vehicle checks",
              }[page]
            }
          </T>
        </Box>
        {notice !== "" && (
          <Box bg={c.pale} radius={10} pad={12}>
            <T semantic="status" color={c.ink}>
              {notice}
            </T>
          </Box>
        )}
        {dialog &&
          card(
            <>
              <T kind="heading" semantic="h2">
                {dialog === "decline"
                  ? "Return this offer to dispatch?"
                  : dialog === "reset"
                    ? "Restart the practice shift?"
                    : "Withdraw the rider’s shared instructions?"}
              </T>
              <T>
                {dialog === "decline"
                  ? "This practice offer will close."
                  : dialog === "reset"
                    ? "This removes the practice trip history saved on this device."
                    : "The instructions will disappear from this trip. The rider can still travel."}
              </T>
              <Box row wrap gap={8}>
                {button("Keep current state", () => setDialog(null))}
                {button(
                  dialog === "decline"
                    ? "Return offer"
                    : dialog === "reset"
                      ? "Restart shift"
                      : "Withdraw instructions",
                  () => {
                    if (dialog === "reset") {
                      write(initialShift());
                      go("shift", jobs[0].id);
                      setNotice("Practice shift restarted.");
                    } else
                      take({
                        kind: dialog === "decline" ? "decline" : "withdraw",
                      });
                  },
                  "check",
                  "danger",
                  !ready,
                )}
              </Box>
            </>,
          )}
        {page === "shift" && (
          <>
            {current ? (
              <Box
                bg={c.hero}
                radius={20}
                pad={narrow ? 19 : 27}
                gap={20}
                row={!narrow}
                align={narrow ? "stretch" : "center"}
              >
                <Box grow={1} basis={narrow ? undefined : 0} gap={12}>
                  <Box row align="center" gap={9} wrap>
                    {tag(
                      detailsVisible(shift.runs[current.id]!)
                        ? "CURRENT TRIP"
                        : "NEXT ASSIGNMENT",
                      true,
                    )}
                    <T kind="label" color={sectionColour}>
                      {current.id}
                    </T>
                  </Box>
                  <T kind="hero" color={c.white}>
                    {current.from} to {current.to}
                  </T>
                  <Box row align="center" wrap gap={8}>
                    <Icon name="clock" size={17} color={c.aqua} />
                    <T kind="body" color={c.white}>
                      {current.time} pickup
                    </T>
                    <T kind="small" color={sectionColour}>
                      · Sydney time
                    </T>
                  </Box>
                  <Box row wrap gap={8}>
                    {button(
                      "Open trip",
                      () => go("trip", current.id),
                      "arrow",
                      "bright",
                    )}
                    {button(
                      "View route",
                      () => go("route", current.id),
                      "route",
                      "dark",
                    )}
                  </Box>
                </Box>
                <Box grow={1} basis={narrow ? undefined : 0}>
                  <Diagram corridor={current.corridor} />
                </Box>
              </Box>
            ) : (
              card(
                <>
                  <T semantic="h2" kind="heading">
                    Your run sheet is clear
                  </T>
                  <T>All offers have been completed or returned to dispatch.</T>
                  {button("Review trips", () => go("schedule"), "list")}
                </>,
              )
            )}
            <Box row={!narrow} gap={16}>
              <Box grow={1.4} basis={narrow ? undefined : 0}>
                {schedule(false)}
              </Box>
              <Box grow={1} basis={narrow ? undefined : 0}>
                {card(
                  <>
                    <T semantic="h2" kind="heading">
                      Driver desk
                    </T>
                    {row(
                      "Vehicle checks",
                      "Review the vehicle and boarding checks.",
                      "van",
                      () => go("vehicle", current?.id ?? jobs[0].id),
                    )}
                    {row(
                      "Assigned trips",
                      "Sign in to the MapAble.com.au driver roster.",
                      "globe",
                      () => visit("/transport/driver"),
                    )}
                    {row(
                      "Dispatch support",
                      "Review a pause or get in touch.",
                      "support",
                      () => go("support", current?.id ?? jobs[0].id),
                    )}
                  </>,
                )}
              </Box>
            </Box>
          </>
        )}
        {page === "schedule" && schedule(true)}
        {page === "trip" && (
          <>
            {card(
              <>
                <Box row align="center" justify="space-between" gap={12} wrap>
                  {tag(status(run))}
                  <T kind="small" color={c.muted}>
                    {job.time} · Sydney time
                  </T>
                </Box>
                <T semantic="h2" kind="heading">
                  {tripTitle}
                </T>
                <Box gap={7}>
                  <T>
                    <T bold>Pickup </T>
                    {active ? job.origin : job.from}
                  </T>
                  <T>
                    <T bold>Drop-off </T>
                    {active ? job.destination : job.to}
                  </T>
                </Box>
                {run.step === 2 && !run.hold && (
                  <>
                    <T bold>Before departure</T>
                    {checks.map((s, i) => (
                      <Tap
                        key={s}
                        check
                        checked={ticks[i]}
                        label={s}
                        onPress={() =>
                          setTicks((prev) =>
                            prev.map((v, n) => (n === i ? !v : v)),
                          )
                        }
                        tone="row"
                      >
                        <Icon
                          name={ticks[i] ? "check" : "shield"}
                          color={ticks[i] ? c.blue : c.muted}
                        />
                        <T>{s}</T>
                      </Tap>
                    ))}
                  </>
                )}
                {(run.step === 4 || run.step === 7) && !run.hold && (
                  <Tap
                    check
                    checked={confirmed}
                    label={
                      run.step === 4
                        ? "The rider confirmed readiness and boarded"
                        : "Arrival and the agreed handover are complete"
                    }
                    onPress={() => setConfirmed((v) => !v)}
                    tone="row"
                  >
                    <Icon name={confirmed ? "check" : "user"} color={c.blue} />
                    <T>
                      {run.step === 4
                        ? "The rider confirmed readiness and boarded."
                        : "Arrival and the agreed handover are complete."}
                    </T>
                  </Tap>
                )}
                {run.hold && (
                  <T color={c.danger} bold>
                    Paused · {run.hold}
                  </T>
                )}
                <Box row wrap gap={8}>
                  {!finished(run) &&
                    !run.hold &&
                    button(
                      stages[run.step]!.next,
                      () =>
                        take({
                          kind: "advance",
                          expected: run.step,
                          checks: ticks,
                          confirmed,
                        }),
                      "arrow",
                      "primary",
                      !ready ||
                        (run.step === 2 && !ticks.every(Boolean)) ||
                        ([4, 7].includes(run.step) && !confirmed),
                    )}
                  {run.step === 0 &&
                    !run.declined &&
                    button(
                      "Decline offer",
                      () => setDialog("decline"),
                      "back",
                      "light",
                      !ready,
                    )}
                  {active &&
                    button(
                      run.hold ? "Review pause" : "Pause or report an issue",
                      () => go("support", job.id),
                      "pause",
                      "light",
                    )}
                  {!finished(run) &&
                    button(
                      "View route",
                      () => go("route", job.id),
                      "route",
                      "light",
                    )}
                </Box>
              </>,
            )}
            {preferences()}
            {run.events.length > 0 &&
              card(
                <>
                  <T semantic="h2" kind="heading">
                    Trip history
                  </T>
                  {run.events.map((v, i) => (
                    <T key={i} kind="small">
                      {i + 1}. {v}
                    </T>
                  ))}
                </>,
              )}
          </>
        )}
        {page === "route" && (
          <>
            <Box bg={c.hero} radius={18} pad={18} gap={11}>
              <T semantic="h2" kind="heading" color={c.white}>
                {tripTitle}
              </T>
              <Diagram corridor={job.corridor} />
              <T kind="small" color={sectionColour}>
                Public demonstration corridor · route diagram
              </T>
            </Box>
            {card(
              <>
                <T semantic="h2" kind="heading">
                  Road estimate
                </T>
                <T kind="time">
                  {Math.round(shownEstimate.durationSeconds / 60)} min ·{" "}
                  {(shownEstimate.distanceMetres / 1000).toFixed(1)} km
                </T>
                <T kind="small" color={c.muted}>
                  {sampleValid
                    ? "Mapbox driving estimate · " +
                      new Date(estimate!.generatedAt).toLocaleTimeString(
                        "en-AU",
                        {
                          timeZone: "Australia/Sydney",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      ) +
                      " Sydney time."
                    : (estimate ? "Latest estimate expired. " : "") +
                      "Mapbox sample from 25 November 2026."}{" "}
                  Allow pickup, boarding and handover time separately.
                </T>
                <Box row wrap gap={8}>
                  {button(
                    busy ? "Checking estimate…" : "Refresh road estimate",
                    refresh,
                    "refresh",
                    "light",
                    busy,
                  )}
                  {button("Open trip", () => go("trip", job.id), "arrow")}
                </Box>
              </>,
            )}
            {card(
              <>
                <T semantic="h2" kind="heading">
                  Route in words
                </T>
                <T>
                  {job.origin} to {job.destination}. Sample directions via{" "}
                  {route.via}.
                </T>
                {route.instructions.map((s, i) => (
                  <T key={i} kind="small">
                    {i + 1}. {s}
                  </T>
                ))}
                <T kind="small" color={c.muted}>
                  Street routing does not verify boarding access. Review the
                  pickup with the rider while parked.
                </T>
              </>,
            )}
          </>
        )}
        {page === "vehicle" &&
          card(
            <>
              <Box row align="center" gap={10}>
                <Icon name="van" color={c.blue} />
                <T semantic="h2" kind="heading">
                  Practice vehicle · WAV 07
                </T>
              </Box>
              <T>
                Record the checks for each accepted trip before leaving for
                pickup.
              </T>
              {checks.map((s) => (
                <T key={s}>• {s}</T>
              ))}
              {current &&
                button(
                  "Open current trip",
                  () => go("trip", current.id),
                  "arrow",
                  "primary",
                )}
            </>,
          )}
        {page === "support" && (
          <>
            {active
              ? card(
                  <>
                    <T semantic="h2" kind="heading">
                      {run.hold
                        ? "Review paused trip"
                        : "Pause this practice trip"}
                    </T>
                    <T>
                      {run.hold
                        ? run.hold
                        : "Record the reason while parked. This exercise saves the issue on this device."}
                    </T>
                    {run.hold
                      ? button(
                          "Issue resolved · resume trip",
                          () => {
                            go("trip", job.id);
                            take({ kind: "resume" });
                          },
                          "check",
                          "primary",
                        )
                      : issueKinds.map((reason) => (
                          <Tap
                            key={reason}
                            label={reason}
                            tone="row"
                            onPress={() => {
                              go("trip", job.id);
                              take({ kind: "pause", reason });
                            }}
                          >
                            <Icon name="pause" color={c.blue} />
                            <T>{reason}</T>
                          </Tap>
                        ))}
                  </>,
                )
              : null}
            {card(
              <>
                <T semantic="h2" kind="heading">
                  Contact and support
                </T>
                {row(
                  "Contact MapAble",
                  "Open the contact page on MapAble.com.au.",
                  "message",
                  () => visit("/contact"),
                )}
                {row(
                  "Driver workspace",
                  "Open the signed-in workspace for real bookings.",
                  "wheel",
                  () => visit("/transport/driver"),
                )}
                {row(
                  "MapAble Transport",
                  "Passenger, provider and driver information.",
                  "globe",
                  () => visit("/transport"),
                )}
                <T bold color={c.danger}>
                  Immediate danger in Australia · call 000.
                </T>
              </>,
            )}
            {card(
              <>
                <T semantic="h2" kind="heading">
                  Practice shift controls
                </T>
                <T>
                  Trips, riders and access instructions in this shift are
                  fictional. Practice actions stay on this device.
                </T>
                <Box row wrap>
                  {button(
                    "Restart practice shift",
                    () => setDialog("reset"),
                    "refresh",
                    "light",
                    !ready,
                  )}
                </Box>
              </>,
            )}
          </>
        )}
        <Box row wrap align="center" justify="space-between" gap={6}>
          <T kind="small" color={c.muted}>
            MapAble Transport · Driver app
          </T>
          {button(
            "Transport on MapAble.com.au",
            () => visit("/transport"),
            "external",
            "link",
          )}
        </Box>
      </Box>
    </Box>
  );
}
