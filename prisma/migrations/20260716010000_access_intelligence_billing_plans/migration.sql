-- AlterEnum: Access Intelligence commercial plan codes (Stripe price IDs optional via env).
ALTER TYPE "BillingSubscriptionPlanCode" ADD VALUE 'ai_verify_starter';
ALTER TYPE "BillingSubscriptionPlanCode" ADD VALUE 'ai_verify_operations';
ALTER TYPE "BillingSubscriptionPlanCode" ADD VALUE 'ai_verify_portfolio';
ALTER TYPE "BillingSubscriptionPlanCode" ADD VALUE 'ai_learning_organisation';
ALTER TYPE "BillingSubscriptionPlanCode" ADD VALUE 'ai_enterprise';
