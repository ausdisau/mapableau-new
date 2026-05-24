export const abrLookupConfig = {
  guid: process.env.ABR_LOOKUP_GUID ?? "",
  adapterMode: (process.env.ABR_LOOKUP_ADAPTER_MODE ?? "mock") as "mock" | "http",
  requestTimeoutMs: Number(process.env.ABR_LOOKUP_TIMEOUT_MS ?? "30000"),
  autoRunOnSubmit: process.env.ABR_LOOKUP_AUTO_RUN_ON_SUBMIT !== "false",
  nameMatchThreshold: Number(process.env.ABR_NAME_MATCH_THRESHOLD ?? "0.75"),
};

export function isAbrLookupLiveEnabled(): boolean {
  return (
    abrLookupConfig.adapterMode === "http" &&
    abrLookupConfig.guid.length > 0
  );
}
