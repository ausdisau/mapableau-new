import { NextResponse } from "next/server";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { AcademyAuthzError } from "@/lib/academy/authz/capabilities";
import {
  getStudioCourse,
  listStudioCourses,
} from "@/lib/academy/studio/studio-service";

export async function GET(req: Request) {
  const user = await requireApiPermission("academy:studio:author");
  if (user instanceof Response) {
    // Allow academy:admin via permission set on mapable_admin
    const admin = await requireApiPermission("academy:admin");
    if (admin instanceof Response) return user;
    return NextResponse.json({ courses: await listStudioCourses(admin) });
  }
  try {
    const courseId = new URL(req.url).searchParams.get("courseId");
    if (courseId) {
      const course = await getStudioCourse(user, courseId);
      return NextResponse.json({ course });
    }
    const courses = await listStudioCourses(user);
    return NextResponse.json({ courses });
  } catch (e) {
    if (e instanceof AcademyAuthzError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
