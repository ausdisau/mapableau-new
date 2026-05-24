import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { createCourseSchema } from "@/lib/validation/academy";

export async function GET() {
  const user = await requireApiPermission("academy:manage:any");
  if (user instanceof Response) return user;
  const courses = await prisma.academyCourse.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { lessons: true, enrolments: true } } },
  });
  return jsonOk({ courses });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("academy:manage:any");
  if (user instanceof Response) return user;
  try {
    const parsed = createCourseSchema.parse(await req.json());
    const course = await prisma.academyCourse.create({
      data: {
        slug: parsed.slug,
        title: parsed.title,
        summary: parsed.summary,
        description: parsed.description,
        category: parsed.category ?? "general",
        estimatedMinutes: parsed.estimatedMinutes ?? 60,
        status: parsed.status ?? "draft",
        publishedAt: parsed.status === "published" ? new Date() : null,
      },
    });
    return jsonOk({ course }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Create course failed", 500);
  }
}
