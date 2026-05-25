"use client";

import { useEffect, useState } from "react";
import * as PusherPushNotifications from "@pusher/push-notifications-web";

import { beamsUserInterest } from "@/lib/notifications/beams-interest";

export function BeamsPushRegistration({ userId }: { userId: string }) {
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const instanceId = process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID?.trim();
    if (!instanceId || typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const registration = await navigator.serviceWorker.register("/service-worker.js", {
          scope: "/",
        });

        const client = new PusherPushNotifications.Client({
          instanceId,
          serviceWorkerRegistration: registration,
        });

        await client.start();
        const interest = beamsUserInterest(userId);
        await client.addDeviceInterest(interest);

        if (!cancelled) {
          setStatus("");
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Push setup failed";
          setStatus(msg);
          if (process.env.NODE_ENV === "development") {
            console.warn("[beams]", msg);
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!status) return null;

  return (
    <p className="sr-only" role="status">
      {status}
    </p>
  );
}
