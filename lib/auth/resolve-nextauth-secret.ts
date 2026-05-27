/**
 * NextAuth v4 reads NEXTAUTH_SECRET. Some hosts (e.g. Vercel Auth.js templates)
 * provision AUTH_SECRET instead — accept either to avoid a silent 500 on /api/auth/*.
 */
export function resolveNextAuthSecret(): string | undefined {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  return secret?.trim() || undefined;
}
