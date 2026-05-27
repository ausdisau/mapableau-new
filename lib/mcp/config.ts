import { MOCK_PARTICIPANT_ID } from "@/lib/prms/mockPrmsData";

export function getMapablePublicUrl(): string {
  const base =
    process.env.MAPABLE_PUBLIC_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  return base;
}

export function getDemoParticipantId(): string {
  return process.env.MAPABLE_MCP_DEMO_PARTICIPANT_ID?.trim() || MOCK_PARTICIPANT_ID;
}

export function getChatgptMcpPort(): number {
  const raw = process.env.CHATGPT_MCP_PORT ?? "8787";
  const port = Number.parseInt(raw, 10);
  return Number.isFinite(port) ? port : 8787;
}

export function isLocalMcpBind(): boolean {
  const bind = getChatgptMcpBindHost();
  return bind === "127.0.0.1" || bind === "localhost" || bind === "::1";
}

export function getChatgptMcpBindHost(): string {
  return (
    process.env.CHATGPT_MCP_BIND_HOST?.trim() ||
    process.env.CHATGPT_MCP_BIND?.trim() ||
    "127.0.0.1"
  );
}

export function getChatgptMcpAllowedHosts(): string[] | undefined {
  const raw = process.env.CHATGPT_MCP_ALLOWED_HOSTS?.trim();
  if (!raw) return undefined;
  return raw.split(",").map((h) => h.trim()).filter(Boolean);
}

export function requireChatgptMcpBearerToken(): string | null {
  const token = process.env.CHATGPT_MCP_BEARER_TOKEN?.trim();
  if (token) return token;
  if (isLocalMcpBind()) return null;
  throw new Error(
    "CHATGPT_MCP_BEARER_TOKEN is required when binding to a non-localhost interface.",
  );
}
