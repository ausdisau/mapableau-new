-- MapAble Ads auction & prepaid billing (additive).
-- Does not alter accessibility, provider suitability, or organic ranking tables.

CREATE TYPE "AdBidModel" AS ENUM ('CPM', 'CPC', 'HOUSE');
CREATE TYPE "AdWalletStatus" AS ENUM ('ACTIVE', 'FROZEN', 'CLOSED');
CREATE TYPE "AdWalletLedgerType" AS ENUM (
  'TOP_UP',
  'IMPRESSION_CHARGE',
  'CLICK_CHARGE',
  'REFUND',
  'DISPUTE',
  'MANUAL_CREDIT',
  'MANUAL_DEBIT',
  'ADJUSTMENT_REVERSAL'
);
CREATE TYPE "AdWalletTopUpStatus" AS ENUM (
  'PENDING',
  'SUCCEEDED',
  'FAILED',
  'REFUNDED',
  'DISPUTED'
);
CREATE TYPE "AdBillingEventStatus" AS ENUM (
  'PENDING',
  'CHARGED',
  'WAIVED',
  'REFUNDED',
  'FAILED'
);

ALTER TABLE "ad_campaigns"
  ADD COLUMN "bidModel" "AdBidModel" NOT NULL DEFAULT 'CPM',
  ADD COLUMN "maxBidMicros" BIGINT,
  ADD COLUMN "dailyBudgetMicros" BIGINT,
  ADD COLUMN "lifetimeBudgetMicros" BIGINT,
  ADD COLUMN "todaySpendMicros" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "lifetimeSpendMicros" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "spendDayKey" TEXT,
  ADD COLUMN "lifetimeImpressions" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "lifetimeClicks" BIGINT NOT NULL DEFAULT 0;

CREATE INDEX "ad_campaigns_bidModel_idx" ON "ad_campaigns"("bidModel");

CREATE TABLE "ad_wallets" (
  "id" TEXT NOT NULL,
  "advertiserId" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'AUD',
  "availableMicros" BIGINT NOT NULL DEFAULT 0,
  "status" "AdWalletStatus" NOT NULL DEFAULT 'ACTIVE',
  "stripeCustomerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ad_wallets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ad_wallets_advertiserId_currency_key" ON "ad_wallets"("advertiserId", "currency");
CREATE INDEX "ad_wallets_status_idx" ON "ad_wallets"("status");
CREATE INDEX "ad_wallets_stripeCustomerId_idx" ON "ad_wallets"("stripeCustomerId");

ALTER TABLE "ad_wallets"
  ADD CONSTRAINT "ad_wallets_advertiserId_fkey"
  FOREIGN KEY ("advertiserId") REFERENCES "ad_advertisers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ad_wallet_ledger_entries" (
  "id" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "type" "AdWalletLedgerType" NOT NULL,
  "amountMicros" BIGINT NOT NULL,
  "balanceAfterMicros" BIGINT,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "stripeEventId" TEXT,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ad_wallet_ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ad_wallet_ledger_entries_idempotencyKey_key"
  ON "ad_wallet_ledger_entries"("idempotencyKey");
CREATE INDEX "ad_wallet_ledger_entries_walletId_createdAt_idx"
  ON "ad_wallet_ledger_entries"("walletId", "createdAt");
CREATE INDEX "ad_wallet_ledger_entries_type_idx" ON "ad_wallet_ledger_entries"("type");
CREATE INDEX "ad_wallet_ledger_entries_stripeEventId_idx"
  ON "ad_wallet_ledger_entries"("stripeEventId");

ALTER TABLE "ad_wallet_ledger_entries"
  ADD CONSTRAINT "ad_wallet_ledger_entries_walletId_fkey"
  FOREIGN KEY ("walletId") REFERENCES "ad_wallets"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ad_wallet_top_ups" (
  "id" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "amountMicros" BIGINT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'AUD',
  "status" "AdWalletTopUpStatus" NOT NULL DEFAULT 'PENDING',
  "stripeCheckoutSessionId" TEXT,
  "stripePaymentIntentId" TEXT,
  "stripeEventId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "ad_wallet_top_ups_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ad_wallet_top_ups_stripeCheckoutSessionId_key"
  ON "ad_wallet_top_ups"("stripeCheckoutSessionId");
CREATE INDEX "ad_wallet_top_ups_walletId_idx" ON "ad_wallet_top_ups"("walletId");
CREATE INDEX "ad_wallet_top_ups_status_idx" ON "ad_wallet_top_ups"("status");

ALTER TABLE "ad_wallet_top_ups"
  ADD CONSTRAINT "ad_wallet_top_ups_walletId_fkey"
  FOREIGN KEY ("walletId") REFERENCES "ad_wallets"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ad_auction_results" (
  "id" TEXT NOT NULL,
  "decisionId" TEXT NOT NULL,
  "placementCode" TEXT NOT NULL,
  "winnerCampaignId" TEXT,
  "winnerBidModel" "AdBidModel",
  "winnerMaxBidMicros" BIGINT,
  "winnerRawEcpmMicros" BIGINT,
  "winnerQualityScoreMilli" INTEGER,
  "runnerUpEffectiveScore" BIGINT,
  "reservePriceMicros" BIGINT NOT NULL,
  "clearingEcpmMicros" BIGINT,
  "clearingUnitPriceMicros" BIGINT,
  "algorithmVersion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ad_auction_results_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ad_auction_results_decisionId_key" ON "ad_auction_results"("decisionId");
CREATE INDEX "ad_auction_results_placementCode_idx" ON "ad_auction_results"("placementCode");
CREATE INDEX "ad_auction_results_winnerCampaignId_idx" ON "ad_auction_results"("winnerCampaignId");
CREATE INDEX "ad_auction_results_createdAt_idx" ON "ad_auction_results"("createdAt");

ALTER TABLE "ad_auction_results"
  ADD CONSTRAINT "ad_auction_results_winnerCampaignId_fkey"
  FOREIGN KEY ("winnerCampaignId") REFERENCES "ad_campaigns"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ad_billing_events" (
  "id" TEXT NOT NULL,
  "decisionId" TEXT NOT NULL,
  "impressionId" TEXT,
  "clickId" TEXT,
  "campaignId" TEXT NOT NULL,
  "advertiserId" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "bidModel" "AdBidModel" NOT NULL,
  "clearingPriceMicros" BIGINT NOT NULL,
  "chargedMicros" BIGINT NOT NULL,
  "status" "AdBillingEventStatus" NOT NULL DEFAULT 'PENDING',
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ad_billing_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ad_billing_events_idempotencyKey_key" ON "ad_billing_events"("idempotencyKey");
CREATE INDEX "ad_billing_events_decisionId_idx" ON "ad_billing_events"("decisionId");
CREATE INDEX "ad_billing_events_campaignId_idx" ON "ad_billing_events"("campaignId");
CREATE INDEX "ad_billing_events_walletId_idx" ON "ad_billing_events"("walletId");
CREATE INDEX "ad_billing_events_status_idx" ON "ad_billing_events"("status");
CREATE INDEX "ad_billing_events_createdAt_idx" ON "ad_billing_events"("createdAt");

ALTER TABLE "ad_billing_events"
  ADD CONSTRAINT "ad_billing_events_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "ad_campaigns"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ad_billing_events"
  ADD CONSTRAINT "ad_billing_events_advertiserId_fkey"
  FOREIGN KEY ("advertiserId") REFERENCES "ad_advertisers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ad_billing_events"
  ADD CONSTRAINT "ad_billing_events_walletId_fkey"
  FOREIGN KEY ("walletId") REFERENCES "ad_wallets"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Default placement reserve floors via placement rules (operator-configurable).
-- Values are CPM micros (1 AUD = 1_000_000 micros).
INSERT INTO "ad_placements" ("id", "code", "surface", "format", "maxItems", "status", "createdAt", "updatedAt")
VALUES
  ('plc_access_marker', 'access.map.sponsored-marker', 'access', 'map_marker', 3, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('plc_access_card', 'access.map.sponsored-card', 'access', 'map_card', 1, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('plc_access_sheet', 'access.map.bottom-sheet', 'access', 'bottom_sheet', 1, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('plc_access_inline', 'access.results.inline', 'access', 'inline', 1, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('plc_pf_card', 'provider-finder.map.sponsored-card', 'provider_finder', 'map_card', 1, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('plc_pf_inline', 'provider-finder.results.inline', 'provider_finder', 'inline', 1, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('plc_pf_sidebar', 'provider-finder.sidebar', 'provider_finder', 'sidebar', 1, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "ad_placement_rules" ("id", "placementId", "ruleKey", "ruleValue", "createdAt", "updatedAt")
SELECT v.rule_id, p.id, 'floor_cpm_micros', v.floor, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
  ('adrule_floor_access_marker', 'access.map.sponsored-marker', '16000000'),
  ('adrule_floor_access_card', 'access.map.sponsored-card', '18000000'),
  ('adrule_floor_access_sheet', 'access.map.bottom-sheet', '18000000'),
  ('adrule_floor_access_inline', 'access.results.inline', '20000000'),
  ('adrule_floor_pf_card', 'provider-finder.map.sponsored-card', '24000000'),
  ('adrule_floor_pf_inline', 'provider-finder.results.inline', '28000000'),
  ('adrule_floor_pf_sidebar', 'provider-finder.sidebar', '24000000')
) AS v(rule_id, code, floor)
JOIN "ad_placements" p ON p.code = v.code
WHERE NOT EXISTS (
  SELECT 1 FROM "ad_placement_rules" r
  WHERE r."placementId" = p.id AND r."ruleKey" = 'floor_cpm_micros'
);
