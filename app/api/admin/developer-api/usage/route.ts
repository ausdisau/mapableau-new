import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getAppUsageSummary } from "@/lib/developer-api/usage-metering-service";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (user.primaryRole !== "mapable_admin") {
    return jsonError("Forbidden", 403);
  }

  const url = new URL(req.url);
  const appId = url.searchParams.get("appId");

  if (appId) {
    const summary = await getAppUsageSummary(appId);
    return jsonOk(summary);
  }

  const apps = await prisma.developerApp.findMany({
    where: { status: "approved" },
    select: { id: true, name: true },
    take: 20,
  });

  const summaries = await Promise.all(
    apps.map(async (app) => ({
      appId: app.id,
      name: app.name,
      ...(await getAppUsageSummary(app.id)),
    }))
  );

  return jsonOk({ apps: summaries });
}
