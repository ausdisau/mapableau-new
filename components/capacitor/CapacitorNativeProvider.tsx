"use client";

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

import { isEligibleAdRoute } from "@/lib/ads/ad-page-eligibility";
import {
  initializeAdMob,
  refreshAdMobBanner,
} from "@/lib/capacitor/admob-bridge";
import { isAdMobEnabled } from "@/lib/capacitor/admob-config";
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
  const pathname = usePathname() ?? "/";

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
    if (!isCapacitorNative() || !isAdMobEnabled()) return;

    const showAds = isEligibleAdRoute(pathname);
    void refreshAdMobBanner(showAds);

    return () => {
      void refreshAdMobBanner(false);
    };
  }, [pathname]);

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

  useEffect(() => {
    if (!isCapacitorNative() || !isAdMobEnabled()) return;
    void initializeAdMob();
  }, []);

  return children;
}
