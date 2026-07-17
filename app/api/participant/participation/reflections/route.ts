import {
  handleReflectionsPatch,
  handleReflectionsPost,
} from "@/lib/participation/http/route-handlers";

export const dynamic = "force-dynamic";

export const POST = handleReflectionsPost;
export const PATCH = handleReflectionsPatch;
