import {
  handleIncidentsGet,
  handleIncidentsPost,
} from "@/lib/accessops/http/internal-api";

export const dynamic = "force-dynamic";

export const GET = handleIncidentsGet;
export const POST = handleIncidentsPost;
