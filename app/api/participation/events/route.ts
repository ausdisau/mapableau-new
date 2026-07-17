import {
  handleEventsGet,
  handleEventsPost,
} from "@/lib/participation/http/route-handlers";

export const dynamic = "force-dynamic";

export const GET = handleEventsGet;
export const POST = handleEventsPost;
