import Link from "next/link";
import { requireAccessPrincipal } from "../../../lib/access-principal";
import {
  PUBLIC_SERVICES,
  serviceFor,
  supportHref,
} from "../../../lib/service-directory";
import { submitAccessRequest } from "./actions";

export const dynamic = "force-dynamic";
export default async function RequestAccess({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; state?: string }>;
}) {
  await requireAccessPrincipal();
  const query = await searchParams;
  return (
    <main id="main-content" tabIndex={-1} className="container signin">
      <Link href="/dashboard">Back to the dashboard</Link>
      <h1>Request service access</h1>
      {query.state === "choose" && (
        <p role="alert">Choose at least one service.</p>
      )}
      {query.state === "unavailable" && (
        <p role="alert">
          We could not save your request. You can try again or contact the team.
        </p>
      )}
      {process.env.ADID_ACCESS_REQUESTS_DATABASE_URL ? (
        <form action={submitAccessRequest}>
          <fieldset>
            <legend>Which services would you like to access?</legend>
            {PUBLIC_SERVICES.map((s) => (
              <label className="request-option" key={s.id}>
                <input
                  type="checkbox"
                  name="services"
                  value={s.id}
                  defaultChecked={s.id === serviceFor(query.service)?.id}
                />
                {s.name}
              </label>
            ))}
          </fieldset>
          <p>
            The service reviewer receives your AD.iD account reference and the
            service you select. Each service decides its own membership.
          </p>
          <button className="primary-button" type="submit">
            Send request
          </button>
          <p>
            <Link href="/access/request/confirmation">View my requests</Link>
          </p>
        </form>
      ) : (
        <p role="status">
          Online requests are unavailable in this deployment. Contact Australian
          Disability Ltd for help with service access.
        </p>
      )}
      <a href={supportHref}>Contact Australian Disability Ltd</a>
    </main>
  );
}
