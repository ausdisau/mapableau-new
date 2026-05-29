import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  certifyApiApplication,
  listCertificationApplications,
  submitApiCertificationApplication,
} from "@/lib/api-certification/certification-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk({ applications: await listCertificationApplications() });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  if (body.applicationId) {
    const app = await certifyApiApplication(
      body.applicationId,
      user.id,
      body.reviewNotes
    );
    return jsonOk({ application: app });
  }
  const app = await submitApiCertificationApplication(body);
  return jsonOk({ application: app }, 201);
}
