import { NextResponse } from "next/server";

import { getStorageBackend } from "@/lib/storage/document-storage-service";
import { phase2Config } from "@/lib/config/phase2";

export async function GET() {
  const backend = getStorageBackend();
  return NextResponse.json({
    service: "storage",
    status: "healthy",
    backend,
    mode: phase2Config.documentStorageMode,
    maxUploadMb: phase2Config.documentMaxUploadMb,
    timestamp: new Date().toISOString(),
  });
}
