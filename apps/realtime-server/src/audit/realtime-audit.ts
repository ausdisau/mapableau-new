export function logRealtimeEvent(event: string, meta: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") {
    console.info(JSON.stringify({ type: "realtime_audit", event, ...meta }));
  }
}
