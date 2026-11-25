import Link from "next/link";
import { requireAccessPrincipal } from "../../../../lib/access-principal";
import {
  ownRequests,
  requestDatabase,
  type RequestRow,
} from "../../../../lib/access-requests";
import { serviceFor, supportHref } from "../../../../lib/service-directory";

export const dynamic = "force-dynamic";
export default async function RequestConfirmation() {
  const who = await requireAccessPrincipal();
  let rows: RequestRow[] | null = null;
  try {
    const db = requestDatabase();
    if (db) rows = await ownRequests(db, who);
  } catch {
    /* Render the support link on a read failure. */
  }
  return (
    <main id="main-content" tabIndex={-1} className="container signin">
      <Link href="/dashboard">Back to the dashboard</Link>
      <h1>My access requests</h1>
      {rows === null ? (
        <p role="status">Your requests could not be loaded.</p>
      ) : rows.length ? (
        <ul>
          {rows.map((row) => (
            <li key={row.id}>
              {serviceFor(row.service)?.name} · {row.status}
            </li>
          ))}
        </ul>
      ) : (
        <p>You have no service access requests.</p>
      )}
      <p>
        <Link href="/access/request">Request access to a service</Link>
      </p>
      <a href={supportHref}>Get help with a request</a>
    </main>
  );
}
