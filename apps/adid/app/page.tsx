import { Show } from "@clerk/nextjs";
import Link from "next/link";
import { Suspense } from "react";
import AccessibleButton from "../components/AccessibleButton";

import { hasClerkTenant } from "../lib/clerk-config";
import { PUBLIC_SERVICES, supportHref } from "../lib/service-directory";

export const dynamic = "force-dynamic";

export default function Home() {
  const entry = (
    <div className="entry-actions">
      <AccessibleButton href="/sign-in">
        Sign in to AD.iD
      </AccessibleButton>
      <AccessibleButton variant="outline" href="/sign-up">
        Create an account
      </AccessibleButton>
    </div>
  );
  return (
    <>
      <header className="identity-bar">
        <Link href="/" className="brand" aria-label="AD.iD home">
          AD<span className="accent">.iD</span>
        </Link>
        <span>Australian Disability Ltd</span>
        <a href={supportHref}>Get help</a>
      </header>
      <main className="identity-home container" id="main-content" tabIndex={-1}>
        <section className="identity-intro" aria-labelledby="entry-title">
          <h1 id="entry-title">Your AD.iD account</h1>
          <p>
            Sign in or register to manage your account with Australian
            Disability Ltd. Each service manages its own membership and
            permissions.
          </p>
          {hasClerkTenant() ? (
            <Suspense fallback={<p role="status">Loading account options…</p>}>
              <Show when="signed-out">{entry}</Show>
              <Show when="signed-in">
                <Link className="primary-button" href="/dashboard">
                  Open my dashboard
                </Link>
              </Show>
            </Suspense>
          ) : (
            entry
          )}
        </section>
        <section aria-labelledby="services-title">
          <h2 id="services-title">Explore the services</h2>
          <ul className="home-services">
            {PUBLIC_SERVICES.map((s) => (
              <li key={s.id}>
                <h3>
                  <a href={s.href}>{s.name}</a>
                </h3>
                <p>{s.description}</p>
              </li>
            ))}
          </ul>
        </section>
        <p className="help-line">
          Need help signing in?{" "}
          <a href={supportHref}>Contact Australian Disability Ltd</a>.
        </p>
      </main>
    </>
  );
}
