/**
 * Native capability helpers — permission prompts must explain purpose,
 * optionality, retention and how to continue without access.
 */
export type PermissionPurpose = {
  what: string;
  why: string;
  optional: boolean;
  duration: string;
  continueWithout: string;
  howToRevoke: string;
};

export const PERMISSION_COPY = {
  camera: {
    what: "Camera access",
    why: "Only when you choose to scan or attach a document.",
    optional: true,
    duration: "While you are attaching a document",
    continueWithout: "You can upload a file later or ask for human help.",
    howToRevoke: "Revoke in system Settings → MapAble.",
  },
  locationWhenInUse: {
    what: "Location while using the app",
    why: "Only while you track an active accessible trip you started.",
    optional: true,
    duration: "During an active trip",
    continueWithout: "You can still view itinerary steps without live location.",
    howToRevoke: "Revoke in system Settings → MapAble → Location.",
  },
  backgroundLocation: {
    what: "Background location",
    why: "Only for an explicit live trip you enable.",
    optional: true,
    duration: "While a live trip is active",
    continueWithout: "Keep background location off and use foreground updates.",
    howToRevoke: "Revoke in system Settings → MapAble → Location.",
  },
  microphone: {
    what: "Microphone",
    why: "Only when you choose speech input. Unusual speech is never treated as reduced capacity.",
    optional: true,
    duration: "While speech input is active",
    continueWithout: "Type, use AAC prompts, or ask for human help.",
    howToRevoke: "Revoke in system Settings → MapAble → Microphone.",
  },
  notifications: {
    what: "Notifications",
    why: "Mission and message alerts with privacy-safe lock-screen previews.",
    optional: true,
    duration: "Until you turn them off",
    continueWithout: "You can check Messages and Today in the app.",
    howToRevoke: "Revoke in system Settings → Notifications → MapAble.",
  },
} as const satisfies Record<string, PermissionPurpose>;
