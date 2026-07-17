export interface SensorProfile {
  deviceIdentifier: string;
  protocol: string;
  observationTypes: string[];
  participantScoped: false;
}

export function buildSensorProfile(
  deviceIdentifier: string,
  protocol: string,
  observationTypes: string[],
): SensorProfile {
  return {
    deviceIdentifier,
    protocol,
    observationTypes,
    participantScoped: false,
  };
}
