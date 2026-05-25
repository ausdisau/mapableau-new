"use client";

export function TimelineExportButton({ participantId }: { participantId: string }) {
  async function exportTimeline() {
    await fetch("/api/participant/timeline/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId, format: "json" }),
    });
  }

  return (
    <button
      type="button"
      onClick={() => void exportTimeline()}
      className="min-h-11 rounded-lg border border-input px-4"
    >
      Export timeline
    </button>
  );
}
