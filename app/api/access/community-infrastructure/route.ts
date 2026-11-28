import { NextResponse } from "next/server";

import {
  getCommunityInfrastructure,
  parseCommunityQuery,
} from "@/lib/access/community-infrastructure/service";

export const runtime = "nodejs";

// This endpoint contains only the licensed public source snapshot, never session data.
const PUBLIC_LAYER_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Accept",
  "Access-Control-Expose-Headers": "Link",
  "X-Content-Type-Options": "nosniff",
};

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...PUBLIC_LAYER_HEADERS,
      "Access-Control-Max-Age": "86400",
    },
  });
}

export function GET(request: Request) {
  let query;
  try {
    if (request.url.length > 2048) throw new Error("Query too long");
    query = parseCommunityQuery(new URL(request.url).searchParams);
  } catch {
    return NextResponse.json(
      {
        error: "Invalid query. Choose a supported area and bounded filters.",
        code: "INVALID_QUERY",
      },
      {
        status: 400,
        headers: { ...PUBLIC_LAYER_HEADERS, "Cache-Control": "no-store" },
      },
    );
  }
  const collection = getCommunityInfrastructure(query);
  return NextResponse.json(collection, {
    headers: {
      ...PUBLIC_LAYER_HEADERS,
      "Content-Type": "application/geo+json; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
      Link: '<https://opendatacommons.org/licenses/odbl/1-0/>; rel="license"',
    },
  });
}
