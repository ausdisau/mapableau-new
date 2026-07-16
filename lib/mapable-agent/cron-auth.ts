/** Cron bearer auth for MapAble Agent jobs (Vercel + admin). */

export function verifyMapableAgentCronBearer(request: Request): boolean {
  const secrets = [
    process.env.CRON_SECRET?.trim(),
    process.env.VERCEL_CRON_SECRET?.trim(),
    process.env.ADMIN_CRON_SECRET?.trim(),
  ].filter(Boolean) as string[];

  if (secrets.length === 0) return false;

  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;

  const token = auth.slice("Bearer ".length).trim();
  return token.length > 0 && secrets.some((s) => s === token);
}
