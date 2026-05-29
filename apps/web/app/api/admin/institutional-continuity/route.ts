import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  createContinuityPlan,
  getContinuityDashboard,
} from "@/lib/institutional-continuity/continuity-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(await getContinuityDashboard());
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const plan = await createContinuityPlan(body.title, body.summary);
  return jsonOk({ plan }, 201);
}
