-- MapAble Foods module

-- AlterEnum OrganisationType
ALTER TYPE "OrganisationType" ADD VALUE IF NOT EXISTS 'food_vendor';

-- AlterEnum ConsentScope
ALTER TYPE "ConsentScope" ADD VALUE IF NOT EXISTS 'foods_dietary_share';
ALTER TYPE "ConsentScope" ADD VALUE IF NOT EXISTS 'foods_allergy_share';
ALTER TYPE "ConsentScope" ADD VALUE IF NOT EXISTS 'foods_delivery_address_share';
ALTER TYPE "ConsentScope" ADD VALUE IF NOT EXISTS 'foods_invoice_share';
ALTER TYPE "ConsentScope" ADD VALUE IF NOT EXISTS 'foods_delivery_photo_share';

-- CreateEnum
CREATE TYPE "FoodProductType" AS ENUM ('grocery', 'prepared_meal', 'meal_bundle', 'household_essential');
CREATE TYPE "FoodProductStatus" AS ENUM ('draft', 'published', 'archived');
CREATE TYPE "FoodOrderType" AS ENUM ('one_off', 'recurring', 'subscription');
CREATE TYPE "FoodOrderStatus" AS ENUM ('draft', 'submitted', 'confirmed', 'preparing', 'packed', 'cancelled', 'disputed', 'completed');
CREATE TYPE "FoodPaymentStatus" AS ENUM ('unpaid', 'pending', 'paid', 'failed', 'refunded', 'blocked');
CREATE TYPE "FoodInvoiceStatus" AS ENUM ('none', 'draft', 'sent', 'paid', 'void');
CREATE TYPE "FoodDeliveryStatus" AS ENUM ('not_assigned', 'assigned', 'picked_up', 'out_for_delivery', 'arriving_soon', 'delivered', 'handover_confirmed', 'failed', 'disputed');
CREATE TYPE "FoodOrderItemCostType" AS ENUM ('food_item', 'preparation', 'delivery', 'support_time', 'packaging', 'other');
CREATE TYPE "FoodSubstitutionPolicy" AS ENUM ('allow_similar', 'contact_first', 'no_substitutions', 'vendor_choice');
CREATE TYPE "FoodSubscriptionStatus" AS ENUM ('active', 'paused', 'cancelled');
CREATE TYPE "FoodDisputeStatus" AS ENUM ('open', 'under_review', 'resolved', 'rejected');
CREATE TYPE "FoodSafetySeverity" AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE "data_access_logs" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "subjectUserId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "purpose" TEXT NOT NULL,
    "consentScope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "data_access_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_vendors" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "food_vendors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_vendor_profiles" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "description" TEXT,
    "deliveryRegions" JSONB NOT NULL DEFAULT '[]',
    "operatingHours" JSONB,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "food_vendor_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_product_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "food_product_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_products" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "productType" "FoodProductType" NOT NULL,
    "priceAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "dietaryTags" JSONB NOT NULL DEFAULT '[]',
    "allergenTags" JSONB NOT NULL DEFAULT '[]',
    "accessibilityTags" JSONB NOT NULL DEFAULT '[]',
    "nutritionSummary" TEXT,
    "imageUrl" TEXT,
    "status" "FoodProductStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "food_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_meal_items" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "food_meal_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_product_dietary_tags" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    CONSTRAINT "food_product_dietary_tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_product_accessibility_tags" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    CONSTRAINT "food_product_accessibility_tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_inventory" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "food_inventory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_carts" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "vendorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "food_carts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_cart_items" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "food_cart_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_orders" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "nomineeId" TEXT,
    "status" "FoodOrderStatus" NOT NULL DEFAULT 'draft',
    "orderType" "FoodOrderType" NOT NULL DEFAULT 'one_off',
    "subtotalAmount" INTEGER NOT NULL DEFAULT 0,
    "deliveryFeeAmount" INTEGER NOT NULL DEFAULT 0,
    "preparationFeeAmount" INTEGER NOT NULL DEFAULT 0,
    "supportFeeAmount" INTEGER NOT NULL DEFAULT 0,
    "taxAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "paymentStatus" "FoodPaymentStatus" NOT NULL DEFAULT 'unpaid',
    "invoiceStatus" "FoodInvoiceStatus" NOT NULL DEFAULT 'none',
    "deliveryStatus" "FoodDeliveryStatus" NOT NULL DEFAULT 'not_assigned',
    "deliveryAddressFull" TEXT,
    "deliveryAddressSuburb" TEXT,
    "deliveryAddressId" TEXT,
    "deliveryWindowStart" TIMESTAMP(3),
    "deliveryWindowEnd" TIMESTAMP(3),
    "handoverInstructionsJson" JSONB,
    "substitutionPolicy" "FoodSubstitutionPolicy" NOT NULL DEFAULT 'contact_first',
    "allergenAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "food_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "titleSnapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitAmount" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "itemCostType" "FoodOrderItemCostType" NOT NULL DEFAULT 'food_item',
    "dietaryTagsSnapshot" JSONB NOT NULL DEFAULT '[]',
    "allergenTagsSnapshot" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "food_order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_order_events" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "actorUserId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "food_order_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_delivery_assignments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "driverUserId" TEXT,
    "status" "FoodDeliveryStatus" NOT NULL DEFAULT 'not_assigned',
    "publicTrackingToken" TEXT NOT NULL,
    "pickupAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "food_delivery_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_delivery_tracking_events" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "status" "FoodDeliveryStatus" NOT NULL,
    "message" TEXT,
    "actorUserId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "food_delivery_tracking_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_delivery_handover_records" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "checklistJson" JSONB NOT NULL DEFAULT '{}',
    "photoUrl" TEXT,
    "recipientName" TEXT,
    "notes" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "food_delivery_handover_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_subscriptions" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "status" "FoodSubscriptionStatus" NOT NULL DEFAULT 'active',
    "frequency" TEXT NOT NULL DEFAULT 'weekly',
    "nextOrderAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "food_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_subscription_items" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "food_subscription_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_substitution_preferences" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "policy" "FoodSubstitutionPolicy" NOT NULL DEFAULT 'contact_first',
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "food_substitution_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_participant_preferences" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "dietaryPreferences" JSONB NOT NULL DEFAULT '[]',
    "accessibilityPreferences" JSONB NOT NULL DEFAULT '[]',
    "communicationPreferences" JSONB NOT NULL DEFAULT '{}',
    "deliveryNotes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "food_participant_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_allergy_profiles" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "allergens" JSONB NOT NULL DEFAULT '[]',
    "severityNotes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "food_allergy_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "status" "FoodPaymentStatus" NOT NULL DEFAULT 'pending',
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "billingPaymentId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "food_payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_invoice_links" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "billingInvoiceId" TEXT,
    "legacyInvoiceId" TEXT,
    "xeroSyncStatus" TEXT NOT NULL DEFAULT 'pending',
    "ndisReviewStatus" TEXT NOT NULL DEFAULT 'review_required',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "food_invoice_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_refunds" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "food_refunds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_disputes" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "raisedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "FoodDisputeStatus" NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "food_disputes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_safety_events" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "reporterId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "FoodSafetySeverity" NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "food_safety_events_pkey" PRIMARY KEY ("id")
);

-- Indexes and uniques
CREATE UNIQUE INDEX "food_vendors_organisationId_key" ON "food_vendors"("organisationId");
CREATE UNIQUE INDEX "food_vendor_profiles_vendorId_key" ON "food_vendor_profiles"("vendorId");
CREATE UNIQUE INDEX "food_product_categories_slug_key" ON "food_product_categories"("slug");
CREATE INDEX "food_products_vendorId_status_idx" ON "food_products"("vendorId", "status");
CREATE INDEX "food_products_category_status_idx" ON "food_products"("category", "status");
CREATE UNIQUE INDEX "food_product_dietary_tags_productId_tag_key" ON "food_product_dietary_tags"("productId", "tag");
CREATE UNIQUE INDEX "food_product_accessibility_tags_productId_tag_key" ON "food_product_accessibility_tags"("productId", "tag");
CREATE UNIQUE INDEX "food_inventory_productId_key" ON "food_inventory"("productId");
CREATE UNIQUE INDEX "food_carts_participantId_key" ON "food_carts"("participantId");
CREATE UNIQUE INDEX "food_cart_items_cartId_productId_key" ON "food_cart_items"("cartId", "productId");
CREATE INDEX "food_orders_participantId_status_idx" ON "food_orders"("participantId", "status");
CREATE INDEX "food_orders_vendorId_status_idx" ON "food_orders"("vendorId", "status");
CREATE INDEX "food_order_items_orderId_idx" ON "food_order_items"("orderId");
CREATE INDEX "food_order_events_orderId_createdAt_idx" ON "food_order_events"("orderId", "createdAt");
CREATE UNIQUE INDEX "food_delivery_assignments_orderId_key" ON "food_delivery_assignments"("orderId");
CREATE UNIQUE INDEX "food_delivery_assignments_publicTrackingToken_key" ON "food_delivery_assignments"("publicTrackingToken");
CREATE INDEX "food_delivery_assignments_driverUserId_status_idx" ON "food_delivery_assignments"("driverUserId", "status");
CREATE INDEX "food_delivery_tracking_events_assignmentId_createdAt_idx" ON "food_delivery_tracking_events"("assignmentId", "createdAt");
CREATE UNIQUE INDEX "food_delivery_handover_records_assignmentId_key" ON "food_delivery_handover_records"("assignmentId");
CREATE INDEX "food_subscriptions_participantId_status_idx" ON "food_subscriptions"("participantId", "status");
CREATE UNIQUE INDEX "food_substitution_preferences_participantId_key" ON "food_substitution_preferences"("participantId");
CREATE UNIQUE INDEX "food_participant_preferences_participantId_key" ON "food_participant_preferences"("participantId");
CREATE UNIQUE INDEX "food_allergy_profiles_participantId_key" ON "food_allergy_profiles"("participantId");
CREATE INDEX "food_payments_orderId_idx" ON "food_payments"("orderId");
CREATE INDEX "food_invoice_links_orderId_idx" ON "food_invoice_links"("orderId");
CREATE INDEX "food_disputes_orderId_idx" ON "food_disputes"("orderId");
CREATE INDEX "data_access_logs_subjectUserId_createdAt_idx" ON "data_access_logs"("subjectUserId", "createdAt");
CREATE INDEX "data_access_logs_actorUserId_createdAt_idx" ON "data_access_logs"("actorUserId", "createdAt");

-- Foreign keys
ALTER TABLE "food_vendors" ADD CONSTRAINT "food_vendors_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_vendor_profiles" ADD CONSTRAINT "food_vendor_profiles_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "food_vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_products" ADD CONSTRAINT "food_products_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "food_vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_meal_items" ADD CONSTRAINT "food_meal_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "food_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_product_dietary_tags" ADD CONSTRAINT "food_product_dietary_tags_productId_fkey" FOREIGN KEY ("productId") REFERENCES "food_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_product_accessibility_tags" ADD CONSTRAINT "food_product_accessibility_tags_productId_fkey" FOREIGN KEY ("productId") REFERENCES "food_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_inventory" ADD CONSTRAINT "food_inventory_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "food_vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_inventory" ADD CONSTRAINT "food_inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "food_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_carts" ADD CONSTRAINT "food_carts_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_cart_items" ADD CONSTRAINT "food_cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "food_carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_cart_items" ADD CONSTRAINT "food_cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "food_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "food_orders" ADD CONSTRAINT "food_orders_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "food_orders" ADD CONSTRAINT "food_orders_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "food_vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "food_orders" ADD CONSTRAINT "food_orders_nomineeId_fkey" FOREIGN KEY ("nomineeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_order_items" ADD CONSTRAINT "food_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "food_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_order_items" ADD CONSTRAINT "food_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "food_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_order_events" ADD CONSTRAINT "food_order_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "food_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_delivery_assignments" ADD CONSTRAINT "food_delivery_assignments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "food_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_delivery_assignments" ADD CONSTRAINT "food_delivery_assignments_driverUserId_fkey" FOREIGN KEY ("driverUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_delivery_tracking_events" ADD CONSTRAINT "food_delivery_tracking_events_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "food_delivery_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_delivery_handover_records" ADD CONSTRAINT "food_delivery_handover_records_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "food_delivery_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_subscriptions" ADD CONSTRAINT "food_subscriptions_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_subscription_items" ADD CONSTRAINT "food_subscription_items_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "food_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_substitution_preferences" ADD CONSTRAINT "food_substitution_preferences_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_participant_preferences" ADD CONSTRAINT "food_participant_preferences_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_allergy_profiles" ADD CONSTRAINT "food_allergy_profiles_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_payments" ADD CONSTRAINT "food_payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "food_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_invoice_links" ADD CONSTRAINT "food_invoice_links_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "food_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_refunds" ADD CONSTRAINT "food_refunds_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "food_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_disputes" ADD CONSTRAINT "food_disputes_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "food_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_disputes" ADD CONSTRAINT "food_disputes_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "food_safety_events" ADD CONSTRAINT "food_safety_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "food_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_safety_events" ADD CONSTRAINT "food_safety_events_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
