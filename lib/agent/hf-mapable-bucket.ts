import { spawn } from "node:child_process";

export type HfBucketObject = {
  key: string;
  size: number;
  lastModified?: string;
};

const DEFAULT_PROFILE = "hf";
const DEFAULT_ENDPOINT = "https://s3.hf.co/ausdisau";
const DEFAULT_BUCKET = "MapAble-hg";
const MAX_TEXT_BYTES = 256 * 1024;
const ALLOWED_TEXT_EXTENSIONS = new Set([".txt", ".md", ".json", ".csv", ".tsv"]);

function config() {
  return {
    profile: process.env.HF_S3_PROFILE?.trim() || DEFAULT_PROFILE,
    endpoint: process.env.HF_S3_ENDPOINT?.trim() || DEFAULT_ENDPOINT,
    bucket: process.env.HF_S3_BUCKET?.trim() || DEFAULT_BUCKET,
  };
}

export function validateHfObjectKey(key: string): string {
  const value = key.trim();
  if (!value) throw new Error("HF bucket object key is required");
  if (
    value.startsWith("/") ||
    value.endsWith("/") ||
    value.includes("//") ||
    value.includes("../") ||
    value.startsWith("./") ||
    value.endsWith("..") ||
    value.includes("\\") ||
    value.includes("\0")
  ) {
    throw new Error("Unsafe HF bucket object key");
  }
  return value;
}

function validatePrefix(prefix: string): string {
  const value = prefix.trim();
  if (!value) return "";
  if (
    value.startsWith("/") ||
    value.includes("//") ||
    value.includes("../") ||
    value.startsWith("./") ||
    value.includes("\\") ||
    value.includes("\0")
  ) {
    throw new Error("Unsafe HF bucket prefix");
  }
  return value;
}

function extensionOf(key: string): string {
  const idx = key.lastIndexOf(".");
  return idx === -1 ? "" : key.slice(idx).toLowerCase();
}

export function isSupportedAgentTextKey(key: string): boolean {
  return ALLOWED_TEXT_EXTENSIONS.has(extensionOf(key));
}

function runAws(
  args: string[],
  options: { input?: Buffer; maxOutputBytes?: number } = {},
): Promise<Buffer> {
  const { profile, endpoint } = config();
  const maxOutputBytes = options.maxOutputBytes ?? 1024 * 1024;

  return new Promise((resolve, reject) => {
    const child = spawn(
      "aws",
      ["--profile", profile, "--endpoint-url", endpoint, ...args],
      {
        shell: false,
        stdio: ["pipe", "pipe", "pipe"],
        env: process.env,
      },
    );

    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let exceeded = false;

    child.stdout.on("data", (chunk: Buffer) => {
      stdoutBytes += chunk.length;
      if (stdoutBytes > maxOutputBytes) {
        exceeded = true;
        child.kill("SIGTERM");
        return;
      }
      stdout.push(chunk);
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderrBytes += chunk.length;
      if (stderrBytes <= 64 * 1024) stderr.push(chunk);
    });

    child.on("error", (error) => {
      reject(
        new Error(
          `Unable to run AWS CLI. Confirm it is installed and the ${profile} profile is configured: ${error.message}`,
        ),
      );
    });

    child.on("close", (code) => {
      if (exceeded) {
        reject(new Error("HF bucket command exceeded the allowed output size"));
        return;
      }
      if (code !== 0) {
        const detail = Buffer.concat(stderr).toString("utf8").trim();
        reject(new Error(detail || `AWS CLI exited with code ${code}`));
        return;
      }
      resolve(Buffer.concat(stdout));
    });

    if (options.input) child.stdin.end(options.input);
    else child.stdin.end();
  });
}

export async function listMapAbleBucket(params: {
  prefix?: string;
  limit?: number;
}): Promise<HfBucketObject[]> {
  const { bucket } = config();
  const prefix = validatePrefix(params.prefix ?? "");
  const limit = Math.max(1, Math.min(params.limit ?? 50, 100));

  const raw = await runAws(
    [
      "s3api",
      "list-objects-v2",
      "--bucket",
      bucket,
      "--prefix",
      prefix,
      "--max-keys",
      String(limit),
      "--output",
      "json",
    ],
    { maxOutputBytes: 512 * 1024 },
  );

  const parsed = JSON.parse(raw.toString("utf8")) as {
    Contents?: Array<{ Key?: string; Size?: number; LastModified?: string }>;
  };

  return (parsed.Contents ?? [])
    .filter((item): item is { Key: string; Size?: number; LastModified?: string } =>
      Boolean(item.Key),
    )
    .map((item) => ({
      key: item.Key,
      size: item.Size ?? 0,
      lastModified: item.LastModified,
    }));
}

export async function readMapAbleTextObject(key: string): Promise<{
  key: string;
  size: number;
  contentType?: string;
  text: string;
}> {
  const { bucket } = config();
  const safeKey = validateHfObjectKey(key);

  if (!isSupportedAgentTextKey(safeKey)) {
    throw new Error(
      "Agent reads are limited to .txt, .md, .json, .csv and .tsv objects",
    );
  }

  const headRaw = await runAws(
    ["s3api", "head-object", "--bucket", bucket, "--key", safeKey, "--output", "json"],
    { maxOutputBytes: 64 * 1024 },
  );
  const head = JSON.parse(headRaw.toString("utf8")) as {
    ContentLength?: number;
    ContentType?: string;
  };

  const size = head.ContentLength ?? 0;
  if (size > MAX_TEXT_BYTES) {
    throw new Error(
      `Object is too large for agent ingestion (${size} bytes; max ${MAX_TEXT_BYTES})`,
    );
  }

  const body = await runAws(
    ["s3", "cp", `s3://${bucket}/${safeKey}`, "-", "--only-show-errors"],
    { maxOutputBytes: MAX_TEXT_BYTES + 1024 },
  );

  return {
    key: safeKey,
    size,
    contentType: head.ContentType,
    text: body.toString("utf8"),
  };
}

export function buildAgentArtifactKey(params: {
  extension: "txt" | "json" | "mp3";
  label?: string;
  now?: Date;
}): string {
  const now = params.now ?? new Date();
  const date = now.toISOString().slice(0, 10);
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  const label = (params.label ?? "mapable-agent")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "mapable-agent";

  return `agent-output/${date}/${stamp}-${label}.${params.extension}`;
}

export async function writeMapAbleAgentArtifact(params: {
  body: Buffer | string;
  contentType: string;
  extension: "txt" | "json" | "mp3";
  label?: string;
}): Promise<{ key: string; size: number }> {
  if (process.env.HF_S3_AGENT_WRITES_ENABLED !== "true") {
    throw new Error(
      "HF bucket agent writes are disabled. Set HF_S3_AGENT_WRITES_ENABLED=true only in a controlled environment.",
    );
  }

  const { bucket } = config();
  const key = buildAgentArtifactKey({
    extension: params.extension,
    label: params.label,
  });
  const body = Buffer.isBuffer(params.body)
    ? params.body
    : Buffer.from(params.body, "utf8");

  await runAws(
    [
      "s3",
      "cp",
      "-",
      `s3://${bucket}/${key}`,
      "--content-type",
      params.contentType,
      "--only-show-errors",
    ],
    { input: body, maxOutputBytes: 64 * 1024 },
  );

  return { key, size: body.byteLength };
}
