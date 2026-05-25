import {
  createImportJob,
  parseImportJobContent,
} from "@/lib/access-import/access-import-job-service";
import { MAX_IMPORT_BYTES, MAX_IMPORT_ITEMS } from "@/lib/access-import/import-limits";
import {
  isAllowlistedNetworkLinkUrl,
  resolveKmlDocument,
} from "@/lib/access-import/kml-networklink-service";
import { escapeXmlText } from "@/lib/access-import/xml-escape";
import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";

function assertPayloadWithinLimit(payload: string) {
  const bytes = new TextEncoder().encode(payload).length;
  if (bytes > MAX_IMPORT_BYTES) {
    throw new Error("IMPORT_TOO_LARGE");
  }
}

function importItemLimitResponse(error: unknown) {
  const msg = error instanceof Error ? error.message : "";
  if (msg.startsWith("IMPORT_ITEM_LIMIT:")) {
    return jsonError(`Too many features (limit ${MAX_IMPORT_ITEMS})`, 413);
  }
  return null;
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    const importType = String(form.get("importType") ?? "kml");

    if (!(file instanceof File)) {
      return jsonError("file required", 400);
    }
    if (file.size > MAX_IMPORT_BYTES) {
      return jsonError("File too large", 400);
    }

    const text = await file.text();
    const isGeoJson =
      importType === "geojson" ||
      file.name.endsWith(".geojson") ||
      file.name.endsWith(".json");

    const job = await createImportJob({
      createdById: user.id,
      sourceType: isGeoJson ? "geojson_upload" : "uploaded_kml",
      fileName: file.name,
    });

    try {
      await parseImportJobContent(
        job.id,
        text,
        isGeoJson ? "geojson_upload" : "uploaded_kml"
      );
    } catch (e) {
      const limitResp = importItemLimitResponse(e);
      if (limitResp) return limitResp;
      throw e;
    }

    return jsonOk({ importId: job.id }, 201);
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_IMPORT_BYTES) {
    return jsonError("Request body too large", 413);
  }

  const body = await req.json();
  if (body.networkLinkUrl) {
    const networkLinkUrl = String(body.networkLinkUrl);
    if (!isAllowlistedNetworkLinkUrl(networkLinkUrl)) {
      return jsonError("NetworkLink URL is not on the allowlist", 403);
    }
    const href = escapeXmlText(networkLinkUrl);
    const doc = await resolveKmlDocument(
      `<?xml version="1.0"?><kml><Document><NetworkLink><Link><href>${href}</href></Link></NetworkLink></Document></kml>`
    );
    const job = await createImportJob({
      createdById: user.id,
      sourceType: "kml_network_link",
      sourceUrl: body.networkLinkUrl,
    });
    const xml =
      doc.placemarks.length > 0
        ? await (await import("@/lib/access-import/kml-networklink-service")).fetchAllowlistedKml(
            body.networkLinkUrl
          )
        : "";
    if (xml) {
      try {
        await parseImportJobContent(job.id, xml, "kml_network_link");
      } catch (e) {
        const limitResp = importItemLimitResponse(e);
        if (limitResp) return limitResp;
        throw e;
      }
    }
    return jsonOk({ importId: job.id, placemarkCount: doc.placemarks.length }, 201);
  }

  if (body.kml) {
    try {
      assertPayloadWithinLimit(String(body.kml));
    } catch {
      return jsonError("KML payload too large", 413);
    }
    const job = await createImportJob({
      createdById: user.id,
      sourceType: "uploaded_kml",
    });
    try {
      await parseImportJobContent(job.id, body.kml, "uploaded_kml");
    } catch (e) {
      const limitResp = importItemLimitResponse(e);
      if (limitResp) return limitResp;
      throw e;
    }
    return jsonOk({ importId: job.id }, 201);
  }

  if (body.geojson) {
    try {
      assertPayloadWithinLimit(String(body.geojson));
    } catch {
      return jsonError("GeoJSON payload too large", 413);
    }
    const job = await createImportJob({
      createdById: user.id,
      sourceType: "geojson_upload",
      fileName: "accessible_locations_merged.geojson",
    });
    try {
      await parseImportJobContent(job.id, body.geojson, "geojson_upload");
    } catch (e) {
      const limitResp = importItemLimitResponse(e);
      if (limitResp) return limitResp;
      throw e;
    }
    return jsonOk({ importId: job.id }, 201);
  }

  return jsonError("Provide file upload, kml, geojson, or networkLinkUrl", 400);
}
