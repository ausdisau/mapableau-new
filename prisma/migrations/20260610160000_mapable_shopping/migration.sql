-- CreateEnum
CREATE TYPE "ShopProductStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "ShopProductCategory" AS ENUM ('assistive_technology', 'daily_living', 'mobility', 'communication');

-- CreateEnum
CREATE TYPE "ShopOrderStatus" AS ENUM ('pending_payment', 'paid', 'fulfilled', 'cancelled');

-- CreateTable
CREATE TABLE "shop_products" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ShopProductCategory" NOT NULL,
    "status" "ShopProductStatus" NOT NULL DEFAULT 'draft',
    "unitAmountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "gstApplicable" BOOLEAN NOT NULL DEFAULT false,
    "stockQuantity" INTEGER,
    "imageUrls" JSONB NOT NULL DEFAULT '[]',
    "accessibilityNotes" TEXT,
    "ndisRelevant" BOOLEAN NOT NULL DEFAULT false,
    "vendorOrganisationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_carts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_cart_items" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_orders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "billingInvoiceId" TEXT NOT NULL,
    "status" "ShopOrderStatus" NOT NULL DEFAULT 'pending_payment',
    "shippingName" TEXT,
    "shippingEmail" TEXT,
    "shippingAddress" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shop_products_slug_key" ON "shop_products"("slug");

-- CreateIndex
CREATE INDEX "shop_products_status_category_idx" ON "shop_products"("status", "category");

-- CreateIndex
CREATE UNIQUE INDEX "shop_carts_userId_key" ON "shop_carts"("userId");

-- CreateIndex
CREATE INDEX "shop_cart_items_cartId_idx" ON "shop_cart_items"("cartId");

-- CreateIndex
CREATE UNIQUE INDEX "shop_cart_items_cartId_productId_key" ON "shop_cart_items"("cartId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "shop_orders_billingInvoiceId_key" ON "shop_orders"("billingInvoiceId");

-- CreateIndex
CREATE INDEX "shop_orders_userId_status_idx" ON "shop_orders"("userId", "status");

-- AddForeignKey
ALTER TABLE "shop_products" ADD CONSTRAINT "shop_products_vendorOrganisationId_fkey" FOREIGN KEY ("vendorOrganisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_carts" ADD CONSTRAINT "shop_carts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_cart_items" ADD CONSTRAINT "shop_cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "shop_carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_cart_items" ADD CONSTRAINT "shop_cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "shop_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_orders" ADD CONSTRAINT "shop_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_orders" ADD CONSTRAINT "shop_orders_billingInvoiceId_fkey" FOREIGN KEY ("billingInvoiceId") REFERENCES "BillingInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
