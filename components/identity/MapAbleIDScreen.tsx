"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "@/components/identity/MapAbleIDScreen.module.css";
import type { IdentityMeResponse } from "@/lib/identity/mapable-id-types";

export type IdentitySection =
  | "overview"
  | "security"
  | "delegates"
  | "services"
  | "privacy"
  | "recovery";

export type MapAbleIDIntent =
  | { type: "open_passkey_flow" }
  | { type: "open_mfa_flow" }
  | { type: "review_delegate"; id: string }
  | { type: "review_service"; id: string }
  | { type: "open_recovery_flow" }
  | { type: "review_data_sharing" };

const SECTIONS: ReadonlyArray<{
  id: IdentitySection;
  label: string;
  summary: string;
}> = [
  { id: "overview", label: "My Identity", summary: "Your identity at a glance" },
  {
    id: "security",
    label: "Sign-in & Security",
    summary: "Passkeys and additional protection",
  },
  {
    id: "delegates",
    label: "People I Trust",
    summary: "Specific, revocable assistance",
  },
  {
    id: "services",
    label: "Connected Services",
    summary: "Choose which apps can connect",
  },
  {
    id: "privacy",
    label: "Privacy & Consent",
    summary: "Know what you share",
  },
  {
    id: "recovery",
    label: "Account Recovery",
    summary: "Get back in without losing control",
  },
];

function renderLabel(state: string) {
  return state.replaceAll("_", " ");
}

function defaultIntentHandler(
  intent: MapAbleIDIntent,
  router: ReturnType<typeof useRouter>,
) {
  switch (intent.type) {
    case "open_passkey_flow":
    case "open_mfa_flow":
      router.push("/account/security");
      return;
    case "review_delegate":
      router.push("/participant/delegates");
      return;
    case "review_service":
      router.push("/dashboard/identity#services");
      return;
    case "review_data_sharing":
      router.push("/participant/privacy");
      return;
    case "open_recovery_flow":
      router.push("/forgot-password");
      return;
    default: {
      const _exhaustive: never = intent;
      return _exhaustive;
    }
  }
}

export function MapAbleIDScreen({
  snapshot,
  onSecurityIntent,
}: {
  snapshot: IdentityMeResponse;
  onSecurityIntent?: (intent: MapAbleIDIntent) => void;
}) {
  const router = useRouter();
  const [section, setSection] = useState<IdentitySection>("overview");
  const [largerText, setLargerText] = useState(false);
  const [simpleLanguage, setSimpleLanguage] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const dispatch = (intent: MapAbleIDIntent) => {
    setAnnouncement(
      "Opening a verified MapAble page. No security settings changed yet.",
    );
    if (onSecurityIntent) {
      onSecurityIntent(intent);
      return;
    }
    defaultIntentHandler(intent, router);
  };

  const move = (to: IdentitySection) => {
    setSection(to);
    setAnnouncement(
      `${SECTIONS.find((x) => x.id === to)?.label ?? "Section"} opened. No account settings changed.`,
    );
  };

  const initial =
    snapshot.displayName.trim().charAt(0).toUpperCase() || "M";

  return (
    <div className={`${styles.root} ${largerText ? styles.larger : ""}`}>
      <a className={styles.skip} href="#mapable-id-main">
        Skip to identity content
      </a>
      <div className={styles.frame}>
        <aside className={styles.side} aria-label="MapAbleID navigation">
          <div className={styles.brand}>
            <span className={styles.symbol} aria-hidden="true">
              M
            </span>
            <div>
              <strong>
                MapAble<span>ID</span>
              </strong>
              <small>Australian Disability Ltd · AD.iD</small>
            </div>
          </div>
          <p className={styles.menuLabel}>YOUR ACCOUNT</p>
          <nav aria-label="Identity sections">
            {SECTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.nav} ${section === item.id ? styles.navActive : ""}`}
                aria-current={section === item.id ? "page" : undefined}
                onClick={() => move(item.id)}
              >
                <span className={styles.navText}>
                  {item.label}
                  <small>{item.summary}</small>
                </span>
              </button>
            ))}
          </nav>
          <div className={styles.sideBottom}>
            <strong>Identity without barriers</strong>
            <p>
              Choose your own communication, trusted people and recovery
              pathway.
            </p>
          </div>
        </aside>
        <div className={styles.workspace}>
          <header className={styles.top}>
            <div>
              <span className={styles.eyebrow}>MAPABLE ACCOUNT</span>
              <p>Identity &amp; access</p>
            </div>
            <div className={styles.tools}>
              <span className={styles.demo}>Server read-only view</span>
              <button
                type="button"
                className={styles.outline}
                aria-pressed={largerText}
                onClick={() => setLargerText((x) => !x)}
              >
                {largerText ? "Standard text" : "Larger text"}
              </button>
            </div>
          </header>
          <main id="mapable-id-main" className={styles.main}>
            <p className={styles.live} role="status" aria-live="polite">
              {announcement}
            </p>
            {section === "overview" ? (
              <>
                <section
                  className={styles.hero}
                  aria-labelledby="mid-hero-heading"
                >
                  <div className={styles.heroCopy}>
                    <span className={styles.kicker}>
                      ONE IDENTITY · YOUR CHOICE
                    </span>
                    <h1 id="mid-hero-heading">Your life. Your identity.</h1>
                    <p>
                      {simpleLanguage
                        ? "You decide who can see your information and which apps you use."
                        : "A simpler way to sign in and stay in control of your information, trusted people and connected services."}
                    </p>
                    <div className={styles.heroActions}>
                      <button type="button" onClick={() => move("security")}>
                        Review sign-in options
                      </button>
                      <button type="button" onClick={() => move("delegates")}>
                        Review shared access
                      </button>
                    </div>
                  </div>
                </section>
                <div className={styles.person}>
                  <div className={styles.avatar} aria-hidden="true">
                    {initial}
                  </div>
                  <div>
                    <strong>{snapshot.displayName}</strong>
                    <p>{snapshot.accountReference}</p>
                  </div>
                  <span className={styles.mutedState}>
                    Issuer: {snapshot.issuer} · {snapshot.policyShadow.reason}
                  </span>
                </div>
                <section className={styles.tiles} aria-label="Account areas">
                  <button
                    type="button"
                    className={styles.tile}
                    onClick={() => move("security")}
                  >
                    <span className={styles.tileIcon}>01</span>
                    <strong>Secure sign-in</strong>
                    <small>Explore passkeys and MFA</small>
                  </button>
                  <button
                    type="button"
                    className={styles.tile}
                    onClick={() => move("services")}
                  >
                    <span className={styles.tileIcon}>02</span>
                    <strong>My services</strong>
                    <small>Control access by app</small>
                  </button>
                  <button
                    type="button"
                    className={styles.tile}
                    onClick={() => move("privacy")}
                  >
                    <span className={styles.tileIcon}>03</span>
                    <strong>My privacy</strong>
                    <small>Make informed sharing choices</small>
                  </button>
                </section>
              </>
            ) : null}
            {section === "security" ? (
              <section className={styles.content}>
                <span className={styles.eyebrow}>ACCOUNT PROTECTION</span>
                <h1>Sign-in and security</h1>
                <p>
                  Use a sign-in method that works for you. A passkey or YubiKey
                  requires a genuine server-verified enrolment flow.
                </p>
                <div className={styles.stack}>
                  {snapshot.security.map((item) => (
                    <article className={styles.listCard} key={item.id}>
                      <div>
                        <strong>{item.title}</strong>
                        <p>Status: {renderLabel(item.status)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          dispatch(
                            item.kind === "passkey" ||
                              item.kind === "security_key"
                              ? { type: "open_passkey_flow" }
                              : { type: "open_mfa_flow" },
                          )
                        }
                      >
                        Review secure setup
                      </button>
                    </article>
                  ))}
                </div>
                {snapshot.sessions.length > 0 ? (
                  <div className={styles.stack} aria-label="Active sessions">
                    <h2 className="text-lg font-semibold">Active sessions</h2>
                    {snapshot.sessions.map((session) => (
                      <article className={styles.listCard} key={session.id}>
                        <div>
                          <strong>Session {session.id.slice(0, 8)}…</strong>
                          <p>
                            Last seen {session.lastSeenAt}
                            {session.userAgent
                              ? ` · ${session.userAgent.slice(0, 80)}`
                              : ""}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}
            {section === "delegates" ? (
              <section className={styles.content}>
                <span className={styles.eyebrow}>CONTROLLED ASSISTANCE</span>
                <h1>People I trust</h1>
                <p>
                  Help is different from taking over. A support person needs
                  explicit, limited permission, with an expiry and an easy way
                  to withdraw it.
                </p>
                <div className={styles.stack}>
                  {snapshot.delegates.length === 0 ? (
                    <p>No active or recorded delegates for this account.</p>
                  ) : (
                    snapshot.delegates.map((d) => (
                      <article key={d.id} className={styles.listCard}>
                        <div>
                          <strong>{d.label}</strong>
                          <p>
                            {d.access} · {renderLabel(d.status)}
                            {d.purpose ? ` · ${d.purpose}` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            dispatch({ type: "review_delegate", id: d.id })
                          }
                        >
                          Review scope
                        </button>
                      </article>
                    ))
                  )}
                </div>
              </section>
            ) : null}
            {section === "services" ? (
              <section className={styles.content} id="services">
                <span className={styles.eyebrow}>AD.iD FEDERATION</span>
                <h1>Connected services</h1>
                <p>
                  Choose each connection separately. A signed-in account alone
                  does not grant access to your care, transport or private
                  records.
                </p>
                <div className={styles.serviceGrid}>
                  {snapshot.services.map((s) => (
                    <article key={s.id} className={styles.service}>
                      <span
                        className={styles.serviceSymbol}
                        aria-hidden="true"
                      >
                        {s.title.slice(0, 1)}
                      </span>
                      <strong>{s.title}</strong>
                      <p>Connection: {renderLabel(s.status)}</p>
                      <button
                        type="button"
                        onClick={() =>
                          dispatch({ type: "review_service", id: s.id })
                        }
                      >
                        Review connection
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
            {section === "privacy" ? (
              <section className={styles.content}>
                <span className={styles.eyebrow}>YOUR DATA</span>
                <h1>Privacy and consent</h1>
                <p>
                  Keep decisions about profile sharing, transport, health,
                  analytics and optional AI processing separate. No optional
                  consent is assumed.
                </p>
                <div className={styles.notice}>
                  <strong>What happens when I choose to share?</strong>
                  <p>
                    MapAbleID shows the recipient, purpose, exact information,
                    expiry and a clear withdrawal action before confirming.
                  </p>
                </div>
                <div className={styles.stack}>
                  {snapshot.consents.length === 0 ? (
                    <p>No consent records to display.</p>
                  ) : (
                    snapshot.consents.map((c) => (
                      <article key={c.id} className={styles.listCard}>
                        <div>
                          <strong>{c.purpose}</strong>
                          <p>
                            {c.scope} · {c.status}
                            {c.expiryDate ? ` · expires ${c.expiryDate}` : ""}
                          </p>
                        </div>
                      </article>
                    ))
                  )}
                </div>
                <button
                  className={styles.action}
                  type="button"
                  onClick={() => dispatch({ type: "review_data_sharing" })}
                >
                  Review sharing permissions
                </button>
              </section>
            ) : null}
            {section === "recovery" ? (
              <section className={styles.content}>
                <span className={styles.eyebrow}>HELP WHEN YOU NEED IT</span>
                <h1>Account recovery</h1>
                <p>
                  Lost a phone or key, or cannot use one sign-in method?
                  Recovery must offer an accessible, independent human pathway
                  without requiring you to hand over your password.
                </p>
                <div className={styles.notice}>
                  <strong>You stay the decision-maker.</strong>
                  <p>
                    We will never assume a support person is entitled to your
                    account because they help you communicate.
                  </p>
                </div>
                <div className={styles.stack}>
                  {snapshot.recovery.map((option) => (
                    <article key={option.id} className={styles.listCard}>
                      <div>
                        <strong>{option.title}</strong>
                        <p>{option.description}</p>
                      </div>
                      {option.href ? (
                        <button
                          type="button"
                          onClick={() =>
                            dispatch({ type: "open_recovery_flow" })
                          }
                        >
                          Open
                        </button>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
            <footer className={styles.footer}>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={simpleLanguage}
                  onChange={(e) => setSimpleLanguage(e.target.checked)}
                />
                Simpler explanations
              </label>
              <span>
                Read-only MapAbleID · Mutations open verified MapAble pages
              </span>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}

export default MapAbleIDScreen;
