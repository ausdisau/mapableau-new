import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { adidFlags } from "../../lib/feature-flags";
import { getReadOnlyServiceDirectory } from "../../lib/neon-directory";
import { PUBLIC_SERVICES } from "../../lib/service-directory";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await currentUser();
  const directory = await getReadOnlyServiceDirectory();

  return (
    <div className="app-shell">
      <header className="header">
        <Link href="/dashboard" className="brand" aria-label="AD.iD home">
          AD<span className="accent">.iD</span>
        </Link>
        <span>Your secure account for Australian Disability services</span>
        <UserButton />
      </header>
      <div className="shell-content">
        <nav className="sidebar" aria-label="Portal navigation">
          <a href="#main-content" aria-current="page">
            Home
          </a>
          <a href="#services">My services</a>
          <Link href="/account">Account and security</Link>
          <a href="#support">Support and accessibility</a>
        </nav>
        <main className="dashboard-main" id="main-content">
          <h1>Welcome back, {user?.firstName?.trim() || "there"}</h1>
          <p>
            Service control centre — discover public service links and manage
            your AD.iD security. Each external service checks access separately.
          </p>

          <section id="services" aria-labelledby="services-heading">
            <h2 id="services-heading">Your services</h2>
            <p>
              These are public service links, not verified entitlements. Cross-app
              SSO is not asserted
              {adidFlags.crossAppFederationEnabled()
                ? " (federation flag unexpectedly ON — disable before pilot)."
                : " (federation flag OFF)."}
            </p>
            <div className="service-grid">
              {PUBLIC_SERVICES.map((s) => (
                <article className="service-card" key={s.id}>
                  <h3>{s.name}</h3>
                  <p>{s.description}</p>
                  <p className="service-status">Access not verified</p>
                  <a
                    className="primary-button"
                    href={s.href}
                    rel="noopener noreferrer"
                  >
                    Open {s.name} (external site)
                  </a>
                </article>
              ))}
            </div>
            {directory.status === "ready" && (
              <section aria-label="Additional service directory">
                <h3>Other services</h3>
                <ul>
                  {directory.entries.map((r) => (
                    <li key={r.id}>
                      {r.href ? (
                        <a href={r.href} rel="noopener noreferrer">
                          {r.name} (external site)
                        </a>
                      ) : (
                        <span>{r.name} — link unverified</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {directory.status === "unavailable" && (
              <p role="status">
                Additional services are temporarily unavailable. Use the main
                links above.
              </p>
            )}
            {directory.status === "disabled" && (
              <p role="status">
                Optional Neon directory is disabled (
                <code>ADID_DIRECTORY_ENABLED</code> /
                <code>ADID_NEON_DIRECTORY_ENABLED</code> false).
              </p>
            )}
          </section>

          <section className="note" id="security">
            <h2>Account and security</h2>
            <p>
              AD.iD sign-in is active only in this application. Wix Members,
              MapAble, community and reader accounts are not linked automatically.
              Use{" "}
              <Link href="/account">Account and security</Link> for MFA, passkeys
              and accessible recovery.
            </p>
            <p role="status">
              Wix integration stages: public link{" "}
              {adidFlags.wixPublicLinkEnabled() ? "flag ON" : "flag OFF"}; identity
              linking{" "}
              {adidFlags.accountLinkingEnabled() ? "flag ON" : "flag OFF"}; session
              handoff{" "}
              {adidFlags.wixSessionBridgeEnabled() ? "flag ON" : "flag OFF"}. Stages
              2–3 must stay off until dual-proof and one-time handoff reviews
              complete.
            </p>
          </section>

          <section className="note" id="support">
            <h2>Need accessible help?</h2>
            <p>
              Use a preferred communication method to contact Australian
              Disability Ltd using its published support channels. This portal
              supports keyboard, screen readers, zoom/reflow and reduced motion.
            </p>
          </section>

          <footer>
            © Australian Disability Ltd · Preview · No cross-service access
            guarantees
          </footer>
        </main>
      </div>
    </div>
  );
}
