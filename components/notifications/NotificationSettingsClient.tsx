"use client";

import { NotificationPermissionPrompt } from "@/components/notifications/NotificationPermissionPrompt";
import { NotificationPreferencesPanel } from "@/components/notifications/NotificationPreferencesPanel";

export function NotificationSettingsClient() {
  const requestPermission = async () => {
    if (typeof Notification === "undefined") return;
    await Notification.requestPermission();
  };

  return (
    <>
      <NotificationPermissionPrompt onEnable={() => void requestPermission()} />
      <NotificationPreferencesPanel />
    </>
  );
}
