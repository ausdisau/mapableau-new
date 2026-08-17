/**
 * Access Infrastructure feature flags.
 * All default off. Permanent deny flags live in intelligence-next.
 *
 * E01 Access Graph APIs require `enabled` AND `graph` (G3+).
 */

function envTruthy(key: string): boolean {
  const v = process.env[key];
  return v === "1" || v === "true" || v === "yes";
}

export const accessInfrastructureFlags = {
  get enabled() {
    return envTruthy("MAPABLE_ACCESS_INFRASTRUCTURE_ENABLED");
  },
  get passport() {
    return envTruthy("MAPABLE_ACCESS_PASSPORT_ENABLED");
  },
  get compatibilityEngine() {
    return envTruthy("MAPABLE_ACCESS_COMPATIBILITY_ENGINE_ENABLED");
  },
  get journeyEngine() {
    return envTruthy("MAPABLE_ACCESS_JOURNEY_ENGINE_ENABLED");
  },
  /** Epic 01 Access Graph observation + read APIs (G3 technical proof). */
  get graph() {
    return envTruthy("MAPABLE_ACCESS_GRAPH_ENABLED");
  },
  /** Photo evidence uploads (requires object storage + graph flags). */
  get evidenceUploads() {
    return envTruthy("MAPABLE_ACCESS_EVIDENCE_UPLOADS_ENABLED");
  },
  /** True when graph APIs may serve requests. */
  get graphApisEnabled() {
    return this.enabled && this.graph;
  },
  /** True when access-evidence photo upload APIs may serve requests. */
  get evidenceUploadsEnabled() {
    return (
      this.graphApisEnabled &&
      this.evidenceUploads &&
      envTruthy("MAPABLE_OBJECT_STORAGE_ENABLED")
    );
  },
};
