import { z } from "zod";

import { isDemoMode } from "@/lib/access-intelligence/configuration";
import { DEMO_PASSPORT_TEMPLATES } from "@/lib/access-intelligence/demo-data";
import {
  AccessIntelligenceError,
  isAccessIntelligenceError,
} from "@/lib/access-intelligence/errors";
import {
  duplicatePassport,
  getAccessIntelligenceRepository,
} from "@/lib/access-intelligence/repositories";
import {
  accessPassportSchema,
  accessRequirementSchema,
} from "@/lib/access-intelligence/schemas";
import { createServerAccessContext } from "@/lib/access-intelligence/server-context";
import { requireApiSession } from "@/lib/api/auth-handler";
import { getCurrentUser } from "@/lib/auth/current-user";

async function resolveUserId(): Promise<string | Response> {
  if (isDemoMode()) {
    const user = await getCurrentUser();
    return (
      user?.id ??
      createServerAccessContext({ userId: null }).userId
    );
  }
  const session = await requireApiSession();
  if (session instanceof Response) return session;
  return session.id;
}

export async function GET() {
  try {
    const userId = await resolveUserId();
    if (userId instanceof Response) return userId;
    const repo = getAccessIntelligenceRepository();
    const passports = await repo.listPassports(userId);
    return Response.json({
      passports,
      templates: DEMO_PASSPORT_TEMPLATES.map((t) => ({
        id: t.id,
        name: t.name,
        description: `Editable template: ${t.name}. Needs are individual — this is a starting point only.`,
      })),
    });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 400 });
    }
    return Response.json(
      { error: "Could not load passports.", code: "REPOSITORY_UNAVAILABLE" },
      { status: 503 },
    );
  }
}

const saveSchema = z.object({
  passport: accessPassportSchema,
});

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("duplicate"),
    passportId: z.string(),
    name: z.string().min(1),
  }),
  z.object({
    action: z.literal("setDefault"),
    passportId: z.string(),
  }),
  z.object({
    action: z.literal("delete"),
    passportId: z.string(),
  }),
  z.object({
    action: z.literal("createFromTemplate"),
    templateId: z.string(),
    name: z.string().optional(),
  }),
  z.object({
    action: z.literal("updateRequirements"),
    passportId: z.string(),
    requirements: z.array(accessRequirementSchema),
  }),
]);

export async function POST(request: Request) {
  try {
    const userId = await resolveUserId();
    if (userId instanceof Response) return userId;
    const repo = getAccessIntelligenceRepository();
    const body = await request.json();

    if (body?.passport) {
      const parsed = saveSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          {
            error: "Invalid passport payload.",
            code: "VALIDATION_ERROR",
            recoveryHint: "Check required fields and try saving again.",
          },
          { status: 400 },
        );
      }
      if (parsed.data.passport.userId !== userId) {
        throw new AccessIntelligenceError(
          "UNAUTHORISED",
          "You can only save your own Access Passports.",
          "Sign in with the correct account.",
        );
      }
      const saved = await repo.savePassport({
        ...parsed.data.passport,
        userId,
      });
      return Response.json({ passport: saved });
    }

    const action = actionSchema.safeParse(body);
    if (!action.success) {
      return Response.json(
        {
          error: "Unsupported passport action.",
          code: "VALIDATION_ERROR",
          recoveryHint: "Reload the passport editor and try again.",
        },
        { status: 400 },
      );
    }

    const actionData = action.data;
    switch (actionData.action) {
      case "duplicate": {
        const source = await repo.getPassport(userId, actionData.passportId);
        const copy = await repo.savePassport(
          duplicatePassport(source, actionData.name),
        );
        return Response.json({ passport: copy });
      }
      case "setDefault": {
        const list = await repo.listPassports(userId);
        for (const p of list) {
          await repo.savePassport({
            ...p,
            isDefault: p.id === actionData.passportId,
          });
        }
        return Response.json({
          passports: await repo.listPassports(userId),
        });
      }
      case "delete": {
        await repo.deletePassport(userId, actionData.passportId);
        return Response.json({ ok: true });
      }
      case "createFromTemplate": {
        const template = DEMO_PASSPORT_TEMPLATES.find(
          (t) => t.id === actionData.templateId,
        );
        if (!template) {
          throw new AccessIntelligenceError(
            "PASSPORT_NOT_FOUND",
            "Template was not found.",
            "Choose another template.",
          );
        }
        const now = new Date().toISOString();
        const created = await repo.savePassport({
          ...structuredClone(template),
          id: `passport-${Date.now()}`,
          userId,
          name: actionData.name ?? `${template.name} (custom)`,
          isDefault: false,
          createdAt: now,
          updatedAt: now,
          requirements: template.requirements.map((r, i) => ({
            ...r,
            id: `req-${Date.now()}-${i}`,
          })),
        });
        return Response.json({ passport: created });
      }
      case "updateRequirements": {
        const existing = await repo.getPassport(userId, actionData.passportId);
        const saved = await repo.savePassport({
          ...existing,
          requirements: actionData.requirements,
        });
        return Response.json({ passport: saved });
      }
      default: {
        const _never: never = actionData;
        return _never;
      }
    }
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      const status = error.code === "UNAUTHORISED" ? 401 : 400;
      return Response.json(error.toPublicJson(), { status });
    }
    return Response.json(
      { error: "Could not update passport.", code: "REPOSITORY_UNAVAILABLE" },
      { status: 503 },
    );
  }
}
