import {
  handlePartnerWebhooksGet,
  handlePartnerWebhooksPost,
} from "@/lib/accessops/http/partner-api";

export const dynamic = "force-dynamic";

export const GET = handlePartnerWebhooksGet;
export const POST = handlePartnerWebhooksPost;
