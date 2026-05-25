import { requireApiPermission } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createFoodProduct, listPublishedFoodProducts } from "@/lib/foods/catalog-service";
import { providerProductSchema } from "@/lib/validation/foods";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiPermission("foods:read:org");
  if (user instanceof Response) return user;
  const orgIds = await getUserOrganisationIds(user.id);
  const products = await prisma.foodProduct.findMany({ where: { organisationId: { in: orgIds } }, include: { vendor: true }, orderBy: { createdAt: "desc" } });
  return jsonOk({ products });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("foods:manage:org");
  if (user instanceof Response) return user;
  const parsed = providerProductSchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const [organisationId] = await getUserOrganisationIds(user.id);
  if (!organisationId) return jsonError("Provider organisation required", 403);
  const product = await createFoodProduct({ organisationId, actorUserId: user.id, ...parsed.data });
  return jsonOk({ product }, 201);
}
