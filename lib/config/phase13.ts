export const phase13Config = {
  resilienceWaveEnabled: process.env.RESILIENCE_WAVE_ENABLED !== "false",
};

export const RESILIENCE_FLAG_KEYS = [
  "service_recovery_enabled",
  "waitlist_exchange_enabled",
  "outcomes_tracker_enabled",
  "quote_marketplace_enabled",
  "support_desk_enabled",
  "journey_timeline_enabled",
  "evidence_pack_builder_enabled",
  "unmet_need_register_enabled",
  "provider_quality_signals_enabled",
] as const;
