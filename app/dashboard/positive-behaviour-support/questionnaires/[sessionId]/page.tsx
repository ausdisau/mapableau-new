import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import { pbsConfig } from "@/lib/config/positive-behaviour-support";
import {
  PBS_QUESTIONNAIRE_DEFINITION,
  evaluatePbsAccess,
  assertPbsAccess,
} from "@/lib/positive-behaviour-support";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PbsQuestionnaireSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  if (!pbsConfig.enabled) {
    return (
      <div className="rounded-xl border p-6">
        <h1 className="font-heading text-2xl font-bold">Questionnaire</h1>
        <p className="mt-2 text-muted-foreground">Module disabled.</p>
      </div>
    );
  }

  const user = await requireAuth();
  const { sessionId } = await params;
  const session = await prisma.pbsQuestionnaireSession.findUnique({
    where: { id: sessionId },
    include: { responses: true, engagement: true },
  });
  if (!session) notFound();

  const decision = evaluatePbsAccess(
    {
      userId: user.id,
      role: user.primaryRole,
      organisationIds: [],
      isPlatformAdmin: false,
    },
    {
      participantUserId: session.participantUserId,
      organisationId: session.organisationId,
      assignedPractitionerUserId: null,
      implementingOrganisationId: null,
    },
    { needsClinical: true, action: "questionnaire.read" },
  );
  try {
    assertPbsAccess(decision);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">
          Guided questionnaire
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Version {session.questionnaireVersion}. Autosave status:{" "}
          <span aria-live="polite">{session.autosaveStatus}</span>. No forced time
          limit. A questionnaire is not a functional behaviour assessment.
        </p>
        {session.easyReadMode ? (
          <p className="mt-2 text-sm font-medium">Easy Read mode is on.</p>
        ) : null}
      </header>

      <form className="space-y-8" aria-describedby="q-help">
        <p id="q-help" className="text-sm text-muted-foreground">
          You can skip or choose “I don’t know” where offered. Keyboard-only
          operation is supported. Errors will be summarised at the top after
          submit.
        </p>
        {PBS_QUESTIONNAIRE_DEFINITION.map((q) => {
          const existing = session.responses.find((r) => r.questionId === q.id);
          return (
            <fieldset key={q.id} className="space-y-2 rounded-lg border p-4">
              <legend className="font-medium">
                {session.easyReadMode ? q.easyRead : q.plainLanguage}
              </legend>
              <label className="block text-sm" htmlFor={`${q.id}-answer`}>
                Your answer
              </label>
              <textarea
                id={`${q.id}-answer`}
                name={q.id}
                className="min-h-24 w-full rounded-md border px-3 py-2"
                defaultValue={existing?.valueText ?? ""}
                aria-describedby={`${q.id}-hint`}
              />
              <p id={`${q.id}-hint`} className="text-xs text-muted-foreground">
                Supplied by: {existing?.informantRole ?? "not yet answered"}.
                Status: {existing?.status ?? "unknown"}.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                {q.allowsSkip ? (
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name={`${q.id}-skip`} /> Skip
                  </label>
                ) : null}
                {q.allowsUnknown ? (
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name={`${q.id}-unknown`} /> I don’t
                    know
                  </label>
                ) : null}
              </div>
            </fieldset>
          );
        })}
        <button
          type="submit"
          className="inline-flex min-h-12 items-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Save and return
        </button>
      </form>
    </div>
  );
}
