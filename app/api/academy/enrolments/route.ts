import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { AcademyAuthzError } from "@/lib/academy/authz/capabilities";
import { enrolInPublishedCourse } from "@/lib/academy/learning/learning-service";

const bodySchema = z.object({
  courseSlug: z.string().min(1),
  organisationId: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await requireApiPermission("academy:learn");
  if (user instanceof Response) return user;

  try {
    const body = bodySchema.parse(await req.json());
    const enrolment = await enrolInPublishedCourse(user, body);
    return NextResponse.json({ enrolment }, { status: 201 });
  } catch (e) {
    if (e instanceof AcademyAuthzError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Please check the enrolment details and try again." },
        { status: 400 },
      );
    }
    throw e;
  }
}
