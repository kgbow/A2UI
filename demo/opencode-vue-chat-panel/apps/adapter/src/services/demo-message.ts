import {
  buildFormSurface,
  type AgentStructuredResponse,
  type DemoMessage,
  type OpencodeResponse,
} from "@demo/shared";

export function buildUserDemoMessage(input: {
  sessionId: string;
  text: string;
}): DemoMessage {
  return {
    id: crypto.randomUUID(),
    sessionId: input.sessionId,
    role: "user",
    createdAt: Date.now(),
    displayText: input.text,
  };
}

export function buildAssistantDemoMessage(input: {
  sessionId: string;
  parsed: AgentStructuredResponse;
  response: OpencodeResponse;
  panelMode: "interactive" | "readonly";
}): DemoMessage {
  const { sessionId, parsed, response, panelMode } = input;
  const messageId = String(
    (response.info as { id?: string })?.id ?? crypto.randomUUID(),
  );

  return {
    id: messageId,
    sessionId,
    role: "assistant",
    createdAt: Date.now(),
    displayText: parsed.replyText,
    raw: {
      info: response.info,
      parts: response.parts,
    },
    panel: parsed.uiIntent
      ? {
          source: "a2ui",
          messages: buildFormSurface(`surface-${messageId}`, parsed.uiIntent),
        }
      : undefined,
    panelMode,
  };
}
