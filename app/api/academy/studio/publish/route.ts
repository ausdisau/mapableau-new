import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { AcademyAuthzError } from "@/lib/academy/authz/capabilities";
import { publishCourseVersion } from "@/lib/academy/studio/studio-service";

export async function POST(req: Request) {
  const user = await requireApiPermission("academy:studio:publish");
  if (user instanceof Response) {
    const admin = await requireApiPermission("academy:admin");
    if (admin instanceof Response) return user;
    try {
      const published = await publishCourseVersion(admin, await req.json());
      return NextResponse.json({ courseVersion: published });
    } catch (e) {
      if (e instanceof AcademyAuthzError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
      }
      throw e;
    }
  }
  try {
    const published = await publishCourseVersion(user, await req.json());
    return NextResponse.json({ courseVersion: published });
  } catch (e) {
    if (e instanceof AcademyAuthzError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid publish request" }, { status: 400 });
    }
    throw e;
  }
}
