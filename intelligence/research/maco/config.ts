export type MacoRuntimeConfig = {
  enabled: boolean;
};

export function getMacoConfig(): MacoRuntimeConfig {
  return {
    enabled: process.env.MAPABLE_MACO_ENABLED === "true",
  };
}
