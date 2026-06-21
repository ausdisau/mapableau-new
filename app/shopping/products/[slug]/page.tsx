import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { AddToCartButton } from "@/components/shopping/AddToCartButton";
import { ProductImage } from "@/components/shopping/ProductImage";
import { ShoppingNav } from "@/components/shopping/ShoppingNav";
import { ShoppingSafetyNotice } from "@/components/shopping/ShoppingSafetyNotice";
import { isShoppingEnabled } from "@/lib/config/shopping";
import { formatShopMoney } from "@/lib/shopping/format";
import { getPublishedProductBySlug } from "@/lib/shopping/product-service";
import {
  getStockBadgeClass,
  getStockLabel,
  isProductInStock,
} from "@/lib/shopping/stock";
import { SHOPPING_CATEGORY_LABELS } from "@/types/shopping";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);
  return {
    title: product
      ? `${product.title} | MapAble Shopping`
      : "Product | MapAble Shopping",
    description: product?.description,
  };
}

export default async function ShopProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!isShoppingEnabled()) notFound();

  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);
  if (!product) notFound();

  const session = await getServerSession(authOptions);
  const inStock = isProductInStock(product.stockQuantity);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <ShoppingNav />

      <article className="mt-6 space-y-6">
        <ProductImage
          title={product.title}
          imageUrls={product.imageUrls}
          className="aspect-[3/2] w-full"
          priority
        />

        <header className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {SHOPPING_CATEGORY_LABELS[product.category]}
          </p>
          <h1 className="text-3xl font-semibold">{product.title}</h1>
          <p className="text-xl font-medium">
            {formatShopMoney(product.unitAmountCents, product.currency)}
            {product.gstApplicable ? " incl. GST" : ""}
          </p>
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs ${getStockBadgeClass(product.stockQuantity)}`}
          >
            {getStockLabel(product.stockQuantity)}
          </span>
          {product.ndisRelevant ? (
            <p className="text-sm text-muted-foreground">
              Marked NDIS-relevant for your records — not an funding approval.
            </p>
          ) : null}
        </header>

        <p className="text-base leading-relaxed">{product.description}</p>

        {product.accessibilityNotes ? (
          <section aria-labelledby="access-notes">
            <h2 id="access-notes" className="text-lg font-semibold">
              Accessibility notes
            </h2>
            <p className="mt-2 text-muted-foreground">{product.accessibilityNotes}</p>
          </section>
        ) : null}

        <ShoppingSafetyNotice />

        {session?.user ? (
          inStock ? (
            <AddToCartButton productId={product.id} productTitle={product.title} />
          ) : (
            <p className="text-sm text-muted-foreground">
              This product is out of stock and cannot be added to your cart.
            </p>
          )
        ) : (
          <p className="text-sm">
            <Link href="/login" className="underline">
              Sign in
            </Link>{" "}
            to add this product to your cart.
          </p>
        )}
      </article>
    </div>
  );
}
