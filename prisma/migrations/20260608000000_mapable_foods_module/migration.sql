-- MapAble Foods module
ALTER TYPE "OrganisationType" ADD VALUE IF NOT EXISTS 'food_vendor';
ALTER TYPE "ConsentScope" ADD VALUE IF NOT EXISTS 'foods_dietary_share';
ALTER TYPE "ConsentScope" ADD VALUE IF NOT EXISTS 'foods_allergy_share';
ALTER TYPE "ConsentScope" ADD VALUE IF NOT EXISTS 'foods_delivery_address_share';
ALTER TYPE "ConsentScope" ADD VALUE IF NOT EXISTS 'foods_invoice_share';
ALTER TYPE "ConsentScope" ADD VALUE IF NOT EXISTS 'foods_delivery_photo_share';
ALTER TYPE "BillingServiceType" ADD VALUE IF NOT EXISTS 'foods';

CREATE TYPE "FoodProductType" AS ENUM ('grocery', 'prepared_meal', 'meal_bundle', 'household_essential');
CREATE TYPE "FoodOrderType" AS ENUM ('one_off', 'recurring', 'subscription');
CREATE TYPE "FoodOrderStatus" AS ENUM ('draft', 'submitted', 'confirmed', 'preparing', 'packed', 'assigned', 'out_for_delivery', 'delivered', 'cancelled', 'disputed', 'refunded');
CREATE TYPE "FoodPaymentStatus" AS ENUM ('unpaid', 'checkout_created', 'processing', 'paid', 'failed', 'refunded', 'blocked');
CREATE TYPE "FoodInvoiceStatus" AS ENUM ('draft', 'created', 'sent', 'under_review', 'paid', 'void', 'sync_failed');
CREATE TYPE "FoodDeliveryStatus" AS ENUM ('not_assigned', 'assigned', 'picked_up', 'out_for_delivery', 'arrived', 'delivered', 'failed', 'cancelled', 'disputed');
CREATE TYPE "FoodOrderItemCostType" AS ENUM ('food_item', 'preparation', 'delivery', 'support_time', 'packaging', 'other');
CREATE TYPE "FoodSubstitutionPolicy" AS ENUM ('no_substitutions', 'contact_me', 'closest_match', 'provider_choice');

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
  "description" TEXT,
  "serviceRegions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "openingHours" JSONB NOT NULL DEFAULT '{}',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "food_vendors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_products" (
  "id" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "productType" "FoodProductType" NOT NULL,
  "priceCents" INTEGER NOT NULL,
  "preparationFeeCents" INTEGER NOT NULL DEFAULT 0,
  "deliveryFeeCents" INTEGER NOT NULL DEFAULT 0,
  "supportFeeCents" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'AUD',
  "dietaryTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "allergenTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "accessibilityTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "inventoryCount" INTEGER,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "food_products_pkey" PRIMARY KEY ("id")
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
  "titleSnapshot" TEXT NOT NULL,
  "unitPriceCents" INTEGER NOT NULL,
  "costType" "FoodOrderItemCostType" NOT NULL DEFAULT 'food_item',
  "dietarySnapshot" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "allergenSnapshot" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "food_cart_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_orders" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "nomineeId" TEXT,
  "orderType" "FoodOrderType" NOT NULL DEFAULT 'one_off',
  "status" "FoodOrderStatus" NOT NULL DEFAULT 'submitted',
  "paymentStatus" "FoodPaymentStatus" NOT NULL DEFAULT 'unpaid',
  "invoiceStatus" "FoodInvoiceStatus" NOT NULL DEFAULT 'draft',
  "substitutionPolicy" "FoodSubstitutionPolicy" NOT NULL DEFAULT 'contact_me',
  "deliveryAddressFull" TEXT NOT NULL,
  "deliveryAddressSuburb" TEXT,
  "deliveryAddressState" TEXT,
  "deliveryAddressPostcode" TEXT,
  "deliveryInstructions" TEXT,
  "deliveryWindowStart" TIMESTAMP(3) NOT NULL,
  "deliveryWindowEnd" TIMESTAMP(3) NOT NULL,
  "allergenAcknowledged" BOOLEAN NOT NULL DEFAULT false,
  "dietarySnapshot" JSONB,
  "allergySnapshot" JSONB,
  "subtotalCents" INTEGER NOT NULL DEFAULT 0,
  "preparationCents" INTEGER NOT NULL DEFAULT 0,
  "deliveryCents" INTEGER NOT NULL DEFAULT 0,
  "supportCents" INTEGER NOT NULL DEFAULT 0,
  "taxCents" INTEGER NOT NULL DEFAULT 0,
  "totalCents" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'AUD',
  "participantConfirmedAt" TIMESTAMP(3),
  "participantDisputedAt" TIMESTAMP(3),
  "disputeReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "food_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_order_items" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "productId" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "titleSnapshot" TEXT NOT NULL,
  "unitPriceCents" INTEGER NOT NULL,
  "totalCents" INTEGER NOT NULL,
  "costType" "FoodOrderItemCostType" NOT NULL DEFAULT 'food_item',
  "dietarySnapshot" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "allergenSnapshot" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "food_order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_order_events" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "fromStatus" "FoodOrderStatus",
  "toStatus" "FoodOrderStatus" NOT NULL,
  "message" TEXT,
  "actorUserId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "food_order_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_delivery_assignments" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "driverUserId" TEXT,
  "driverDisplayName" TEXT,
  "assignedById" TEXT NOT NULL,
  "status" "FoodDeliveryStatus" NOT NULL DEFAULT 'assigned',
  "publicTrackingToken" TEXT NOT NULL,
  "addressSnapshotFull" TEXT NOT NULL,
  "addressSnapshotSuburb" TEXT,
  "handoverInstructions" JSONB,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "food_delivery_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_delivery_tracking_events" (
  "id" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "status" "FoodDeliveryStatus" NOT NULL,
  "message" TEXT,
  "lat" DOUBLE PRECISION,
  "lng" DOUBLE PRECISION,
  "actorUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "food_delivery_tracking_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_delivery_handover_records" (
  "id" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "checklist" JSONB NOT NULL DEFAULT '{}',
  "photoUrl" TEXT,
  "photoConsent" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "recordedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "food_delivery_handover_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_payments" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "billingPaymentId" TEXT,
  "stripeCheckoutSessionId" TEXT,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'AUD',
  "status" "FoodPaymentStatus" NOT NULL DEFAULT 'checkout_created',
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
  "xeroSyncRecordId" TEXT,
  "status" "FoodInvoiceStatus" NOT NULL DEFAULT 'created',
  "lineItemSummary" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "food_invoice_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_refunds" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "reason" TEXT,
  "status" TEXT NOT NULL DEFAULT 'requested',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "food_refunds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_disputes" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "openedById" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "resolution" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "food_disputes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_safety_events" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "reportedById" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "createsDispute" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "food_safety_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_participant_preferences" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "dietaryPreferences" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "texturePreferences" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "accessibilityNotes" TEXT,
  "notificationOptInAmounts" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "food_participant_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_allergy_profiles" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "severityNotes" TEXT,
  "emergencyPlan" TEXT,
  "shareWithVendors" BOOLEAN NOT NULL DEFAULT false,
  "shareWithDrivers" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "food_allergy_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_substitution_preferences" (
  "id" TEXT NOT NULL,
  "preferenceId" TEXT NOT NULL,
  "productType" "FoodProductType",
  "policy" "FoodSubstitutionPolicy" NOT NULL DEFAULT 'contact_me',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "food_substitution_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_subscriptions" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "cadence" TEXT NOT NULL DEFAULT 'weekly',
  "status" TEXT NOT NULL DEFAULT 'active',
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
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "food_subscription_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "food_vendors_organisationId_key" ON "food_vendors"("organisationId");
CREATE INDEX "food_products_vendorId_published_idx" ON "food_products"("vendorId", "published");
CREATE INDEX "food_products_productType_published_idx" ON "food_products"("productType", "published");
CREATE UNIQUE INDEX "food_carts_participantId_key" ON "food_carts"("participantId");
CREATE UNIQUE INDEX "food_cart_items_cartId_productId_key" ON "food_cart_items"("cartId", "productId");
CREATE INDEX "food_orders_participantId_status_idx" ON "food_orders"("participantId", "status");
CREATE INDEX "food_orders_organisationId_status_idx" ON "food_orders"("organisationId", "status");
CREATE INDEX "food_orders_vendorId_status_idx" ON "food_orders"("vendorId", "status");
CREATE INDEX "food_order_items_orderId_idx" ON "food_order_items"("orderId");
CREATE INDEX "food_order_items_costType_idx" ON "food_order_items"("costType");
CREATE INDEX "food_order_events_orderId_createdAt_idx" ON "food_order_events"("orderId", "createdAt");
CREATE UNIQUE INDEX "food_delivery_assignments_orderId_key" ON "food_delivery_assignments"("orderId");
CREATE UNIQUE INDEX "food_delivery_assignments_publicTrackingToken_key" ON "food_delivery_assignments"("publicTrackingToken");
CREATE INDEX "food_delivery_assignments_driverUserId_status_idx" ON "food_delivery_assignments"("driverUserId", "status");
CREATE INDEX "food_delivery_assignments_organisationId_status_idx" ON "food_delivery_assignments"("organisationId", "status");
CREATE INDEX "food_delivery_tracking_events_assignmentId_createdAt_idx" ON "food_delivery_tracking_events"("assignmentId", "createdAt");
CREATE UNIQUE INDEX "food_delivery_handover_records_assignmentId_key" ON "food_delivery_handover_records"("assignmentId");
CREATE INDEX "food_payments_orderId_idx" ON "food_payments"("orderId");
CREATE INDEX "food_payments_stripeCheckoutSessionId_idx" ON "food_payments"("stripeCheckoutSessionId");
CREATE INDEX "food_invoice_links_orderId_idx" ON "food_invoice_links"("orderId");
CREATE INDEX "food_invoice_links_billingInvoiceId_idx" ON "food_invoice_links"("billingInvoiceId");
CREATE INDEX "food_refunds_orderId_idx" ON "food_refunds"("orderId");
CREATE INDEX "food_disputes_orderId_status_idx" ON "food_disputes"("orderId", "status");
CREATE INDEX "food_safety_events_orderId_idx" ON "food_safety_events"("orderId");
CREATE UNIQUE INDEX "food_participant_preferences_participantId_key" ON "food_participant_preferences"("participantId");
CREATE UNIQUE INDEX "food_allergy_profiles_participantId_key" ON "food_allergy_profiles"("participantId");
CREATE INDEX "food_substitution_preferences_preferenceId_idx" ON "food_substitution_preferences"("preferenceId");
CREATE INDEX "food_subscriptions_participantId_status_idx" ON "food_subscriptions"("participantId", "status");
CREATE INDEX "food_subscriptions_vendorId_status_idx" ON "food_subscriptions"("vendorId", "status");
CREATE UNIQUE INDEX "food_subscription_items_subscriptionId_productId_key" ON "food_subscription_items"("subscriptionId", "productId");
CREATE INDEX "data_access_logs_subjectUserId_createdAt_idx" ON "data_access_logs"("subjectUserId", "createdAt");
CREATE INDEX "data_access_logs_actorUserId_createdAt_idx" ON "data_access_logs"("actorUserId", "createdAt");

ALTER TABLE "data_access_logs" ADD CONSTRAINT "data_access_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "data_access_logs" ADD CONSTRAINT "data_access_logs_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_vendors" ADD CONSTRAINT "food_vendors_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_products" ADD CONSTRAINT "food_products_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "food_vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_products" ADD CONSTRAINT "food_products_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_carts" ADD CONSTRAINT "food_carts_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_carts" ADD CONSTRAINT "food_carts_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "food_vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_cart_items" ADD CONSTRAINT "food_cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "food_carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_cart_items" ADD CONSTRAINT "food_cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "food_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "food_orders" ADD CONSTRAINT "food_orders_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "food_orders" ADD CONSTRAINT "food_orders_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "food_vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "food_orders" ADD CONSTRAINT "food_orders_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "food_orders" ADD CONSTRAINT "food_orders_nomineeId_fkey" FOREIGN KEY ("nomineeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_order_items" ADD CONSTRAINT "food_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "food_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_order_items" ADD CONSTRAINT "food_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "food_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_order_events" ADD CONSTRAINT "food_order_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "food_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_delivery_assignments" ADD CONSTRAINT "food_delivery_assignments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "food_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_delivery_assignments" ADD CONSTRAINT "food_delivery_assignments_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "food_delivery_assignments" ADD CONSTRAINT "food_delivery_assignments_driverUserId_fkey" FOREIGN KEY ("driverUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_delivery_assignments" ADD CONSTRAINT "food_delivery_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "food_delivery_tracking_events" ADD CONSTRAINT "food_delivery_tracking_events_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "food_delivery_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_delivery_handover_records" ADD CONSTRAINT "food_delivery_handover_records_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "food_delivery_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_delivery_handover_records" ADD CONSTRAINT "food_delivery_handover_records_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_payments" ADD CONSTRAINT "food_payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "food_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_payments" ADD CONSTRAINT "food_payments_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "food_invoice_links" ADD CONSTRAINT "food_invoice_links_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "food_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_invoice_links" ADD CONSTRAINT "food_invoice_links_billingInvoiceId_fkey" FOREIGN KEY ("billingInvoiceId") REFERENCES "BillingInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_refunds" ADD CONSTRAINT "food_refunds_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "food_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_disputes" ADD CONSTRAINT "food_disputes_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "food_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_disputes" ADD CONSTRAINT "food_disputes_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "food_safety_events" ADD CONSTRAINT "food_safety_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "food_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_safety_events" ADD CONSTRAINT "food_safety_events_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "food_participant_preferences" ADD CONSTRAINT "food_participant_preferences_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_allergy_profiles" ADD CONSTRAINT "food_allergy_profiles_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_substitution_preferences" ADD CONSTRAINT "food_substitution_preferences_preferenceId_fkey" FOREIGN KEY ("preferenceId") REFERENCES "food_participant_preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_subscriptions" ADD CONSTRAINT "food_subscriptions_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_subscriptions" ADD CONSTRAINT "food_subscriptions_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "food_vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_subscription_items" ADD CONSTRAINT "food_subscription_items_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "food_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_subscription_items" ADD CONSTRAINT "food_subscription_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "food_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
