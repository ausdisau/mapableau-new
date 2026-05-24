import type { MatrixRequest, MatrixResult, RouteRequest, RouteResult, RoutingProvider } from "./types";

export class ValhallaRoutingProvider implements RoutingProvider {
  readonly name = "valhalla";

  async route(_request: RouteRequest): Promise<RouteResult> {
    throw new Error("VALHALLA_NOT_CONFIGURED");
  }

  async matrix(_request: MatrixRequest): Promise<MatrixResult> {
    throw new Error("VALHALLA_NOT_CONFIGURED");
  }
}
