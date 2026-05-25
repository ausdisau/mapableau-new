declare module "react-map-gl/maplibre" {
  import type { ComponentType, ReactNode } from "react";

  type MapProps = {
    initialViewState?: {
      latitude: number;
      longitude: number;
      zoom: number;
    };
    mapStyle?: string;
    style?: Record<string, string>;
    attributionControl?: boolean | Record<string, unknown>;
    children?: ReactNode;
  };

  type MarkerProps = {
    latitude: number;
    longitude: number;
    anchor?: string;
    onClick?: (event: { originalEvent: MouseEvent }) => void;
    children?: ReactNode;
  };

  type NavigationControlProps = {
    position?: string;
  };

  const Map: ComponentType<MapProps>;
  export const Marker: ComponentType<MarkerProps>;
  export const NavigationControl: ComponentType<NavigationControlProps>;
  export default Map;
}
