export function OsmAttribution() {
  return (
    <div
      className="absolute bottom-1 left-1 z-10 rounded bg-white/90 px-2 py-1 text-xs text-gray-800 shadow"
      role="note"
    >
      ©{" "}
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        OpenStreetMap
      </a>{" "}
      contributors
    </div>
  );
}
