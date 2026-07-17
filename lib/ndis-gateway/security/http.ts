export function ndisNoStoreHeaders(): HeadersInit {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
  };
}

export function jsonNdisOk<T>(data: T, status = 200) {
  return Response.json(data, { status, headers: ndisNoStoreHeaders() });
}

export function jsonNdisError(message: string, status = 400) {
  return Response.json(
    { error: message },
    { status, headers: ndisNoStoreHeaders() }
  );
}
