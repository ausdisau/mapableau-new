import { calculateInvoiceTotals } from "@/lib/billing-core/calculations";
import type { ShopCartLine, ShopCartTotals, ShopCartView } from "@/types/shopping";
import { prisma } from "@/lib/prisma";

import { getProductsForCartValidation } from "./product-service";

async function getOrCreateCart(userId: string) {
  return prisma.shopCart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: {
      items: {
        include: { product: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

function buildCartLines(
  items: Array<{
    quantity: number;
    product: {
      id: string;
      slug: string;
      title: string;
      unitAmountCents: number;
      gstApplicable: boolean;
      ndisRelevant: boolean;
    };
  }>
): ShopCartLine[] {
  return items.map((item) => ({
    productId: item.product.id,
    slug: item.product.slug,
    title: item.product.title,
    quantity: item.quantity,
    unitAmountCents: item.product.unitAmountCents,
    gstApplicable: item.product.gstApplicable,
    ndisRelevant: item.product.ndisRelevant,
    lineSubtotalCents: item.quantity * item.product.unitAmountCents,
  }));
}

export function calculateCartTotalsFromLines(
  lines: ShopCartLine[],
  currency = "AUD"
): ShopCartTotals {
  const calcItems = lines.map((line) => ({
    quantity: line.quantity,
    unitAmountCents: line.unitAmountCents,
    gstApplicable: line.gstApplicable,
  }));
  const totals = calculateInvoiceTotals(calcItems);
  return {
    ...totals,
    currency,
  };
}

export async function getCartView(userId: string): Promise<ShopCartView> {
  const cart = await getOrCreateCart(userId);
  const publishedItems = cart.items.filter((item) => item.product.status === "published");
  const lines = buildCartLines(publishedItems);
  const currency = publishedItems[0]?.product.currency ?? "AUD";

  return {
    lines,
    totals: calculateCartTotalsFromLines(lines, currency),
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
  };
}

export async function setCartItemQuantity(
  userId: string,
  productId: string,
  quantity: number
) {
  const product = await prisma.shopProduct.findFirst({
    where: { id: productId, status: "published" },
  });
  if (!product) {
    return { ok: false as const, error: "Product not found or unavailable" };
  }

  if (product.stockQuantity != null && quantity > product.stockQuantity) {
    return {
      ok: false as const,
      error: `Only ${product.stockQuantity} in stock`,
    };
  }

  const cart = await getOrCreateCart(userId);

  if (quantity === 0) {
    await prisma.shopCartItem.deleteMany({
      where: { cartId: cart.id, productId },
    });
    return { ok: true as const, cart: await getCartView(userId) };
  }

  await prisma.shopCartItem.upsert({
    where: {
      cartId_productId: { cartId: cart.id, productId },
    },
    create: { cartId: cart.id, productId, quantity },
    update: { quantity },
  });

  return { ok: true as const, cart: await getCartView(userId) };
}

export async function clearCart(userId: string) {
  const cart = await prisma.shopCart.findUnique({ where: { userId } });
  if (!cart) return;
  await prisma.shopCartItem.deleteMany({ where: { cartId: cart.id } });
}

export async function validateCartForCheckout(userId: string) {
  const cart = await getOrCreateCart(userId);
  const publishedItems = cart.items.filter((item) => item.product.status === "published");

  if (publishedItems.length === 0) {
    return { ok: false as const, error: "Your cart is empty" };
  }

  const productIds = publishedItems.map((item) => item.productId);
  const products = await getProductsForCartValidation(productIds);
  if (products.length !== publishedItems.length) {
    return { ok: false as const, error: "Some cart items are no longer available" };
  }

  for (const item of publishedItems) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;
    if (product.stockQuantity != null && item.quantity > product.stockQuantity) {
      return {
        ok: false as const,
        error: `${product.title} has insufficient stock`,
      };
    }
  }

  const lines = buildCartLines(publishedItems);
  const currency = products[0]?.currency ?? "AUD";

  return {
    ok: true as const,
    lines,
    totals: calculateCartTotalsFromLines(lines, currency),
  };
}
