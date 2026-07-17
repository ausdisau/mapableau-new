import {
  handleParticipantPlansGet,
  handleParticipantPlansPost,
} from "@/lib/participation/http/route-handlers";

export const dynamic = "force-dynamic";

export const GET = handleParticipantPlansGet;
export const POST = handleParticipantPlansPost;
