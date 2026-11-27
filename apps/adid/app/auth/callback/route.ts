// Begin a fresh Clerk transaction for visitors returning from an old Auth0 callback.
export function GET(request: Request) {
  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL("/sign-in", request.url).href,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
