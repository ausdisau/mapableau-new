import {
  handleAssetStatusGet,
  handleAssetStatusPost,
} from "@/lib/accessops/http/internal-api";

export const dynamic = "force-dynamic";

export const GET = handleAssetStatusGet;
export const POST = handleAssetStatusPost;
