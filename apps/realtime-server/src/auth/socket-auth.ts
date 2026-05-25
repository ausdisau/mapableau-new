import jwt from "jsonwebtoken";

export interface SocketAuthPayload {
  profileId: string;
  primaryRole: string;
  permissions: string[];
}

export function verifySocketToken(token: string | undefined): SocketAuthPayload | null {
  if (!token) return null;
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const decoded = jwt.verify(token, secret) as {
      sub?: string;
      profileId?: string;
      primaryRole?: string;
      permissions?: string[];
    };
    const profileId = decoded.profileId ?? decoded.sub;
    if (!profileId) return null;
    return {
      profileId,
      primaryRole: decoded.primaryRole ?? "participant",
      permissions: decoded.permissions ?? [],
    };
  } catch {
    return null;
  }
}
