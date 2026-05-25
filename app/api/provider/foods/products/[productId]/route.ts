import { requireApiPermission } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { updateFoodProduct } from "@/lib/foods/catalog-service";
import { providerProductSchema } from "@/lib/validation/foods";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const user = await requireApiPermission("foods:manage:org");
  if (user instanceof Response) return user;
  const { productId } = await params;
  const orgIds = await getUserOrganisationIds(user.id);
  const product = await prisma.foodProduct.findFirst({ where: { id: productId, organisationId: { in: orgIds } } });
  if (!product) return jsonError("Not found", 404);
  const parsed = providerProductSchema.partial().safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const updated = await updateFoodProduct(productId, product.organisationId, user.id, parsed.data);
  return jsonOk({ product: updated });
}
