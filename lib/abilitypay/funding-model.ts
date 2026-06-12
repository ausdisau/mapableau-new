import type {
  AbilityPayFundingModel,
  BillingFundingSourceType,
} from "@prisma/client";

export type AbilityPayFundingRoute =
  | { model: "plan_managed"; adapter: "plan_export"; nextStep: "export" }
  | { model: "self_managed"; adapter: "stripe_checkout"; nextStep: "pay" }
  | { model: "private_pay"; adapter: "stripe_checkout"; nextStep: "pay" }
  | { model: "agency_managed"; adapter: "ndia_claim"; nextStep: "ndia_handoff" };

export function fundingRouteForModel(
  model: AbilityPayFundingModel
): AbilityPayFundingRoute {
  switch (model) {
    case "plan_managed":
      return {
        model: "plan_managed",
        adapter: "plan_export",
        nextStep: "export",
      };
    case "self_managed":
      return {
        model: "self_managed",
        adapter: "stripe_checkout",
        nextStep: "pay",
      };
    case "private_pay":
      return {
        model: "private_pay",
        adapter: "stripe_checkout",
        nextStep: "pay",
      };
    case "agency_managed":
      return {
        model: "agency_managed",
        adapter: "ndia_claim",
        nextStep: "ndia_handoff",
      };
    default: {
      const _exhaustive: never = model;
      return _exhaustive;
    }
  }
}

export function billingFundingTypeForModel(
  model: AbilityPayFundingModel
): BillingFundingSourceType | null {
  switch (model) {
    case "plan_managed":
      return "ndis_plan_managed";
    case "self_managed":
      return "ndis_self_managed";
    case "private_pay":
      return "private_card";
    case "agency_managed":
      return null;
    default: {
      const _exhaustive: never = model;
      return _exhaustive;
    }
  }
}

export function resolveFundingModel(params: {
  invoiceFundingModel?: AbilityPayFundingModel | null;
  planFundingModel?: AbilityPayFundingModel | null;
}): AbilityPayFundingModel {
  return (
    params.invoiceFundingModel ??
    params.planFundingModel ??
    "plan_managed"
  );
}

export function fundingModelLabel(model: AbilityPayFundingModel): string {
  switch (model) {
    case "plan_managed":
      return "Plan-managed";
    case "self_managed":
      return "Self-managed";
    case "agency_managed":
      return "Agency-managed";
    case "private_pay":
      return "Private pay";
    default: {
      const _exhaustive: never = model;
      return _exhaustive;
    }
  }
}
