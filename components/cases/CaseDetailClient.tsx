"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { AINextAction, AIRiskAssessment } from "@/lib/cases/ai/types";

type LinkRow = {
  id: string;
  linkType: string;
  label: string;
  targetId: string | null;
  url: string | null;
  notes: string | null;
  createdAt: string;
};

type Insight = {
  id: string;
  kind: string;
  summary: string;
  confidence: number;
  requiresReview: boolean;
  createdAt: string;
  acknowledgedAt: string | null;
  engine: string;
  detailJson: unknown;
};

type Task = {
  id: string;
  title: string;
  details: string | null;
  status: string;
  priority: string;
  dueAt: string | null;
  completedAt: string | null;
  aiSuggested: boolean;
};

type Note = {
  id: string;
  body: string;
  createdAt: string;
  pinned: boolean;
};

export interface CaseDetailClientProps {
  caseId: string;
  caseMeta: {
    status: string;
    priority: string;
    riskLevel: string;
    assignedToId: string | null;
    dueAt: string | null;
    aiOptOut: boolean;
  };
  links: LinkRow[];
  notes: Note[];
  tasks: Task[];
  insights: Insight[];
  canManage: boolean;
  canRunAI: boolean;
  aiEnabled: boolean;
}

const STATUSES = ["open", "monitoring", "on_hold", "closed"] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
const RISK_LEVELS = ["low", "moderate", "elevated", "high", "critical"] as const;
const LINK_TYPES = [
  "booking",
  "incident",
  "support_ticket",
  "document",
  "funding_source",
  "service_agreement",
  "external",
  "note",
] as const;

export function CaseDetailClient(props: CaseDetailClientProps) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);
  const router = useRouter();

  async function callJson(path: string, body: unknown, method = "POST") {
    setError(null);
    setBusy(path);
    try {
      const res = await fetch(path, {
        method,
        headers: { "content-type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          typeof data.error === "string"
            ? data.error
            : `Request failed with status ${res.status}`,
        );
        return null;
      }
      return (await res.json()) as unknown;
    } finally {
      setBusy(null);
    }
  }

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function onAddNote(form: FormData) {
    const body = String(form.get("body") ?? "").trim();
    if (body.length === 0) return;
    const res = await callJson(`/api/cases/${props.caseId}/notes`, { body });
    if (res) refresh();
  }

  async function onAddTask(form: FormData) {
    const title = String(form.get("title") ?? "").trim();
    if (title.length < 2) return;
    const priority = String(form.get("priority") ?? "medium");
    const res = await callJson(`/api/cases/${props.caseId}/tasks`, {
      title,
      priority,
    });
    if (res) refresh();
  }

  async function onAddLink(form: FormData) {
    const linkType = String(form.get("linkType") ?? "external");
    const label = String(form.get("label") ?? "").trim();
    const targetId = String(form.get("targetId") ?? "").trim();
    const url = String(form.get("url") ?? "").trim();
    if (label.length < 2) return;
    const res = await callJson(`/api/cases/${props.caseId}/links`, {
      linkType,
      label,
      targetId: targetId || null,
      url: url || null,
    });
    if (res) refresh();
  }

  async function onUpdateCase(form: FormData) {
    const status = String(form.get("status") ?? props.caseMeta.status);
    const priority = String(form.get("priority") ?? props.caseMeta.priority);
    const riskLevel = String(form.get("riskLevel") ?? props.caseMeta.riskLevel);
    const assignedToId = String(form.get("assignedToId") ?? "").trim();
    const dueAtRaw = String(form.get("dueAt") ?? "").trim();
    const res = await callJson(
      `/api/cases/${props.caseId}`,
      {
        status,
        priority,
        riskLevel,
        assignedToId: assignedToId || null,
        dueAt: dueAtRaw ? new Date(dueAtRaw).toISOString() : null,
      },
      "PATCH",
    );
    if (res) {
      setShowEdit(false);
      refresh();
    }
  }

  async function closeCase() {
    if (!window.confirm("Close this case? You can reopen it later by editing status.")) {
      return;
    }
    const res = await callJson(
      `/api/cases/${props.caseId}`,
      { status: "closed" },
      "PATCH",
    );
    if (res) refresh();
  }

  async function toggleAiOptOut(enabled: boolean) {
    const res = await callJson(
      `/api/cases/${props.caseId}`,
      { aiOptOut: !enabled },
      "PATCH",
    );
    if (res) refresh();
  }

  async function runAI(kind: "summary" | "risk_assessment" | "next_action") {
    const res = await callJson(`/api/cases/${props.caseId}/ai`, { kind });
    if (res) refresh();
  }

  async function acknowledgeInsight(insightId: string) {
    const res = await callJson(
      `/api/cases/${props.caseId}/ai/${insightId}`,
      null,
    );
    if (res) refresh();
  }

  async function applyRiskFromInsight(insight: Insight) {
    const detail = insight.detailJson as AIRiskAssessment | null;
    if (!detail?.level) return;
    const res = await callJson(
      `/api/cases/${props.caseId}`,
      { riskLevel: detail.level },
      "PATCH",
    );
    if (res) {
      await acknowledgeInsight(insight.id);
    }
  }

  async function addTaskFromSuggestion(action: AINextAction) {
    const dueAt =
      action.dueInDays != null
        ? new Date(Date.now() + action.dueInDays * 86400000).toISOString()
        : undefined;
    const res = await callJson(`/api/cases/${props.caseId}/tasks`, {
      title: action.title,
      details: action.reason,
      priority: action.priority,
      dueAt,
      aiSuggested: true,
    });
    if (res) refresh();
  }

  async function setTaskStatus(taskId: string, status: string) {
    const res = await callJson(
      `/api/cases/${props.caseId}/tasks/${taskId}`,
      { status },
      "PATCH",
    );
    if (res) refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <section className="space-y-6 lg:col-span-2">
        {props.canManage ? (
          <Panel title="Case management">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowEdit((v) => !v)}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                {showEdit ? "Hide edit" : "Edit case"}
              </button>
              {props.caseMeta.status !== "closed" ? (
                <button
                  type="button"
                  onClick={() => void closeCase()}
                  disabled={busy === `/api/cases/${props.caseId}`}
                  className="rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-60"
                >
                  Close case
                </button>
              ) : null}
            </div>
            {showEdit ? (
              <form
                className="mt-3 grid gap-3 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void onUpdateCase(new FormData(e.currentTarget));
                }}
              >
                <label className="text-sm">
                  Status
                  <select
                    name="status"
                    defaultValue={props.caseMeta.status}
                    className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  Priority
                  <select
                    name="priority"
                    defaultValue={props.caseMeta.priority}
                    className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  Risk level
                  <select
                    name="riskLevel"
                    defaultValue={props.caseMeta.riskLevel}
                    className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  >
                    {RISK_LEVELS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  Assignee user ID
                  <input
                    name="assignedToId"
                    defaultValue={props.caseMeta.assignedToId ?? ""}
                    placeholder="Coordinator user ID"
                    className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="text-sm sm:col-span-2">
                  Due date
                  <input
                    name="dueAt"
                    type="date"
                    defaultValue={
                      props.caseMeta.dueAt
                        ? props.caseMeta.dueAt.slice(0, 10)
                        : ""
                    }
                    className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy === `/api/cases/${props.caseId}`}
                  className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  Save changes
                </button>
              </form>
            ) : null}
          </Panel>
        ) : null}

        <Panel title="Linked records">
          {props.links.length === 0 ? (
            <p className="text-sm text-muted-foreground">No links yet.</p>
          ) : (
            <ul className="space-y-2">
              {props.links.map((link) => (
                <li
                  key={link.id}
                  className="rounded-md border border-border p-3 text-sm"
                >
                  <p className="font-medium">{link.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {link.linkType.replaceAll("_", " ")}
                    {link.targetId ? ` · ID ${link.targetId}` : ""}
                    {link.url ? (
                      <>
                        {" · "}
                        <a
                          href={link.url}
                          className="text-primary hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open link
                        </a>
                      </>
                    ) : null}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {props.canManage ? (
            <form
              className="mt-3 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                void onAddLink(new FormData(e.currentTarget));
                e.currentTarget.reset();
              }}
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  name="linkType"
                  defaultValue="external"
                  className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                >
                  {LINK_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
                <input
                  name="label"
                  placeholder="Link label"
                  minLength={2}
                  className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                />
                <input
                  name="targetId"
                  placeholder="Entity ID (optional)"
                  className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                />
                <input
                  name="url"
                  type="url"
                  placeholder="External URL (optional)"
                  className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={busy?.includes("links")}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                Add link
              </button>
            </form>
          ) : null}
        </Panel>

        <Panel title="Notes">
          {props.notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            <ul className="space-y-3">
              {props.notes.map((n) => (
                <li
                  key={n.id}
                  className={`rounded-md border border-border p-3 ${n.pinned ? "bg-amber-50/40" : ""}`}
                >
                  <p className="whitespace-pre-wrap text-sm">{n.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {format(new Date(n.createdAt), "d MMM yyyy, HH:mm")}
                    {n.pinned ? " · pinned" : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {props.canManage ? (
            <form
              action={onAddNote}
              className="mt-3 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                onAddNote(new FormData(e.currentTarget));
                e.currentTarget.reset();
              }}
            >
              <textarea
                name="body"
                rows={3}
                placeholder="Add a note…"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="submit"
                disabled={busy?.includes("notes")}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                Add note
              </button>
            </form>
          ) : null}
        </Panel>

        <Panel title="Tasks">
          {props.tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks yet.</p>
          ) : (
            <ul className="space-y-2">
              {props.tasks.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {t.title}
                      {t.aiSuggested ? (
                        <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-900">
                          AI-suggested
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.priority} priority · status: {t.status}
                      {t.dueAt
                        ? ` · due ${format(new Date(t.dueAt), "d MMM")}`
                        : ""}
                    </p>
                  </div>
                  {props.canManage ? (
                    <select
                      defaultValue={t.status}
                      onChange={(e) => setTaskStatus(t.id, e.target.value)}
                      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                    >
                      {[
                        "pending",
                        "in_progress",
                        "blocked",
                        "done",
                        "cancelled",
                      ].map((s) => (
                        <option key={s} value={s}>
                          {s.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {props.canManage ? (
            <form
              className="mt-3 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                onAddTask(new FormData(e.currentTarget));
                e.currentTarget.reset();
              }}
            >
              <input
                name="title"
                placeholder="Task title"
                minLength={2}
                maxLength={200}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <div className="flex items-center gap-2">
                <select
                  name="priority"
                  defaultValue="medium"
                  className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={busy?.includes("tasks")}
                  className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  Add task
                </button>
              </div>
            </form>
          ) : null}
        </Panel>
      </section>

      <aside className="space-y-6">
        <Panel title="AI settings">
          {props.canManage ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!props.caseMeta.aiOptOut}
                onChange={(e) => void toggleAiOptOut(e.target.checked)}
                disabled={busy === `/api/cases/${props.caseId}`}
              />
              Allow AI insights on this case
            </label>
          ) : (
            <p className="text-sm text-muted-foreground">
              {props.caseMeta.aiOptOut
                ? "AI is opted out for this case."
                : "AI insights are enabled."}
            </p>
          )}
        </Panel>

        <Panel
          title={
            <span className="flex items-center gap-2">
              AI insights
              <span
                className="rounded-full border border-dashed border-amber-400 px-2 py-0.5 text-[10px] font-medium uppercase text-amber-700"
                title="AI insights are advisory only"
              >
                advisory
              </span>
            </span>
          }
        >
          {!props.aiEnabled ? (
            <p className="text-sm text-muted-foreground">
              AI features are disabled in this environment.
            </p>
          ) : null}
          {props.caseMeta.aiOptOut ? (
            <p className="text-sm text-muted-foreground">
              AI is opted out for this case. Re-enable above to run insights.
            </p>
          ) : null}
          {props.aiEnabled && props.canRunAI && !props.caseMeta.aiOptOut ? (
            <div className="flex flex-wrap gap-2">
              <AIButton
                disabled={busy === `/api/cases/${props.caseId}/ai`}
                onClick={() => runAI("summary")}
                label="Generate summary"
              />
              <AIButton
                disabled={busy === `/api/cases/${props.caseId}/ai`}
                onClick={() => runAI("risk_assessment")}
                label="Classify risk"
              />
              <AIButton
                disabled={busy === `/api/cases/${props.caseId}/ai`}
                onClick={() => runAI("next_action")}
                label="Suggest next actions"
              />
            </div>
          ) : null}

          {props.insights.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No AI insights yet.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {props.insights.map((i) => (
                <li key={i.id} className="rounded-md border border-border p-3">
                  <InsightDetail
                    insight={i}
                    expanded={expandedInsightId === i.id}
                    onToggleExpand={() =>
                      setExpandedInsightId((id) => (id === i.id ? null : i.id))
                    }
                    canManage={props.canManage}
                    busy={busy}
                    onAcknowledge={() => acknowledgeInsight(i.id)}
                    onApplyRisk={() => applyRiskFromInsight(i)}
                    onAddTask={addTaskFromSuggestion}
                  />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {error ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {pending ? (
          <p className="text-xs text-muted-foreground">Refreshing…</p>
        ) : null}
      </aside>
    </div>
  );
}

function InsightDetail({
  insight,
  expanded,
  onToggleExpand,
  canManage,
  busy,
  onAcknowledge,
  onApplyRisk,
  onAddTask,
}: {
  insight: Insight;
  expanded: boolean;
  onToggleExpand: () => void;
  canManage: boolean;
  busy: string | null;
  onAcknowledge: () => void;
  onApplyRisk: () => void;
  onAddTask: (action: AINextAction) => void;
}) {
  const riskDetail =
    insight.kind === "risk_assessment"
      ? (insight.detailJson as AIRiskAssessment | null)
      : null;
  const nextActionsDetail =
    insight.kind === "next_action" && Array.isArray(insight.detailJson)
      ? (insight.detailJson as AINextAction[])
      : null;

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {insight.kind.replaceAll("_", " ")}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${insight.requiresReview ? "bg-amber-100 text-amber-900" : "bg-green-100 text-green-900"}`}
        >
          {insight.requiresReview ? "needs review" : "acknowledged"}
        </span>
      </div>
      <p className="mt-2 text-sm">{insight.summary}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        engine: {insight.engine} · confidence{" "}
        {(insight.confidence * 100).toFixed(0)}% ·{" "}
        {format(new Date(insight.createdAt), "d MMM HH:mm")}
      </p>

      {riskDetail?.signals?.length ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          {riskDetail.signals.map((signal) => (
            <li key={signal}>{signal}</li>
          ))}
        </ul>
      ) : null}

      {nextActionsDetail?.length ? (
        <ul className="mt-2 space-y-2">
          {nextActionsDetail.map((action) => (
            <li
              key={action.title}
              className="rounded-md border border-dashed border-border p-2 text-xs"
            >
              <p className="font-medium">{action.title}</p>
              <p className="text-muted-foreground">{action.reason}</p>
              {canManage ? (
                <button
                  type="button"
                  onClick={() => onAddTask(action)}
                  disabled={Boolean(busy)}
                  className="mt-2 rounded-md border border-border px-2 py-1 hover:bg-muted disabled:opacity-60"
                >
                  Add as task
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-2 flex flex-wrap gap-2">
        {insight.requiresReview && canManage ? (
          <>
            <button
              type="button"
              onClick={onAcknowledge}
              disabled={busy?.includes(insight.id)}
              className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted disabled:opacity-60"
            >
              Acknowledge
            </button>
            {riskDetail?.level ? (
              <button
                type="button"
                onClick={onApplyRisk}
                disabled={busy?.includes(insight.id)}
                className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted disabled:opacity-60"
              >
                Apply risk to case
              </button>
            ) : null}
          </>
        ) : null}
        <button
          type="button"
          onClick={onToggleExpand}
          className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted"
        >
          {expanded ? "Hide detail" : "View detail JSON"}
        </button>
      </div>

      {expanded ? (
        <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-muted/40 p-2 text-[10px]">
          {JSON.stringify(insight.detailJson, null, 2)}
        </pre>
      ) : null}
    </>
  );
}

function Panel({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function AIButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-60"
    >
      {label}
    </button>
  );
}
