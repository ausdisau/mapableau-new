import { handleIncidentTransition } from "@/lib/accessops/http/internal-api";

export const dynamic = "force-dynamic";

export function POST(request: Request, params: Parameters<typeof handleIncidentTransition>[1]) {
  return handleIncidentTransition(request, params, "restored");
}
