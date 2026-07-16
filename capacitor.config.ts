import type { CapacitorConfig } from "@capacitor/cli";

/**
 * MapAble Android shell loads the live Vercel deployment.
 * Static export is not viable: the app uses 400+ API routes, NextAuth middleware,
 * and server-side Prisma access.
 *
 * Override CAPACITOR_SERVER_URL for local dev (e.g. http://10.0.2.2:3000 on the emulator).
 */
const productionUrl = "https://www.mapable.com.au";

const config: CapacitorConfig = {
  appId: "au.com.mapable.app",
  appName: "MapAble",
  webDir: "capacitor-www",
  server: {
    url: process.env.CAPACITOR_SERVER_URL ?? productionUrl,
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
