import type { MatrixRequest, MatrixResult, RouteRequest, RouteResult, RoutingProvider } from "./types";

export class OpenTripPlannerRoutingProvider implements RoutingProvider {
  readonly name = "opentripplanner";

  async route(_request: RouteRequest): Promise<RouteResult> {
    throw new Error("OTP_NOT_CONFIGURED");
  }

  async matrix(_request: MatrixRequest): Promise<MatrixResult> {
    throw new Error("OTP_NOT_CONFIGURED");
  }
}
