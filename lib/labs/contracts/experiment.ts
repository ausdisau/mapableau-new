export const LAB_EXPERIMENT_STATUSES = [
  "DEMONSTRATION",
  "CO_DESIGN",
  "PRODUCT_RESEARCH",
  "FORMAL_RESEARCH",
] as const;

export type LabExperimentStatus = (typeof LAB_EXPERIMENT_STATUSES)[number];

export const LAB_ENVIRONMENT_MODES = ["SIMULATION"] as const;

export type LabEnvironmentMode = (typeof LAB_ENVIRONMENT_MODES)[number];

/** Hard marker — Labs outputs are never production evidence. */
export const LABS_SIMULATION_DATA = true as const;

export type LabExperiment = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  status: LabExperimentStatus;
  environmentMode: LabEnvironmentMode;
  scenarioId: string;
  labsSimulationData: typeof LABS_SIMULATION_DATA;
};
