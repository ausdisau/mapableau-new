import { prisma } from "@/lib/prisma";

export function shouldBlockForRecusal(
  declaration: { recusalRequired: boolean } | null | undefined,
): boolean {
  return Boolean(declaration?.recusalRequired);
}

export async function declareConflictOfInterest(params: {
  subjectUserId: string;
  contextType: string;
  contextId: string;
  declaration: string;
  recusalRequired: boolean;
  declaredAt?: Date;
}) {
  return prisma.conflictOfInterestDeclaration.create({
    data: {
      ...params,
      declaredAt: params.declaredAt ?? new Date(),
    },
  });
}

export async function requireNoRecusal(params: {
  subjectUserId: string;
  contextType: string;
  contextId: string;
}) {
  const recusal = await prisma.conflictOfInterestDeclaration.findFirst({
    where: {
      subjectUserId: params.subjectUserId,
      contextType: params.contextType,
      contextId: params.contextId,
      recusalRequired: true,
    },
    orderBy: { declaredAt: "desc" },
  });

  if (shouldBlockForRecusal(recusal)) throw new Error("RECUSAL_REQUIRED");
}

export async function listConflictDeclarations(params: {
  contextType: string;
  contextId: string;
}) {
  return prisma.conflictOfInterestDeclaration.findMany({
    where: params,
    orderBy: { declaredAt: "desc" },
  });
}
