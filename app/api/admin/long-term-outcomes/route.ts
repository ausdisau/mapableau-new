import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  listPublishedOutcomes,
  publishLongTermOutcome,
} from "@/lib/long-term-outcomes/outcomes-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk({ outcomes: await listPublishedOutcomes() });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const outcome = await publishLongTermOutcome(body);
  return jsonOk({ outcome }, 201);
}
