export function OsmAttribution() {
  return (
    <p className="text-xs text-muted-foreground" role="note">
      Map data ©{" "}
      <a
        href="https://www.openstreetmap.org/copyright"
        className="underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        OpenStreetMap contributors
      </a>{" "}
      (ODbL). Routing may use OpenRouteService where configured.
    </p>
  );
}
