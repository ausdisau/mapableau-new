# AccessOps domain model

Core models live in Prisma under `AccessAsset`, `AccessFeatureObservation`, `AccessTwinEdge`, `AccessStatusEvent`, `AccessReliabilityMeasurement`, `AccessOpsIncident`, `AccessWorkOrder`, `AccessSensorDevice`, partner clients, and webhook subscriptions.

Assets describe civic access infrastructure. Observations describe feature evidence. Status events describe current operations. Reliability measurements describe feature-level windows.

Do not infer accessibility from absent records. Unknown, stale, and disputed data remain explicit states.
