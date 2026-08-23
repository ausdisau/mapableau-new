export const AUTONOMY_MODES = [
  "INFORM",
  "SUGGEST",
  "ASSIST",
  "COMPARE",
] as const;

export type AutonomyMode = (typeof AUTONOMY_MODES)[number];

export const AUTONOMY_MODE_LABELS: Record<AutonomyMode, string> = {
  INFORM: "Inform",
  SUGGEST: "Suggest",
  ASSIST: "Assist",
  COMPARE: "Compare",
};

export const AUTONOMY_MODE_DESCRIPTIONS: Record<AutonomyMode, string> = {
  INFORM:
    "The simulated system explains what it sees. You make every navigation decision.",
  SUGGEST:
    "The simulated system recommends options and waits for your choice.",
  ASSIST:
    "Routine simulated navigation can continue, but meaningful changes require your approval.",
  COMPARE:
    "Run the same journey under different autonomy rules and compare how they feel.",
};
