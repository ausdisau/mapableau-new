import { handleAssetGet, handleAssetPatch } from "@/lib/accessops/http/internal-api";

export const dynamic = "force-dynamic";

export const GET = handleAssetGet;
export const PATCH = handleAssetPatch;
