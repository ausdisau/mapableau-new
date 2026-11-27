import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAccessPrincipal } from "../../../lib/access-principal";
import {
  pendingRequests,
  requestDatabase,
  reviewerServices,
  reviewRequest,
  type RequestRow,
} from "../../../lib/access-requests";
import { serviceFor } from "../../../lib/service-directory";

export const dynamic = "force-dynamic";
async function reviewer() {
  const who = await requireAccessPrincipal();
  const allowed = reviewerServices(
    who.subject,
    process.env.ADID_ACCESS_REVIEWERS,
  );
  if (!allowed.length) notFound();
  return { who, allowed };
}

async function recordDecision(form: FormData) {
  "use server";
  const { who, allowed } = await reviewer();
  let outcome = "unavailable";
  try {
    const db = requestDatabase();
    if (db)
      outcome = (await reviewRequest(
        db,
        who,
        allowed,
        String(form.get("requestId")),
        String(form.get("decision")),
      ))
        ? "saved"
        : "changed";
  } catch {
    /* Show a retry message without exposing database errors. */
  }
  redirect("/admin/access-requests?state=" + outcome);
}

export default async function ReviewRequests({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { who, allowed } = await reviewer();
  const { state } = await searchParams;
  let rows: RequestRow[] | null = null;
  try {
    const db = requestDatabase();
    if (db) rows = await pendingRequests(db, who, allowed);
  } catch {
    /* Render the unavailable state. */
  }
  return (
    <main className="container signin" id="main-content" tabIndex={-1}>
      <Link href="/dashboard">Back to the dashboard</Link>
      <h1>Review access requests</h1>
      <p>
        Record a referral or close a request. The service owner manages
        membership.
      </p>
      {state === "saved" && <p role="status">Decision recorded.</p>}
      {state === "changed" && (
        <p role="status">This request is no longer available to review.</p>
      )}
      {(state === "unavailable" || rows === null) && (
        <p role="alert">The request queue is unavailable. Try again.</p>
      )}
      {rows?.length === 0 && <p>No pending requests for your services.</p>}
      {rows?.map((row) => (
        <form key={row.id} action={recordDecision}>
          <fieldset>
            <legend>
              {serviceFor(row.service)?.name} · {row.subject}
            </legend>
            <input type="hidden" name="requestId" value={row.id} />
            <button type="submit" name="decision" value="referred">
              Mark referred
            </button>{" "}
            <button type="submit" name="decision" value="closed">
              Close request
            </button>
          </fieldset>
        </form>
      ))}
    </main>
  );
}
