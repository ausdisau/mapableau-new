import {
  handleSensorsGet,
  handleSensorsPost,
} from "@/lib/accessops/http/internal-api";

export const dynamic = "force-dynamic";

export const GET = handleSensorsGet;
export const POST = handleSensorsPost;
