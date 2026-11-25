import { neon } from "@neondatabase/serverless";
import { PUBLIC_SERVICES } from "./service-directory.ts";

export function selectedServices(values: unknown[]) {
  return PUBLIC_SERVICES.filter((s) => values.includes(s.id)).map((s) => s.id);
}

export function reviewerServices(subject: string, setting: string | undefined) {
  try {
    const entries = JSON.parse(setting || "{}");
    if (
      !entries ||
      !Object.hasOwn(entries, subject) ||
      !Array.isArray(entries[subject])
    )
      return [];
    return selectedServices(entries[subject]);
  } catch {
    return [];
  }
}

export function requestDatabase() {
  const url = process.env.ADID_ACCESS_REQUESTS_DATABASE_URL?.trim();
  return url ? neon(url) : null;
}

type Database = NonNullable<ReturnType<typeof requestDatabase>>;
type Principal = { issuer: string; subject: string };
export type RequestRow = {
  id: string;
  subject: string;
  service: string;
  status: string;
};

export async function submitRequests(
  sql: Database,
  who: Principal,
  selections: unknown[],
) {
  const services = selectedServices(selections);
  if (!services.length) throw new Error("Choose at least one service.");
  await sql`INSERT INTO adid_portal.access_request (issuer, subject, service)
    SELECT ${who.issuer}, ${who.subject}, service
    FROM jsonb_array_elements_text(${JSON.stringify(services)}::jsonb) AS s(service)
    ON CONFLICT (issuer, subject, service) WHERE status = 'pending' DO NOTHING`;
}

export async function ownRequests(sql: Database, who: Principal) {
  return (await sql`SELECT id, subject, service, status FROM adid_portal.access_request
    WHERE issuer = ${who.issuer} AND subject = ${who.subject}
    ORDER BY requested_at DESC, id DESC LIMIT 50`) as RequestRow[];
}

export async function pendingRequests(
  sql: Database,
  who: Principal,
  allowed: string[],
) {
  return (await sql`SELECT id, subject, service, status FROM adid_portal.access_request
    WHERE issuer = ${who.issuer} AND status = 'pending'
    AND service IN (SELECT jsonb_array_elements_text(${JSON.stringify(selectedServices(allowed))}::jsonb))
    ORDER BY requested_at, id LIMIT 100`) as RequestRow[];
}

export async function reviewRequest(
  sql: Database,
  who: Principal,
  allowed: string[],
  id: string,
  status: string,
) {
  if (
    !["referred", "closed"].includes(status) ||
    !/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id)
  )
    return false;
  const rows =
    await sql`UPDATE adid_portal.access_request SET status = ${status},
    reviewed_by = ${who.subject}, reviewed_at = now()
    WHERE id = ${id}::uuid AND status = 'pending' AND issuer = ${who.issuer}
    AND service IN (SELECT jsonb_array_elements_text(${JSON.stringify(selectedServices(allowed))}::jsonb))
    RETURNING id`;
  return rows.length === 1;
}
