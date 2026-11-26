"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
  Route,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  formatDateHeading,
  isValidDateOnly,
} from "@/lib/care/scheduler/ui-model";
import {
  sampleCareAppointment,
  takeAppointmentDraft,
} from "@/lib/transport/passenger-appointment";
import {
  accessOptions,
  canTransition,
  changeStage,
  communications,
  hasAssignedDriver,
  newDraft,
  places,
  PRACTICE_TRIPS_KEY,
  restoreTrips,
  sampleQuote,
  stages,
  validateDraft,
  type PracticeTrip,
  type Stage,
  type TripDraft,
} from "@/lib/transport/passenger-practice";
import styles from "./passenger.module.css";

type Screen = "trips" | "plan" | "trip";
const mainAction: Partial<Record<Stage, { label: string; next: Stage }>> = {
  requested: { label: "Review sample quote", next: "quoted" },
  quoted: { label: "Accept quote", next: "accepted" },
  accepted: { label: "Assign practice driver", next: "assigned" },
  assigned: { label: "Show driver on the way", next: "approaching" },
  approaching: { label: "Confirm pickup", next: "onboard" },
  onboard: { label: "Mark arrival", next: "arrived" },
  arrived: { label: "Complete journey", next: "complete" },
};

function TripSummary({ trip }: { trip: TripDraft }) {
  return (
    <aside className={styles.ticket} aria-label="Your journey in words">
      <div className={styles.ticketHead}>
        <Route aria-hidden="true" size={23} />
        <h2>Your journey</h2>
      </div>
      <ol className={styles.stops}>
        {[
          ["Pickup", trip.pickup],
          ["Destination", trip.destination],
        ].map(([label, place]) => {
          const [name, address] = place.split(" — ");
          return (
            <li key={label}>
              <span>{label}</span>
              <strong>{name}</strong>
              <small>{address}</small>
            </li>
          );
        })}
      </ol>
      <p className={styles.when}>
        <CalendarDays aria-hidden="true" size={18} />
        {isValidDateOnly(trip.date) && trip.time
          ? formatDateHeading(trip.date) + " · " + trip.time + " Sydney time"
          : "Choose a date and time"}
      </p>
    </aside>
  );
}

export function PassengerPractice({
  fromAppointment,
}: {
  fromAppointment: boolean;
}) {
  const [screen, setScreen] = useState<Screen>(
    fromAppointment ? "plan" : "trips",
  );
  const [draft, setDraft] = useState<TripDraft>(newDraft);
  const [trips, setTrips] = useState<PracticeTrip[]>([]);
  const [selected, setSelected] = useState("");
  const [ready, setReady] = useState(false);
  const [storageMessage, setStorageMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [decision, setDecision] = useState<"cancel" | "share" | null>(null);
  const [preference, setPreference] = useState<string>(communications[0]);
  const [focusVersion, setFocusVersion] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const decisionHeading = useRef<HTMLHeadingElement>(null);
  const initialized = useRef<boolean | null>(null);
  const trip = trips.find((t) => t.id === selected);
  const previewTrip = screen === "trip" && trip ? trip : draft;

  useEffect(() => {
    if (initialized.current !== fromAppointment) {
      initialized.current = fromAppointment;
      setScreen(fromAppointment ? "plan" : "trips");
      const appointment = fromAppointment ? takeAppointmentDraft() : null;
      setDraft({
        ...newDraft(),
        ...(appointment || sampleCareAppointment(new Date())),
      });
      if (fromAppointment)
        setNotice(
          appointment
            ? "The appointment date and time are ready to edit."
            : "Choose a date and time for your practice trip.",
        );
    }
    try {
      setTrips(restoreTrips(localStorage.getItem(PRACTICE_TRIPS_KEY)));
    } catch {
      setStorageMessage(
        "Browser storage is unavailable. Trips will last until you leave this page.",
      );
    }
    setReady(true);
    function sync(event: StorageEvent) {
      if (event.key === PRACTICE_TRIPS_KEY || event.key === null) {
        setTrips(restoreTrips(event.key ? event.newValue : null));
        setDecision(null);
      }
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [fromAppointment]);
  useEffect(() => {
    if (focusVersion) heading.current?.focus();
  }, [focusVersion]);
  useEffect(() => {
    if (decision) decisionHeading.current?.focus();
  }, [decision]);

  function go(next: Screen, message = "") {
    const url = new URL(window.location.href);
    if (url.searchParams.get("plan") === "appointment") {
      url.searchParams.delete("plan");
      window.history.replaceState(
        window.history.state,
        "",
        url.pathname + url.search + url.hash,
      );
    }
    setDecision(null);
    setError("");
    setNotice(message);
    setScreen(next);
    setFocusVersion((n) => n + 1);
  }
  function save(change: (current: PracticeTrip[]) => PracticeTrip[]) {
    let current = trips;
    try {
      if (!storageMessage)
        current = restoreTrips(localStorage.getItem(PRACTICE_TRIPS_KEY));
    } catch {
      /* keep the in-memory trips */
    }
    const updated = change(current);
    setTrips(updated);
    try {
      localStorage.setItem(PRACTICE_TRIPS_KEY, JSON.stringify(updated));
    } catch {
      setStorageMessage(
        "Browser storage is unavailable. Trips will last until you leave this page.",
      );
    }
  }
  function updateTrip(change: (current: PracticeTrip) => PracticeTrip) {
    save((current) => current.map((t) => (t.id === selected ? change(t) : t)));
  }
  function openTrip(t: PracticeTrip) {
    setSelected(t.id);
    setPreference(t.communication);
    go("trip");
  }
  function plan() {
    setDraft({ ...newDraft(), ...sampleCareAppointment(new Date()) });
    go("plan");
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const issue = validateDraft(draft);
    if (issue) {
      setError(issue);
      return;
    }
    const t: PracticeTrip = {
      ...draft,
      id: crypto.randomUUID(),
      stage: "requested",
      shared: false,
    };
    save((current) => [t, ...current]);
    openTrip(t);
  }
  function move(stage: Stage) {
    if (!trip || !canTransition(trip.stage, stage)) return;
    updateTrip((t) => changeStage(t, stage));
    go("trip", stages[stage]);
  }
  function driverNote(access: string[], communication: string) {
    return [
      ...access,
      ...(communication === communications[0] ? [] : [communication]),
    ].join(". ");
  }
  function share() {
    updateTrip((t) =>
      hasAssignedDriver(t.stage) && driverNote(t.access, preference)
        ? { ...t, communication: preference, shared: true }
        : t,
    );
    go("trip", "Your note is now visible in this practice driver’s view.");
  }
  const summary = trip && sampleQuote(trip.time);
  const action = trip && mainAction[trip.stage];
  const title =
    screen === "plan"
      ? "Plan a trip"
      : screen === "trip" && trip
        ? stages[trip.stage]
        : "My trips";
  return (
    <div className={styles.app} data-passenger-practice="">
      <div className={styles.inner}>
        <Link className={styles.back} href="/transport">
          <ArrowLeft aria-hidden="true" size={16} /> MapAble Transport
        </Link>
        <div className={styles.intro}>
          <div>
            <p className={styles.eyebrow}>
              <span /> Passenger practice
            </p>
            <h1 ref={heading} tabIndex={-1}>
              {title}
            </h1>
            <p>
              {screen === "plan"
                ? "Choose how you want to travel. You can review the practice quote before accepting."
                : screen === "trip" && trip
                  ? "Follow your practice journey at your own pace."
                  : "Plan it your way. Try an accessible journey with sample places in Parramatta."}
            </p>
          </div>
          <div className={styles.demo}>
            <ShieldCheck aria-hidden="true" size={20} />
            <span>
              Practice only
              <br />
              <small>No bookings or charges</small>
            </span>
          </div>
        </div>
        {storageMessage && <p className={styles.notice}>{storageMessage}</p>}
        <p
          role="status"
          aria-live="polite"
          className={notice ? styles.notice : styles.sr}
        >
          {notice}
        </p>
        <div className={styles.grid}>
          <div className={styles.card}>
            {screen === "trips" || (screen === "trip" && !trip) ? (
              <>
                <div className={styles.sectionTitle}>
                  <Ticket aria-hidden="true" />
                  <h2>Practice trips</h2>
                </div>
                {trips.length ? (
                  <ul className={styles.tripList}>
                    {trips.map((t) => (
                      <li key={t.id}>
                        <button type="button" onClick={() => openTrip(t)}>
                          <span>
                            <strong>
                              {t.pickup.split(" — ")[0]} to{" "}
                              {t.destination.split(" — ")[0]}
                            </strong>
                            <small>
                              {formatDateHeading(t.date)} · {t.time} ·{" "}
                              {stages[t.stage]}
                            </small>
                          </span>
                          <ArrowRight aria-hidden="true" size={20} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={styles.empty}>
                    <MapPin aria-hidden="true" />
                    <h3>Your trips will appear here</h3>
                    <p>
                      Start with a sample pickup and destination. You can add a
                      supporter and choose your communication preferences.
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  className={styles.primary}
                  disabled={!ready}
                  onClick={plan}
                >
                  Plan a trip <ArrowRight aria-hidden="true" size={17} />
                </button>
              </>
            ) : screen === "plan" ? (
              <form onSubmit={submit} noValidate>
                <h2>Trip details</h2>
                <p className={styles.hint}>
                  Choose from the sample places. All times are in Sydney.
                </p>
                {error && (
                  <p role="alert" className={styles.error}>
                    {error}
                  </p>
                )}
                <div className={styles.fields}>
                  {(["pickup", "destination"] as const).map((key) => (
                    <label key={key}>
                      {key === "pickup" ? "Pickup" : "Destination"}
                      <select
                        value={draft[key]}
                        onChange={(e) =>
                          setDraft({ ...draft, [key]: e.target.value })
                        }
                      >
                        {places.map((place) => (
                          <option key={place}>{place}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <div className={styles.pair}>
                    <label>
                      Travel date
                      <input
                        required
                        type="date"
                        value={draft.date}
                        onChange={(e) =>
                          setDraft({ ...draft, date: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Pickup time
                      <input
                        required
                        type="time"
                        value={draft.time}
                        onChange={(e) =>
                          setDraft({ ...draft, time: e.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    Supporter travel
                    <select
                      value={draft.supporter ? "yes" : "no"}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          supporter: e.target.value === "yes",
                        })
                      }
                    >
                      <option value="no">
                        No, I will travel without a supporter
                      </option>
                      <option value="yes">
                        Yes, a supporter will travel with me
                      </option>
                    </select>
                  </label>
                  <fieldset>
                    <legend>Access arrangements</legend>
                    {accessOptions.map((option) => (
                      <label key={option} className={styles.check}>
                        <input
                          type="checkbox"
                          checked={draft.access.includes(option)}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              access: e.target.checked
                                ? [...draft.access, option]
                                : draft.access.filter((a) => a !== option),
                            })
                          }
                        />
                        {option}
                      </label>
                    ))}
                  </fieldset>
                  <label>
                    Communication preference
                    <select
                      value={draft.communication}
                      onChange={(e) =>
                        setDraft({ ...draft, communication: e.target.value })
                      }
                    >
                      {communications.map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  </label>
                  <p className={styles.hint}>
                    Private until you choose to share it with an assigned
                    practice driver.
                  </p>
                </div>
                <div className={styles.actions}>
                  <button
                    type="submit"
                    disabled={!ready}
                    className={styles.primary}
                  >
                    Send practice request{" "}
                    <ArrowRight aria-hidden="true" size={17} />
                  </button>
                  <button type="button" onClick={() => go("trips")}>
                    Back to my trips
                  </button>
                </div>
              </form>
            ) : trip && summary ? (
              <>
                <h2>Trip details</h2>
                <dl className={styles.details}>
                  <div>
                    <dt>Supporter</dt>
                    <dd>
                      {trip.supporter
                        ? "Travelling with a supporter"
                        : "Travelling without a supporter"}
                    </dd>
                  </div>
                  <div>
                    <dt>Access arrangements</dt>
                    <dd>{trip.access.join(" · ") || "None selected"}</dd>
                  </div>
                </dl>
                {trip.stage !== "requested" && trip.stage !== "cancelled" && (
                  <div className={styles.quote}>
                    <span>Practice quote</span>
                    <strong>{summary.fare}</strong>
                    <p>
                      Estimated fare · Pickup window {summary.window} Sydney
                      time
                    </p>
                  </div>
                )}
                {hasAssignedDriver(trip.stage) && (
                  <section
                    className={styles.sharing}
                    aria-label="Driver sharing"
                  >
                    <h3>What your driver can see</h3>
                    {trip.shared ? (
                      <>
                        <p>Shared for this trip</p>
                        <blockquote>
                          {driverNote(trip.access, trip.communication)}
                        </blockquote>
                        <button
                          type="button"
                          onClick={() => {
                            updateTrip((t) => ({ ...t, shared: false }));
                            go(
                              "trip",
                              "Your note was removed from the driver view.",
                            );
                          }}
                        >
                          Withdraw sharing
                        </button>
                      </>
                    ) : (
                      <>
                        <p>
                          Sharing is off. Preview the access arrangements and
                          communication preference you want the practice driver
                          to see.
                        </p>
                        <label>
                          Practice preference
                          <select
                            value={preference}
                            onChange={(e) => {
                              setPreference(e.target.value);
                              setDecision(null);
                            }}
                          >
                            {communications.map((value) => (
                              <option key={value}>{value}</option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          disabled={!driverNote(trip.access, preference)}
                          onClick={() => setDecision("share")}
                        >
                          Preview sharing
                        </button>
                      </>
                    )}
                    {decision === "share" && (
                      <div className={styles.confirm}>
                        <h4 ref={decisionHeading} tabIndex={-1}>
                          Preview for the assigned driver
                        </h4>
                        <blockquote>
                          {driverNote(trip.access, preference)}
                        </blockquote>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            className={styles.primary}
                            onClick={share}
                          >
                            Share for this trip
                          </button>
                          <button type="button" onClick={() => go("trip")}>
                            Keep private
                          </button>
                        </div>
                      </div>
                    )}
                  </section>
                )}
                <div className={styles.actions}>
                  {action && (
                    <button
                      type="button"
                      className={styles.primary}
                      onClick={() => move(action.next)}
                    >
                      {action.label} <ArrowRight aria-hidden="true" size={17} />
                    </button>
                  )}
                  {trip.stage === "quoted" && (
                    <button type="button" onClick={() => move("declined")}>
                      Decline offer
                    </button>
                  )}
                </div>
                {canTransition(trip.stage, "cancelled") &&
                  (decision === "cancel" ? (
                    <div className={styles.confirm}>
                      <h3 ref={decisionHeading} tabIndex={-1}>
                        Cancel this practice trip?
                      </h3>
                      <p>
                        Any shared note will be removed from the driver view.
                      </p>
                      <div className={styles.actions}>
                        <button type="button" onClick={() => go("trip")}>
                          Keep trip
                        </button>
                        <button type="button" onClick={() => move("cancelled")}>
                          Confirm cancellation
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={styles.textButton}
                      onClick={() => setDecision("cancel")}
                    >
                      Cancel trip
                    </button>
                  ))}
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={() => go("trips")}
                >
                  <ArrowLeft aria-hidden="true" size={16} /> Back to my trips
                </button>
              </>
            ) : null}
          </div>
          <TripSummary trip={previewTrip} />
        </div>
        <nav aria-label="MapAble passenger services" className={styles.links}>
          <Link href="/transport/request" prefetch={false}>
            Signed-in trip request
          </Link>
          <Link href="/transport/dashboard" prefetch={false}>
            Signed-in trip dashboard
          </Link>
          <Link href="/contact">Contact MapAble</Link>
        </nav>
      </div>
    </div>
  );
}
