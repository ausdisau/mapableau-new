import type { App } from "firebase-admin/app";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

let firebaseApp: App | undefined;
let messagingClient: Messaging | undefined;

function getFirebaseCredentials() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return { projectId, clientEmail, privateKey };
}

export function isFcmConfigured(): boolean {
  return getFirebaseCredentials() !== null;
}

function getMessagingClient(): Messaging | null {
  if (messagingClient) return messagingClient;

  const credentials = getFirebaseCredentials();
  if (!credentials) return null;

  if (!getApps().length) {
    firebaseApp = initializeApp({
      credential: cert(credentials),
      projectId: credentials.projectId,
    });
  }

  messagingClient = getMessaging(firebaseApp);
  return messagingClient;
}

export async function sendPushToTokens(
  tokens: string[],
  notification: { title: string; body: string },
  data?: Record<string, string>,
): Promise<void> {
  if (!tokens.length) return;

  const messaging = getMessagingClient();
  if (!messaging) return;

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification,
    data,
    android: {
      priority: "high",
      notification: {
        channelId: "mapable_default",
      },
    },
  });

  if (response.failureCount > 0) {
    console.warn(
      `[fcm] ${response.failureCount}/${tokens.length} push deliveries failed`,
    );
  }
}
