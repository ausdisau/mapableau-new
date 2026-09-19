import { z } from "zod";

export const sensorThingsThingSchema = z
  .object({
    "@iot.id": z.number().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    Datastreams: z.array(z.lazy(() => sensorThingsDatastreamSchema)).optional(),
  })
  .passthrough();

export const sensorThingsDatastreamSchema = z
  .object({
    "@iot.id": z.number().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    unitOfMeasurement: z
      .object({
        name: z.string().optional(),
        symbol: z.string().optional(),
      })
      .optional(),
    Observations: z.array(z.lazy(() => sensorThingsObservationSchema)).optional(),
  })
  .passthrough();

export const sensorThingsObservationSchema = z
  .object({
    "@iot.id": z.number().optional(),
    phenomenonTime: z.string().optional(),
    resultTime: z.string().optional(),
    result: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
    Feature: z
      .object({
        geometry: z
          .object({
            type: z.literal("Point"),
            coordinates: z.tuple([z.number(), z.number()]),
          })
          .optional(),
      })
      .optional(),
  })
  .passthrough();

export type SensorThingsObservation = z.infer<typeof sensorThingsObservationSchema>;
