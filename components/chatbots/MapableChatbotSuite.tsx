"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Bot,
  Bus,
  Check,
  Cloud,
  Copy,
  FileText,
  LogOut,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/app/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type BotMode,
  type ChatMessage,
  type ResumeState,
  type TransportState,
  respondToResume,
  respondToSupport,
  respondToTransport,
  suggestionsForMode,
  welcomeMessage,
} from "@/lib/chatbots/bots";

type StreamTokenResponse =
  | {
      configured: true;
      apiKey: string;
      userId: string;
      token: string;
    }
  | {
      configured: false;
      reason: string;
    };

type ModeConfig = {
  title: string;
  shortTitle: string;
  description: string;
  icon: LucideIcon;
  accent: string;
};

const modeConfig: Record<BotMode, ModeConfig> = {
  support: {
    title: "Support Search Chatbot",
    shortTitle: "Support Search",
    description:
      "Search a local support knowledge base and get cited answers with follow-up prompts.",
    icon: Search,
    accent: "from-sky-400/25 to-cyan-300/10",
  },
  transport: {
    title: "Transport Booking Chatbot",
    shortTitle: "Transport Booking",
    description:
      "Collect trip details conversationally and generate a mock booking reference.",
    icon: Bus,
    accent: "from-violet-400/25 to-fuchsia-300/10",
  },
  resume: {
    title: "Resume Builder Chatbot",
    shortTitle: "Resume Builder",
    description:
      "Gather career details and turn them into copy-friendly resume markdown.",
    icon: FileText,
    accent: "from-emerald-400/25 to-teal-300/10",
  },
};

type StreamStatus =
  | { kind: "idle"; label: string; detail: string }
  | { kind: "checking"; label: string; detail: string }
  | {
      kind: "configured";
      label: string;
      detail: string;
      session: Extract<StreamTokenResponse, { configured: true }>;
    }
  | { kind: "local"; label: string; detail: string }
  | { kind: "error"; label: string; detail: string };

export function MapableChatbotSuite({ userName }: { userName: string }) {
  const [draftName, setDraftName] = useState(userName);
  const [username, setUsername] = useState<string | null>(userName);
  const [activeMode, setActiveMode] = useState<BotMode>("support");
  const [messages, setMessages] = useState<Record<BotMode, ChatMessage[]>>({
    support: [],
    transport: [],
    resume: [],
  });
  const [transportState, setTransportState] = useState<TransportState>({});
  const [resumeState, setResumeState] = useState<ResumeState>({});
  const [streamStatus, setStreamStatus] = useState<StreamStatus>({
    kind: "idle",
    label: "Local mode",
    detail: "Log in to check whether optional Stream Chat persistence is configured.",
  });

  useEffect(() => {
    if (!username) return;

    let mounted = true;
    const timer = setTimeout(async () => {
      if (!mounted) return;
      setStreamStatus({
        kind: "checking",
        label: "Checking Stream",
        detail: "Requesting a server-created chat token for this username.",
      });

      try {
        const response = await fetch("/api/chatbots/stream-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        const payload = (await response.json()) as StreamTokenResponse;

        if (!mounted) return;

        if (payload.configured) {
          setStreamStatus({
            kind: "configured",
            label: "Stream ready",
            detail:
              "A Stream token is available in React state for future persistent chat wiring.",
            session: payload,
          });
        } else {
          setStreamStatus({
            kind: "local",
            label: "Local deterministic mode",
            detail: payload.reason,
          });
        }
      } catch {
        if (!mounted) return;
        setStreamStatus({
          kind: "error",
          label: "Stream check failed",
          detail:
            "The app still works locally. Check the token route if you want Stream persistence.",
        });
      }
    }, 50);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [username]);

  const activeMessages = messages[activeMode];

  function handleLogin() {
    const cleanName = draftName.trim();
    if (!cleanName) return;

    setUsername(cleanName);
    setMessages({
      support: [welcomeMessage("support", cleanName)],
      transport: [welcomeMessage("transport", cleanName)],
      resume: [welcomeMessage("resume", cleanName)],
    });
  }

  function handleLogout() {
    setUsername(userName);
    setDraftName(userName);
    setActiveMode("support");
    setTransportState({});
    setResumeState({});
    setMessages({
      support: [welcomeMessage("support", userName)],
      transport: [welcomeMessage("transport", userName)],
      resume: [welcomeMessage("resume", userName)],
    });
    setStreamStatus({
      kind: "idle",
      label: "Local mode",
      detail: "Session reset. Stream Chat persistence will be checked again.",
    });
  }

  function sendMessage(input: string) {
    const trimmed = input.trim();
    if (!trimmed || !username) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    let botMessage: ChatMessage;

    if (activeMode === "support") {
      botMessage = respondToSupport(trimmed);
    } else if (activeMode === "transport") {
      const result = respondToTransport(trimmed, transportState);
      setTransportState(result.state);
      botMessage = result.message;
    } else {
      const result = respondToResume(trimmed, resumeState);
      setResumeState(result.state);
      botMessage = result.message;
    }

    setMessages((current) => ({
      ...current,
      [activeMode]: [...current[activeMode], userMessage, botMessage],
    }));
  }

  if (!username) {
    return (
      <LoginScreen
        draftName={draftName}
        onDraftNameChange={setDraftName}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-card/75 p-5 shadow-2xl shadow-black/20 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary">MapAble Core</Badge>
            <Badge variant="outline">local-first bots</Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Support, transport and resume chatbots
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Welcome, {username}. Choose a mode from the hub or keep chatting in
            the active workspace.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => setActiveMode("support")}>
            Hub
          </Button>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="flex flex-col gap-4">
          <ModeHub activeMode={activeMode} onModeChange={setActiveMode} />
          <StreamStatusCard status={streamStatus} />
        </aside>
        <ChatPanel
          mode={activeMode}
          messages={activeMessages}
          onSend={sendMessage}
          onBackToHub={() => setActiveMode("support")}
        />
      </div>
    </main>
  );
}

function LoginScreen({
  draftName,
  onDraftNameChange,
  onLogin,
}: {
  draftName: string;
  onDraftNameChange: (value: string) => void;
  onLogin: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-xl overflow-hidden border-white/10 bg-card/80 shadow-2xl shadow-black/30 backdrop-blur">
        <div className="bg-gradient-to-br from-primary/25 via-card to-card p-1">
          <CardHeader className="p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Bot className="h-6 w-6" />
            </div>
            <CardTitle className="text-3xl">Start your chatbot workspace</CardTitle>
            <CardDescription className="text-base">
              Enter a username to open the hub. The name stays in React state
              only, so each browser tab can act as a separate user.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-8 pt-0">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                value={draftName}
                onChange={(event) => onDraftNameChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onLogin();
                }}
                placeholder="e.g. Jordan"
              />
            </div>
            <Button className="w-full" size="lg" onClick={onLogin}>
              Continue to bots
              <Sparkles className="h-4 w-4" />
            </Button>
          </CardContent>
        </div>
      </Card>
    </main>
  );
}

function ModeHub({
  activeMode,
  onModeChange,
}: {
  activeMode: BotMode;
  onModeChange: (mode: BotMode) => void;
}) {
  return (
    <Card className="border-white/10 bg-card/75 backdrop-blur">
      <CardHeader>
        <CardTitle>Bot modes</CardTitle>
        <CardDescription>
          One app, three deterministic chatbot workflows.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {(Object.keys(modeConfig) as BotMode[]).map((mode) => {
          const config = modeConfig[mode];
          const Icon = config.icon;
          const selected = activeMode === mode;

          return (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              className={cn(
                "w-full rounded-xl border p-4 text-left transition-all",
                selected
                  ? "border-primary/60 bg-primary/10 shadow-lg shadow-primary/10"
                  : "border-border bg-background/40 hover:border-primary/40 hover:bg-accent/40",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br",
                    config.accent,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">{config.shortTitle}</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {config.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

function StreamStatusCard({ status }: { status: StreamStatus }) {
  const isReady = status.kind === "configured";

  return (
    <Card className="border-white/10 bg-card/75 backdrop-blur">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              isReady ? "bg-emerald-400/15 text-emerald-300" : "bg-sky-400/15 text-sky-300",
            )}
          >
            {isReady ? <ShieldCheck className="h-5 w-5" /> : <Cloud className="h-5 w-5" />}
          </div>
          <div>
            <CardTitle className="text-base">{status.label}</CardTitle>
            <CardDescription>Optional Stream Chat wiring</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>{status.detail}</p>
        {status.kind === "configured" ? (
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-emerald-100">
            User ID: <span className="font-mono">{status.session.userId}</span>.
            The token is held in memory and is not displayed.
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-background/50 p-3">
            Add server-side `STREAM_API_KEY` and `STREAM_API_SECRET` to enable
            persistence later. No `NEXT_PUBLIC_STREAM_*` values are used.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChatPanel({
  mode,
  messages,
  onSend,
  onBackToHub,
}: {
  mode: BotMode;
  messages: ChatMessage[];
  onSend: (value: string) => void;
  onBackToHub: () => void;
}) {
  const [draft, setDraft] = useState("");
  const config = modeConfig[mode];
  const Icon = config.icon;
  const starterSuggestions = useMemo(() => suggestionsForMode(mode), [mode]);

  function submit(value = draft) {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setDraft("");
  }

  return (
    <Card className="flex min-h-[720px] flex-col overflow-hidden border-white/10 bg-card/80 backdrop-blur">
      <div className={cn("border-b bg-gradient-to-r p-5", config.accent)}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background/60">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{config.title}</h2>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onBackToHub}>
            <ArrowLeft className="h-4 w-4" />
            Hub
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onSuggestionClick={(suggestion) => {
              setDraft(suggestion);
            }}
          />
        ))}
      </div>

      <div className="border-t bg-background/40 p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {starterSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
              onClick={() => setDraft(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                submit();
              }
            }}
            placeholder="Type a message. Press Ctrl/⌘ + Enter to send."
            className="min-h-16"
          />
          <Button className="self-end" size="icon" onClick={() => submit()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function MessageBubble({
  message,
  onSuggestionClick,
}: {
  message: ChatMessage;
  onSuggestionClick: (suggestion: string) => void;
}) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[92%] space-y-3 rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[78%]",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-background/70",
        )}
      >
        <p className="whitespace-pre-line">{message.content}</p>

        {message.citations ? <CitationCards citations={message.citations} /> : null}
        {message.booking ? <BookingCard booking={message.booking} /> : null}
        {message.resumeMarkdown ? (
          <ResumeMarkdownCard markdown={message.resumeMarkdown} />
        ) : null}

        {!isUser && message.suggestions?.length ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {message.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                onClick={() => onSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CitationCards({ citations }: { citations: NonNullable<ChatMessage["citations"]> }) {
  return (
    <div className="grid gap-2">
      {citations.map((citation) => (
        <div
          key={citation.id}
          className="rounded-xl border border-border bg-card/80 p-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{citation.id}</Badge>
            <span className="text-xs text-muted-foreground">{citation.category}</span>
          </div>
          <div className="mt-2 font-medium">{citation.title}</div>
          <p className="mt-1 text-sm text-muted-foreground">{citation.snippet}</p>
        </div>
      ))}
    </div>
  );
}

function BookingCard({ booking }: { booking: NonNullable<ChatMessage["booking"]> }) {
  const rows = [
    ["Pickup", booking.origin],
    ["Destination", booking.destination],
    ["Date", booking.date],
    ["Time", booking.time],
    ["Passengers", booking.passengers],
    ["Accessibility", booking.accessibility],
    ["Contact", booking.contact],
  ];

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="font-medium">Booking summary</div>
        <Badge>{booking.reference}</Badge>
      </div>
      <div className="grid gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[120px_1fr] gap-3 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResumeMarkdownCard({ markdown }: { markdown: string }) {
  const [copied, setCopied] = useState(false);

  async function copyMarkdown() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="rounded-xl border border-border bg-card/90">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-medium">Resume markdown</span>
        <Button variant="outline" size="sm" onClick={copyMarkdown}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap p-4 font-mono text-xs leading-5 text-muted-foreground">
        {markdown}
      </pre>
    </div>
  );
}
