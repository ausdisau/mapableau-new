export type AskWidgetTab = "chat" | "actions" | "history";

export type AskChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type AskLocalSession = {
  id: string;
  title: string;
  updatedAt: string;
  messages: AskChatMessage[];
};

export const ASK_WIDGET_STORAGE = {
  open: "mapable.askWidget.open",
  tab: "mapable.askWidget.tab",
  sessionId: "mapable.askWidget.activeSessionId",
  sessions: "mapable.askWidget.sessions",
} as const;
