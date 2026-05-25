import { requireApiPermission } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { jsonError, jsonOk } from "@/lib/api/response";
import { updateFoodProduct } from "@/lib/foods/catalog-service";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const user = await requireApiPermission("foods:manage:org");
  if (user instanceof Response) return user;
  const { productId } = await params;
  const orgIds = await getUserOrganisationIds(user.id);
  const product = await prisma.foodProduct.findFirst({ where: { id: productId, organisationId: { in: orgIds } } });
  if (!product) return jsonError("Not found", 404);
  const updated = await updateFoodProduct(productId, product.organisationId, user.id, { published: true });
  return jsonOk({ product: updated });
}
