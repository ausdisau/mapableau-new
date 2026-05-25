import { prisma } from "@/lib/prisma";

export async function addHomeAccessIssues(params: {
  requestId: string;
  issues: {
    area: string;
    issueType: string;
    severity?: string;
    description?: string;
  }[];
}) {
  const created = await Promise.all(
    params.issues.map((issue) =>
      prisma.homeAccessIssue.create({
        data: {
          requestId: params.requestId,
          area: issue.area,
          issueType: issue.issueType,
          severity: issue.severity ?? "moderate",
          description: issue.description,
        },
      })
    )
  );
  return created;
}

export async function listHomeAccessIssues(requestId: string) {
  return prisma.homeAccessIssue.findMany({
    where: { requestId },
    orderBy: { createdAt: "asc" },
  });
}
