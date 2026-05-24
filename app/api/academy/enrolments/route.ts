import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { enrolInAcademyCourse } from "@/lib/academy/enrolment-service";
import { academyEnrolSchema } from "@/lib/validation/academy";

export async function POST(req: Request) {
  const user = await requireApiPermission("academy:enrol");
  if (user instanceof Response) return user;
  try {
    const parsed = academyEnrolSchema.parse(await req.json());
    const enrolment = await enrolInAcademyCourse({
      courseId: parsed.courseId,
      userId: user.id,
      actorUserId: user.id,
      extendedTime: parsed.extendedTime,
    });
    return jsonOk({ enrolment }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "COURSE_NOT_FOUND") {
      return jsonError("Course not found", 404);
    }
    return jsonError("Enrolment failed", 500);
  }
}
