import {
  handleWorkOrdersGet,
  handleWorkOrdersPost,
} from "@/lib/accessops/http/internal-api";

export const dynamic = "force-dynamic";

export const GET = handleWorkOrdersGet;
export const POST = handleWorkOrdersPost;
