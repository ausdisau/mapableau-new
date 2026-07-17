import { createHash } from "node:crypto";

import type { UntrustedWrapped } from "@/lib/aura/security/prompt-injection";
import type { AiPromptRole } from "@prisma/client";

export interface PromptSegment {
  role: AiPromptRole;
  text: string;
}

export interface BundledPrompt {
  segments: PromptSegment[];
  untrustedSegments: UntrustedWrapped[];
  bodyHash: string;
}

export function bundlePrompt(
  segments: PromptSegment[],
  untrusted: UntrustedWrapped[]
): BundledPrompt {
  const canonical = JSON.stringify({
    segments: segments.map((s) => ({ role: s.role, text: s.text })),
    untrusted: untrusted.map((u) => ({ boundary: u.boundary, text: u.text })),
  });
  return {
    segments,
    untrustedSegments: untrusted,
    bodyHash: createHash("sha256").update(canonical).digest("hex"),
  };
}
