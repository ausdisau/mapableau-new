import { isTomTomLiveTrafficAllowed } from "@/lib/config/transport-routing";

function envTrue(name: string): boolean {
  return process.env[name] === "true";
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function envCents(name: string): number | null {
  const raw = process.env[name];
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

export const majiConfig = {
  get advisoryEnabled() {
    return envTrue("MAJI_ADVISORY_ENABLED");
  },
  get trafficRoutingEnabled() {
    return envTrue("MAJI_TRAFFIC_ROUTING_ENABLED");
  },
  get tollEstimatesEnabled() {
    return envTrue("MAJI_TOLL_ESTIMATES_ENABLED");
  },
  get syntheticPreviewEnabled() {
    return envTrue("MAJI_SYNTHETIC_PREVIEW_ENABLED");
  },
  get minTimeSavingSeconds() {
    return envInt("MAJI_MIN_TIME_SAVING_SECONDS", 180);
  },
  get minCostSavingCents() {
    return envInt("MAJI_MIN_COST_SAVING_CENTS", 200);
  },
  get cooldownSeconds() {
    return envInt("MAJI_COOLDOWN_SECONDS", 300);
  },
  get syntheticCentsPerKm() {
    return envCents("MAJI_SYNTHETIC_CENTS_PER_KM");
  },
  get syntheticCentsPerPaidMinute() {
    return envCents("MAJI_SYNTHETIC_CENTS_PER_PAID_MINUTE");
  },
};

export function isMajiLiveTrafficAllowed(): boolean {
  return majiConfig.trafficRoutingEnabled && isTomTomLiveTrafficAllowed();
}

export function resolveMajiSyntheticRates(): {
  centsPerKm: number | null;
  centsPerPaidMinute: number | null;
} {
  if (!majiConfig.syntheticPreviewEnabled) {
    return { centsPerKm: null, centsPerPaidMinute: null };
  }
  return {
    centsPerKm: majiConfig.syntheticCentsPerKm,
    centsPerPaidMinute: majiConfig.syntheticCentsPerPaidMinute,
  };
}
