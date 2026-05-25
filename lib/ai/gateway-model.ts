import { gateway } from "ai";

/**
 * Resolves the model for AI Gateway calls.
 * Requires AI_GATEWAY_API_KEY (or Vercel OIDC on deployed environments).
 */
export function getGatewayModel(modelId = "openai/gpt-4.1-mini") {
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    throw new Error(
      "AI Gateway is not configured. Set AI_GATEWAY_API_KEY in .env (see .env.example)."
    );
  }
  return gateway(modelId);
}
