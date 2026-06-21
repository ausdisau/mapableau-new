import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  createProduct,
  listAllProductsForAdmin,
  updateProduct,
} from "@/lib/shopping/product-service";
import {
  createShopProductSchema,
  updateShopProductSchema,
} from "@/lib/shopping/schemas";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk({ products: await listAllProductsForAdmin() });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const body = await req.json();
  const parsed = createShopProductSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const product = await createProduct({
    slug: parsed.data.slug,
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category,
    status: parsed.data.status ?? "draft",
    unitAmountCents: parsed.data.unitAmountCents,
    currency: parsed.data.currency ?? "AUD",
    gstApplicable: parsed.data.gstApplicable ?? false,
    stockQuantity: parsed.data.stockQuantity ?? null,
    imageUrls: parsed.data.imageUrls ?? [],
    accessibilityNotes: parsed.data.accessibilityNotes ?? null,
    ndisRelevant: parsed.data.ndisRelevant ?? false,
    vendorOrganisationId: parsed.data.vendorOrganisationId ?? null,
  });

  return jsonOk({ product }, 201);
}

export async function PATCH(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const body = await req.json();
  const productId = body.productId as string | undefined;
  if (!productId) return jsonError("productId is required", 400);

  const parsed = updateShopProductSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const product = await updateProduct(productId, {
    ...(parsed.data.slug !== undefined ? { slug: parsed.data.slug } : {}),
    ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
    ...(parsed.data.description !== undefined
      ? { description: parsed.data.description }
      : {}),
    ...(parsed.data.category !== undefined ? { category: parsed.data.category } : {}),
    ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
    ...(parsed.data.unitAmountCents !== undefined
      ? { unitAmountCents: parsed.data.unitAmountCents }
      : {}),
    ...(parsed.data.currency !== undefined ? { currency: parsed.data.currency } : {}),
    ...(parsed.data.gstApplicable !== undefined
      ? { gstApplicable: parsed.data.gstApplicable }
      : {}),
    ...(parsed.data.stockQuantity !== undefined
      ? { stockQuantity: parsed.data.stockQuantity }
      : {}),
    ...(parsed.data.imageUrls !== undefined
      ? { imageUrls: parsed.data.imageUrls }
      : {}),
    ...(parsed.data.accessibilityNotes !== undefined
      ? { accessibilityNotes: parsed.data.accessibilityNotes }
      : {}),
    ...(parsed.data.ndisRelevant !== undefined
      ? { ndisRelevant: parsed.data.ndisRelevant }
      : {}),
    ...(parsed.data.vendorOrganisationId !== undefined
      ? { vendorOrganisationId: parsed.data.vendorOrganisationId }
      : {}),
  });

  return jsonOk({ product });
}
