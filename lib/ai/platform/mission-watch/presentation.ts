import type {
  InAppWatchAlert,
  MapAbleMissionWatch,
  MissionWatchPresentation,
  WatchAlertBucket,
} from "./types";

const BUCKET_COPY: Record<WatchAlertBucket, { title: string; body: string }> = {
  upcoming: {
    title: "Upcoming",
    body: "Things that are coming up soon on this mission.",
  },
  needs_attention: {
    title: "Needs attention",
    body: "Items that may need your decision. MapAble will not act for you.",
  },
  waiting_on: {
    title: "Waiting on",
    body: "Items waiting on someone else, such as human review.",
  },
  recently_changed: {
    title: "Recently changed",
    body: "Alerts from the latest watch evaluation.",
  },
};

export function formatMissionWatchForParticipant(input: {
  watches: MapAbleMissionWatch[];
  alerts: InAppWatchAlert[];
}): MissionWatchPresentation {
  const sections = (Object.keys(BUCKET_COPY) as WatchAlertBucket[]).map((bucket) => {
    const items =
      bucket === "recently_changed"
        ? input.alerts
        : input.alerts.filter((a) => a.bucket === bucket);

    return {
      id: bucket,
      title: BUCKET_COPY[bucket].title,
      body: BUCKET_COPY[bucket].body,
      items: items.map((a) => ({
        alertId: a.alertId,
        watchId: a.watchId,
        title: a.title,
        body: a.body,
        recommendation: a.recommendation,
        severity: a.severity,
        actions: a.participantActions,
      })),
    };
  });

  const enabledOptional = input.watches.filter((w) => w.optional && w.enabled).length;
  return {
    heading: "Mission watch",
    summary:
      input.alerts.length === 0
        ? "No watch alerts right now. You can still reassess your mission anytime."
        : `${input.alerts.length} alert(s). You choose what to do. ${enabledOptional} optional watch(es) can be disabled.`,
    sections,
  };
}
