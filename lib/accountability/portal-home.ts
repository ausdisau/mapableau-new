import {
  getPortalStatus,
  listActivePublicNotices,
  listPublishedHeadlineMetrics,
} from "@/lib/accountability/public-reader";
import { prisma } from "@/lib/prisma";

export {
  getPortalStatus,
  listActivePublicNotices,
  listPublishedHeadlineMetrics,
};

export type ImprovementExample = {
  id: string;
  title: string;
  summary: string;
  sourceLabel: string;
};

/**
 * Privacy-safe improvement examples stored in the latest published snapshot package.
 * Never reads operational feedback/complaint tables.
 */
export async function listPublicAccountabilityImprovements(): Promise<
  ImprovementExample[]
> {
  const snapshot = await prisma.accountabilityPublicationSnapshot.findFirst({
    where: { status: { in: ["published", "corrected"] } },
    orderBy: { publishedAt: "desc" },
    select: { packageJson: true },
  });
  if (!snapshot) return [];
  const pkg = snapshot.packageJson as {
    improvements?: ImprovementExample[];
  };
  if (!Array.isArray(pkg.improvements)) return [];
  return pkg.improvements.filter(
    (item) =>
      item &&
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      typeof item.summary === "string" &&
      typeof item.sourceLabel === "string"
  );
}
