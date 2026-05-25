import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listPublishedCourses } from "@/lib/academy/course-service";

export async function GET() {
  const user = await requireApiPermission("academy:read");
  if (user instanceof Response) return user;
  const courses = await listPublishedCourses();
  return jsonOk({
    courses: courses.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      summary: c.summary,
      category: c.category,
      estimatedMinutes: c.estimatedMinutes,
      lessonCount: c._count.lessons,
    })),
  });
}
