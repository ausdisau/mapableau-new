import { handleAssetsGet, handleAssetsPost } from "@/lib/accessops/http/internal-api";

export const dynamic = "force-dynamic";

export const GET = handleAssetsGet;
export const POST = handleAssetsPost;
