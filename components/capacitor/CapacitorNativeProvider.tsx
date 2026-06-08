"use client";

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

import {
  isCapacitorNative,
  registerNativePush,
  unregisterNativePush,
} from "@/lib/capacitor/native-bridge";

async function syncPushToken(platform: string, token: string) {
  await fetch("/api/notifications/push/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ platform, token }),
  });
}

async function removePushToken(platform: string, token: string) {
  await fetch("/api/notifications/push/register", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ platform, token }),
  });
}

export function CapacitorNativeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const pushTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isCapacitorNative()) return;

    const appUrlListener = App.addListener("appUrlOpen", ({ url }) => {
      if (typeof window !== "undefined" && url) {
        window.location.href = url;
      }
    });

    return () => {
      void appUrlListener.then((handle) => handle.remove());
    };
  }, []);

  useEffect(() => {
    if (!isCapacitorNative()) return;

    if (status !== "authenticated") {
      const token = pushTokenRef.current;
      if (token) {
        void removePushToken(Capacitor.getPlatform(), token);
        void unregisterNativePush();
        pushTokenRef.current = null;
      }
      return;
    }

    let cancelled = false;

    void (async () => {
      const platform = Capacitor.getPlatform();
      const token = await registerNativePush();
      if (!token || cancelled) return;
      pushTokenRef.current = token;
      await syncPushToken(platform, token);
    })();

    return () => {
      cancelled = true;
    };
  }, [status]);

  return children;
}
