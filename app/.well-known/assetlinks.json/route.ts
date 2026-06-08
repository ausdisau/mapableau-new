import { NextResponse } from "next/server";

const PACKAGE_NAME = "au.com.mapable.app";

function parseFingerprints(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export async function GET() {
  const fingerprints = parseFingerprints(
    process.env.ANDROID_RELEASE_SHA256_FINGERPRINTS,
  );

  if (!fingerprints.length) {
    return NextResponse.json(
      {
        error:
          "Set ANDROID_RELEASE_SHA256_FINGERPRINTS in production to enable App Links verification.",
      },
      { status: 503 },
    );
  }

  const payload = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: PACKAGE_NAME,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ];

  return NextResponse.json(payload, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
