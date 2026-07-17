import {
  handleParticipantGoalsGet,
  handleParticipantGoalsPost,
} from "@/lib/participation/http/route-handlers";

export const dynamic = "force-dynamic";

export const GET = handleParticipantGoalsGet;
export const POST = handleParticipantGoalsPost;
