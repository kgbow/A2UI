import type { A2uiServerMessage } from "./a2ui";

export interface ChatTurnRequest {
  sessionId: string;
  text: string;
}

export interface PanelActionRequest {
  sessionId: string;
  sourceMessageId: string;
  surfaceId: string;
  componentId: string;
  actionName: string;
  formData: Record<string, unknown>;
}

export interface DemoMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  createdAt: number;
  displayText?: string;
  raw?: {
    info: unknown;
    parts: unknown[];
  };
  panel?: DemoPanel;
  panelMode?: "interactive" | "readonly";
}

export interface DemoPanel {
  source: "a2ui";
  messages: A2uiServerMessage[];
}

export interface ChatTurnResponse {
  sessionId: string;
  userMessage: DemoMessage;
  assistantMessage: DemoMessage;
}

export interface PanelActionResponse {
  sessionId: string;
  assistantMessage: DemoMessage;
}
