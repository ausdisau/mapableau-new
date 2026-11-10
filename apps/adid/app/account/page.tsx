import { UserProfile } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { adidFlags } from "../../lib/feature-flags";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="app-shell">
      <header className="header">
        <Link href="/dashboard" className="brand" aria-label="AD.iD home">
          AD<span className="accent">.iD</span>
        </Link>
        <span>Account and security</span>
        <nav aria-label="Account shortcuts">
          <Link href="/dashboard">Service control centre</Link>
        </nav>
      </header>
      <main className="container" id="main-content">
        <h1>Account and security</h1>
        <p>
          Manage MFA, passkeys and recovery options through Clerk. Sign-out is
          available from the profile menu. Tokens are never placed in the page
          URL or localStorage by AD.iD.
        </p>
        <section className="note" aria-labelledby="gates-heading">
          <h2 id="gates-heading">Integration gates (all off in this sandbox)</h2>
          <ul>
            <li>
              Account linking:{" "}
              {adidFlags.accountLinkingEnabled() ? "ON" : "OFF (required)"}
            </li>
            <li>
              Wix session bridge:{" "}
              {adidFlags.wixSessionBridgeEnabled() ? "ON" : "OFF (required)"}
            </li>
            <li>
              Cross-app federation:{" "}
              {adidFlags.crossAppFederationEnabled() ? "ON" : "OFF (required)"}
            </li>
            <li>
              Directory: {adidFlags.directoryEnabled() ? "ON" : "OFF"}
            </li>
          </ul>
        </section>
        <UserProfile />
      </main>
    </div>
  );
}
