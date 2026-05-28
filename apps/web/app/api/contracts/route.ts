import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const contracts = await prisma.smartContract.findMany({
    orderBy: { code: "asc" },
  });
  return jsonOk({ contracts });
}
