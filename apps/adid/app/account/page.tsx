import { UserProfile } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { supportHref } from "../../lib/service-directory";

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
      <main className="container" id="main-content" tabIndex={-1}>
        <h1>Account and security</h1>
        <p>
          Manage your contact details, sign-in methods and account security.
        </p>
        <p><a href={supportHref}>Get help with account access</a></p>
        <UserProfile />
      </main>
    </div>
  );
}
