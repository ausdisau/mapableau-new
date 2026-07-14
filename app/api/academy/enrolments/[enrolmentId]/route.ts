import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { AcademyAuthzError } from "@/lib/academy/authz/capabilities";
import {
  completeEnrolment,
  getEnrolmentForLearner,
  submitAssessmentAttempt,
  updateLessonProgress,
} from "@/lib/academy/learning/learning-service";

type Params = { params: Promise<{ enrolmentId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await requireApiPermission("academy:learn");
  if (user instanceof Response) return user;
  const { enrolmentId } = await params;
  try {
    const enrolment = await getEnrolmentForLearner(user, enrolmentId);
    return NextResponse.json({ enrolment });
  } catch (e) {
    if (e instanceof AcademyAuthzError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const user = await requireApiPermission("academy:learn");
  if (user instanceof Response) return user;
  const { enrolmentId } = await params;
  const body = await req.json();

  try {
    if (body.action === "progress") {
      const progress = await updateLessonProgress(user, enrolmentId, body);
      return NextResponse.json({ progress });
    }
    if (body.action === "attempt") {
      const result = await submitAssessmentAttempt(user, enrolmentId, {
        assessmentId: body.assessmentId,
        answers: body.answers,
      });
      return NextResponse.json(result);
    }
    if (body.action === "complete") {
      const result = await completeEnrolment(user, enrolmentId);
      return NextResponse.json(result);
    }
    return NextResponse.json(
      { error: "Unknown action. Use progress, attempt, or complete." },
      { status: 400 },
    );
  } catch (e) {
    if (e instanceof AcademyAuthzError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Please check your answers and try again." },
        { status: 400 },
      );
    }
    throw e;
  }
}
