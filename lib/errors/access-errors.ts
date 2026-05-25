export class AccessDeniedError extends Error {
  readonly code = "ACCESS_DENIED";

  constructor(message = "Access denied") {
    super(message);
    this.name = "AccessDeniedError";
  }
}

export class UnauthenticatedError extends Error {
  readonly code = "UNAUTHENTICATED";

  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

export function safeAccessDeniedResponse() {
  return Response.json(
    { error: "You do not have access to this resource." },
    { status: 403 }
  );
}

export function safeNotFoundResponse() {
  return Response.json({ error: "Resource not found." }, { status: 404 });
}
