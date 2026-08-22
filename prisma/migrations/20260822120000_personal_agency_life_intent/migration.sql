-- Personal Agency Infrastructure — LifeIntent (additive)

CREATE TYPE "LifeIntentStatus" AS ENUM (
  'EXPLORING',
  'PLANNING',
  'ACTIVE',
  'PAUSED',
  'COMPLETED'
);

CREATE TABLE "life_intents" (
    "id" TEXT NOT NULL,
    "principal_id" TEXT NOT NULL,
    "original_expression" TEXT NOT NULL,
    "status" "LifeIntentStatus" NOT NULL DEFAULT 'EXPLORING',
    "desired_outcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "life_intents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "life_intents_principal_id_status_idx" ON "life_intents"("principal_id", "status");
CREATE INDEX "life_intents_principal_id_created_at_idx" ON "life_intents"("principal_id", "created_at");

ALTER TABLE "life_intents" ADD CONSTRAINT "life_intents_principal_id_fkey" FOREIGN KEY ("principal_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
