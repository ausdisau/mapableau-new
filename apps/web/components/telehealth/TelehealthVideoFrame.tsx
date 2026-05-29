export function TelehealthVideoFrame({ joinUrl }: { joinUrl: string }) {
  return (
    <iframe
      src={joinUrl}
      title="Telehealth video session"
      className="aspect-video w-full rounded-lg border"
      allow="camera; microphone; fullscreen"
    />
  );
}
