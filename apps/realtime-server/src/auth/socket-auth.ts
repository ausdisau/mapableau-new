export function verifySocketToken(token: string): boolean {
  return Boolean(token && token.length > 10);
}
