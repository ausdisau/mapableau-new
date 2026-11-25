import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getReadOnlyServiceDirectory } from "../../lib/neon-directory";
import { PUBLIC_SERVICES, communityService, supportHref } from "../../lib/service-directory";

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
          <p>Manage your sign-in details or choose a service to visit.</p>
          <section id="services" aria-labelledby="services-heading">
            <h2 id="services-heading">Your services</h2>
            <p>Each service checks its own membership when you open it.</p>
            <div className="service-grid">
              {PUBLIC_SERVICES.map((s) => (
                <article className="service-card" key={s.id}>
                  <h3>{s.name}</h3>
                  <p>{s.description}</p>

                  <a
                    className="primary-button"
                    href={s.href}
                    rel="noopener noreferrer"
                  >
                    Visit {s.name}
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
            <p>Community conversations are also available on <a href={communityService.href}>{communityService.name}</a>.</p>
          </section>

          <section className="note" id="security">
            <h2>Account and security</h2>
            <p><Link href="/account">Manage sign-in methods and account recovery</Link>.</p>
          </section>

          <section className="note" id="support">
            <h2>Need accessible help?</h2>
            <p><a href={supportHref}>Contact Australian Disability Ltd</a> and let the team know how you would like them to reply.</p>
          </section>

          <footer>
            Australian Disability Ltd
          </footer>
        </main>
      </div>
    </div>
  );
}
