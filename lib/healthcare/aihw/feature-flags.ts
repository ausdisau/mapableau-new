export function isAihwMyHospitalsEnabled(): boolean {
  return process.env.MAPABLE_HEALTHCARE_AIHW_ENABLED === "true";
}
