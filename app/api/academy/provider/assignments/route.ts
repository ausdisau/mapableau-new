import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { AcademyAuthzError } from "@/lib/academy/authz/capabilities";
import { assignCourseToLearner } from "@/lib/academy/provider/provider-service";

export async function POST(req: Request) {
  const user = await requireApiPermission("academy:provider:admin");
  if (user instanceof Response) return user;
  try {
    const assignment = await assignCourseToLearner(user, await req.json());
    return NextResponse.json({ assignment }, { status: 201 });
  } catch (e) {
    if (e instanceof AcademyAuthzError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Please check the assignment details." },
        { status: 400 },
      );
    }
    throw e;
  }
}
