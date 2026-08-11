/**
 * Access Infrastructure feature flags.
 * All default off. Permanent deny flags live in intelligence-next.
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
    return (
      accessInfrastructureFlags.enabled &&
      envTruthy("MAPABLE_ACCESS_PASSPORT_ENABLED")
    );
  },
  get capabilities() {
    return (
      accessInfrastructureFlags.enabled &&
      envTruthy("MAPABLE_ACCESS_CAPABILITIES_ENABLED")
    );
  },
  get compatibilityEngine() {
    return (
      accessInfrastructureFlags.enabled &&
      envTruthy("MAPABLE_ACCESS_COMPATIBILITY_ENGINE_ENABLED")
    );
  },
  get journeyEngine() {
    return (
      accessInfrastructureFlags.enabled &&
      envTruthy("MAPABLE_ACCESS_JOURNEY_ENGINE_ENABLED")
    );
  },
  /** Deferred programme stubs — always false until dedicated PRs wire them. */
  get accessOmniIntelligence() {
    return (
      accessInfrastructureFlags.enabled &&
      envTruthy("MAPABLE_ACCESS_OMNI_INTELLIGENCE_ENABLED")
    );
  },
  get accessVision() {
    return (
      accessInfrastructureFlags.enabled &&
      envTruthy("MAPABLE_ACCESS_VISION_ENABLED")
    );
  },
  get accessSceneGraph() {
    return (
      accessInfrastructureFlags.enabled &&
      envTruthy("MAPABLE_ACCESS_SCENE_GRAPH_ENABLED")
    );
  },
  get accessTemporalEvents() {
    return (
      accessInfrastructureFlags.enabled &&
      envTruthy("MAPABLE_ACCESS_TEMPORAL_EVENTS_ENABLED")
    );
  },
  get askMapAble() {
    return (
      accessInfrastructureFlags.enabled &&
      envTruthy("MAPABLE_ASK_MAPABLE_ENABLED")
    );
  },
  get careAccessCompatibility() {
    return (
      accessInfrastructureFlags.enabled &&
      envTruthy("MAPABLE_CARE_ACCESS_COMPATIBILITY_ENABLED")
    );
  },
  get transportAccessCompatibility() {
    return (
      accessInfrastructureFlags.enabled &&
      envTruthy("MAPABLE_TRANSPORT_ACCESS_COMPATIBILITY_ENABLED")
    );
  },
  get jobsAccessCompatibility() {
    return (
      accessInfrastructureFlags.enabled &&
      envTruthy("MAPABLE_JOBS_ACCESS_COMPATIBILITY_ENABLED")
    );
  },
  get crossVerticalAccess() {
    return (
      accessInfrastructureFlags.enabled &&
      envTruthy("MAPABLE_CROSS_VERTICAL_ACCESS_ENABLED")
    );
  },
};
