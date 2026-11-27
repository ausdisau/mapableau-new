import { afterEach, describe, expect, it } from "vitest";

import {
  getProviderCloudOperationsSnapshot,
  isProviderCloudPremiumEnabled,
  isProviderCloudSupplierOperationsEnabled,
  providerCloudConfig,
} from "@/lib/config/providercloud";
import { MAPABLE_ID_SERVICES } from "@/lib/identity/mapable-id-services";
import { buildProviderCloudStatus } from "@/lib/providercloud/status";

describe("ProviderCloud premium correction", () => {
  const previousPremium = process.env.MAPABLE_PROVIDERCLOUD_PREMIUM;
  const previousSupplier = process.env.MAPABLE_PROVIDERCLOUD_SUPPLIER_OPS;
  const previousOps = process.env.MAPABLE_PROVIDER_OPS_ENABLED;

  afterEach(() => {
    if (previousPremium === undefined) {
      delete process.env.MAPABLE_PROVIDERCLOUD_PREMIUM;
    } else {
      process.env.MAPABLE_PROVIDERCLOUD_PREMIUM = previousPremium;
    }
    if (previousSupplier === undefined) {
      delete process.env.MAPABLE_PROVIDERCLOUD_SUPPLIER_OPS;
    } else {
      process.env.MAPABLE_PROVIDERCLOUD_SUPPLIER_OPS = previousSupplier;
    }
    if (previousOps === undefined) {
      delete process.env.MAPABLE_PROVIDER_OPS_ENABLED;
    } else {
      process.env.MAPABLE_PROVIDER_OPS_ENABLED = previousOps;
    }
  });

  it("is an included hosted service, not a premium SKU", () => {
    expect(providerCloudConfig.commercialProduct).toBe(false);
    expect(providerCloudConfig.premiumPlacement).toBe(false);
    expect(providerCloudConfig.paidRanking).toBe(false);
    expect(
      MAPABLE_ID_SERVICES.find((service) => service.id === "providercloud")
        ?.status,
    ).toBe("connected");
  });

  it("ignores env attempts to enable premium placement or paid ranking", () => {
    const hostile = {
      MAPABLE_PROVIDERCLOUD_PREMIUM: "true",
      MAPABLE_PROVIDERCLOUD_PAID_RANKING: "true",
      MAPABLE_PROVIDERCLOUD_COMMERCIAL: "true",
    };

    expect(isProviderCloudPremiumEnabled(hostile)).toBe(false);
    expect(getProviderCloudOperationsSnapshot(hostile).premiumPlacement).toBe(
      false,
    );
    expect(getProviderCloudOperationsSnapshot(hostile).paidRanking).toBe(false);
    expect(getProviderCloudOperationsSnapshot(hostile).commercialProduct).toBe(
      false,
    );
  });

  it("keeps supplier operations disabled even when env asks to enable them", () => {
    const hostile = {
      MAPABLE_PROVIDERCLOUD_SUPPLIER_OPS: "true",
      GROCERY_SUPPLIER_AUTOSYNC: "1",
      GROCERY_SUPPLIER_DISABLED: "0",
    };

    expect(isProviderCloudSupplierOperationsEnabled(hostile)).toBe(false);
    expect(
      getProviderCloudOperationsSnapshot(hostile).supplierOperationsEnabled,
    ).toBe(false);
  });

  it("reads the provider-ops flag from the injected env snapshot", () => {
    const enabled = getProviderCloudOperationsSnapshot({
      MAPABLE_PROVIDER_OPS_ENABLED: "true",
    });
    const disabled = getProviderCloudOperationsSnapshot({
      MAPABLE_PROVIDER_OPS_ENABLED: "false",
    });

    expect(enabled.providerOpsEnabled).toBe(true);
    expect(disabled.providerOpsEnabled).toBe(false);
    expect(enabled.supplierOperationsEnabled).toBe(false);
  });

  it("does not treat the provider-ops flag as premium or supplier enablement", () => {
    process.env.MAPABLE_PROVIDER_OPS_ENABLED = "true";
    const status = buildProviderCloudStatus();
    expect(status.operations.providerOpsEnabled).toBe(true);
    expect(status.operations.supplierOperationsEnabled).toBe(false);
    expect(status.operations.premiumPlacement).toBe(false);
    expect(status.operations.commercialProduct).toBe(false);
    expect(status.notice).toMatch(/not a premium listing/i);
  });
});
