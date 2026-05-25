import {
  createImportJob,
  parseImportJobContent,
} from "@/lib/access-import/access-import-service";
import { resolveKmlDocument } from "@/lib/access-import/kml-networklink-service";
import { parseKmlXml } from "@/lib/access-import/kml-parser-service";
import { parseAccessibleLocationsGeoJson } from "@/lib/access-import/geojson-parser-service";
import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";

const MAX_BYTES = 5_000_000;

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
    if (file.size > MAX_BYTES) {
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

    await parseImportJobContent(
      job.id,
      text,
      isGeoJson ? "geojson_upload" : "uploaded_kml"
    );

    return jsonOk({ importId: job.id }, 201);
  }

  const body = await req.json();
  if (body.networkLinkUrl) {
    const doc = await resolveKmlDocument(
      `<?xml version="1.0"?><kml><Document><NetworkLink><Link><href>${body.networkLinkUrl}</href></Link></NetworkLink></Document></kml>`
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
    if (xml) await parseImportJobContent(job.id, xml, "kml_network_link");
    return jsonOk({ importId: job.id, placemarkCount: doc.placemarks.length }, 201);
  }

  if (body.kml) {
    const job = await createImportJob({
      createdById: user.id,
      sourceType: "uploaded_kml",
    });
    await parseImportJobContent(job.id, body.kml, "uploaded_kml");
    return jsonOk({ importId: job.id }, 201);
  }

  if (body.geojson) {
    const job = await createImportJob({
      createdById: user.id,
      sourceType: "geojson_upload",
      fileName: "accessible_locations_merged.geojson",
    });
    await parseImportJobContent(job.id, body.geojson, "geojson_upload");
    return jsonOk({ importId: job.id }, 201);
  }

  return jsonError("Provide file upload, kml, geojson, or networkLinkUrl", 400);
}
