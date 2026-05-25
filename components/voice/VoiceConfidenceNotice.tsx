export function VoiceConfidenceNotice({
  confidence,
}: {
  confidence: number | null | undefined;
}) {
  if (confidence == null) return null;

  const pct = Math.round(confidence * 100);
  const level =
    pct >= 85 ? "high" : pct >= 60 ? "medium" : "low";

  return (
    <p className="text-sm" role="status">
      <span className="font-medium">Transcription confidence: </span>
      <span>
        {pct}% ({level})
      </span>
      {level === "low" ? (
        <span className="block mt-1 text-muted-foreground">
          Please check every word before confirming.
        </span>
      ) : null}
    </p>
  );
}
