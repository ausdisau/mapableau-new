"use client";

import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { PushNotifications } from "@capacitor/push-notifications";

export function isCapacitorNative(): boolean {
  return Capacitor.isNativePlatform();
}

export function isCapacitorAndroid(): boolean {
  return Capacitor.getPlatform() === "android";
}

async function confirmPermission(message: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  return window.confirm(message);
}

export async function getNativePosition(options?: {
  rationale?: string;
}): Promise<{ latitude: number; longitude: number } | null> {
  if (!isCapacitorNative()) return null;

  const ok = await confirmPermission(
    options?.rationale ??
      "MapAble needs your location for transport tracking and nearby places. Allow location access?",
  );
  if (!ok) return null;

  const permission = await Geolocation.requestPermissions();
  if (permission.location !== "granted" && permission.coarseLocation !== "granted") {
    return null;
  }

  const position = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 15000,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

export async function captureNativePhoto(options?: {
  rationale?: string;
}): Promise<{ base64: string; format: string } | null> {
  if (!isCapacitorNative()) return null;

  const ok = await confirmPermission(
    options?.rationale ??
      "MapAble needs camera access to attach photos to documents or incident reports. Allow camera access?",
  );
  if (!ok) return null;

  const photo = await Camera.getPhoto({
    quality: 85,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: CameraSource.Prompt,
  });

  if (!photo.base64String) return null;

  return {
    base64: photo.base64String,
    format: photo.format,
  };
}

export async function registerNativePush(options?: {
  rationale?: string;
}): Promise<string | null> {
  if (!isCapacitorNative()) return null;

  const ok = await confirmPermission(
    options?.rationale ??
      "MapAble can send shift reminders, trip updates, and safety alerts. Allow notifications?",
  );
  if (!ok) return null;

  let permission = await PushNotifications.checkPermissions();
  if (permission.receive !== "granted") {
    permission = await PushNotifications.requestPermissions();
  }
  if (permission.receive !== "granted") return null;

  return new Promise((resolve) => {
    const registrationListener = PushNotifications.addListener(
      "registration",
      (token) => {
        registrationListener.then((handle) => handle.remove());
        errorListener.then((handle) => handle.remove());
        resolve(token.value);
      },
    );

    const errorListener = PushNotifications.addListener(
      "registrationError",
      () => {
        registrationListener.then((handle) => handle.remove());
        errorListener.then((handle) => handle.remove());
        resolve(null);
      },
    );

    void PushNotifications.register();
  });
}

export async function unregisterNativePush(): Promise<void> {
  if (!isCapacitorNative()) return;
  await PushNotifications.removeAllListeners();
}
