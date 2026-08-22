/**
 * Environmental facts on a GAIS feature.
 * Missing values remain undefined — never default to accessible values.
 */

export type GaisFeatureProperties = {
  widthMm?: number;
  gradientPercent?: number;
  crossSlopePercent?: number;
  surface?: string;
  thresholdHeightMm?: number;
  kerbHeightMm?: number;
  stepFree?: boolean;
  automaticDoor?: boolean;
  liftAvailable?: boolean;
  /** Barrier-specific */
  barrierType?: string;
  description?: string;
  graphId?: string;
  segmentExternalId?: string;
  /** Place category when type is PLACE */
  category?: string;
  suburb?: string;
  /** Feature tag from AccessPlaceFeature when applicable */
  accessFeatureTag?: string;
  [key: string]: string | number | boolean | undefined;
};
