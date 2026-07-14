
import type { ExpoConfig, ConfigContext } from "expo/config";

const APP_VERSION = "0.1.0";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "MapAble",
  slug: "mapable",
  version: APP_VERSION,
  orientation: "default",
  scheme: "mapable",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#005B7F",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "au.com.mapable.app",
    infoPlist: {
      NSFaceIDUsageDescription:
        "MapAble uses Face ID so you can reopen the app without typing your password.",
      NSLocationWhenInUseUsageDescription:
        "MapAble uses your location only while you track an active accessible trip you started.",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "Background location is optional and only used for an active live trip you explicitly enable.",
      NSMicrophoneUsageDescription:
        "MapAble uses the microphone only when you choose speech input. Unusual speech is never treated as reduced capacity.",
      NSCameraUsageDescription:
        "MapAble uses the camera when you choose to scan or attach a document.",
      NSPhotoLibraryUsageDescription:
        "MapAble accesses photos only when you choose to attach evidence or a document.",
    },
    associatedDomains: ["applinks:mapable.com.au", "applinks:www.mapable.com.au"],
  },
  android: {
    package: "au.com.mapable.app",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#005B7F",
    },
    permissions: [
      "USE_BIOMETRIC",
      "USE_FINGERPRINT",
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "POST_NOTIFICATIONS",
      "RECORD_AUDIO",
      "CAMERA",
      "READ_MEDIA_IMAGES",
    ],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          { scheme: "https", host: "mapable.com.au", pathPrefix: "/app" },
          { scheme: "https", host: "www.mapable.com.au", pathPrefix: "/app" },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-local-authentication",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#005B7F",
        image: "./assets/splash-icon.png",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: "replace-with-eas-project-id",
    },
    mapableApiBaseUrl:
      process.env.EXPO_PUBLIC_MAPABLE_API_BASE_URL ?? "https://mapable.com.au",
    oauthClientId: process.env.EXPO_PUBLIC_OAUTH_CLIENT_ID ?? "",
    oauthIssuer: process.env.EXPO_PUBLIC_OAUTH_ISSUER ?? "",
    appVersion: APP_VERSION,
  },
});
