import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { mintSocketAuthTokenForUser } from "@/lib/realtime/mint-socket-token";

/**
 * Mint a short-lived Socket.IO auth token for the current session.
 * Phase 0: auth plumbing only — no transport event publish.
 * Clients may only self-grant `user:{ownId}`; trip/provider grants come from
 * server-side assignment flows in later phases.
 */
export async function POST() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const minted = mintSocketAuthTokenForUser({
      userId: user.id,
      role: user.primaryRole ?? user.roles[0] ?? "unknown",
      roomGrants: [`user:${user.id}`],
    });
    return jsonOk(minted);
  } catch (err) {
    const message = err instanceof Error ? err.message : "mint_failed";
    if (message === "SOCKETIO_AUTH_SECRET_MISSING") {
      return jsonError("Socket auth is not configured", 503);
    }
    return jsonError("Unable to mint socket token", 500);
  }
}
