import type { ConnectorRetryPolicy } from "./types";

export type RetryFailureClass = "timeout" | "transient" | "rate_limit" | "fatal";

export type RetryDecision = {
  shouldRetry: boolean;
  nextDelayMs: number;
  attempt: number;
  reason: string;
};

export function decideRetry(input: {
  policy: ConnectorRetryPolicy;
  attempt: number;
  failureClass: RetryFailureClass;
}): RetryDecision {
  const { policy, attempt, failureClass } = input;

  if (attempt >= policy.maxAttempts) {
    return {
      shouldRetry: false,
      nextDelayMs: 0,
      attempt,
      reason: "max_attempts_exhausted",
    };
  }

  if (failureClass === "fatal") {
    return {
      shouldRetry: false,
      nextDelayMs: 0,
      attempt,
      reason: "fatal_not_retryable",
    };
  }

  if (!policy.retryOn.includes(failureClass)) {
    return {
      shouldRetry: false,
      nextDelayMs: 0,
      attempt,
      reason: "failure_class_not_retryable",
    };
  }

  const exponential =
    policy.baseDelayMs * Math.pow(2, Math.max(0, attempt - 1));
  const nextDelayMs = Math.min(exponential, policy.maxDelayMs);

  return {
    shouldRetry: true,
    nextDelayMs,
    attempt,
    reason: "bounded_retry",
  };
}

export async function sleep(ms: number): Promise<void> {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withBoundedRetry<T>(input: {
  policy: ConnectorRetryPolicy;
  timeoutMs: number;
  operation: (attempt: number) => Promise<T>;
  classifyError?: (err: unknown) => RetryFailureClass;
}): Promise<{ result: T; attemptCount: number }> {
  const classify = input.classifyError ?? defaultClassifyError;
  let attempt = 0;
  let lastError: unknown;

  while (attempt < input.policy.maxAttempts) {
    attempt += 1;
    try {
      const result = await withTimeout(
        input.operation(attempt),
        input.timeoutMs,
      );
      return { result, attemptCount: attempt };
    } catch (err) {
      lastError = err;
      const failureClass = classify(err);
      const decision = decideRetry({
        policy: input.policy,
        attempt,
        failureClass,
      });
      if (!decision.shouldRetry) break;
      await sleep(decision.nextDelayMs);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(String(lastError ?? "retry_exhausted"));
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        Object.assign(new Error("timeout"), {
          failureClass: "timeout" as const,
        }),
      );
    }, timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function defaultClassifyError(err: unknown): RetryFailureClass {
  if (err && typeof err === "object" && "failureClass" in err) {
    const fc = (err as { failureClass?: string }).failureClass;
    if (
      fc === "timeout" ||
      fc === "transient" ||
      fc === "rate_limit" ||
      fc === "fatal"
    ) {
      return fc;
    }
  }
  if (err instanceof Error && /timeout/i.test(err.message)) return "timeout";
  if (err instanceof Error && /rate.?limit/i.test(err.message)) {
    return "rate_limit";
  }
  if (
    err instanceof Error &&
    /transient|ECONNRESET|503|429/i.test(err.message)
  ) {
    return "transient";
  }
  return "fatal";
}
