import { describe, expect, it } from "vitest";

import {
  canTransitionExecution,
  canTransitionStep,
  isTerminalExecution,
  isTerminalStep,
} from "@/lib/aura/execution/state-machine";

describe("execution state machine", () => {
  it("queued -> running is allowed", () => {
    expect(canTransitionExecution("queued", "running")).toBe(true);
  });

  it("running -> execution_unknown is allowed", () => {
    expect(canTransitionExecution("running", "execution_unknown")).toBe(true);
  });

  it("execution_unknown -> completed is NOT allowed", () => {
    expect(canTransitionExecution("execution_unknown", "completed")).toBe(false);
  });

  it("execution_unknown -> compensated is allowed", () => {
    expect(canTransitionExecution("execution_unknown", "compensated")).toBe(true);
  });

  it("failed -> completed is NOT allowed", () => {
    expect(canTransitionExecution("failed", "completed")).toBe(false);
  });

  it("completed is terminal, cancelled is terminal", () => {
    expect(isTerminalExecution("completed")).toBe(true);
    expect(isTerminalExecution("cancelled")).toBe(true);
    expect(isTerminalExecution("running")).toBe(false);
  });

  it("step running -> succeeded is allowed", () => {
    expect(canTransitionStep("running", "succeeded")).toBe(true);
  });

  it("step running -> execution_unknown allowed", () => {
    expect(canTransitionStep("running", "execution_unknown")).toBe(true);
  });

  it("step succeeded is terminal", () => {
    expect(isTerminalStep("succeeded")).toBe(true);
    expect(isTerminalStep("pending")).toBe(false);
  });
});
