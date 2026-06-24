-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('pending', 'paid', 'failed', 'cancelled');

-- AlterEnum
ALTER TYPE "StripePaymentPurpose" ADD VALUE 'donation';

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "status" "DonationStatus" NOT NULL DEFAULT 'pending',
    "donorEmail" TEXT,
    "donorName" TEXT,
    "message" TEXT,
    "userId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Donation_stripeCheckoutSessionId_key" ON "Donation"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "Donation_status_idx" ON "Donation"("status");

-- CreateIndex
CREATE INDEX "Donation_userId_idx" ON "Donation"("userId");

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
