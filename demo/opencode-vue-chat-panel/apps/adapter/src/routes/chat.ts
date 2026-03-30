import type { Request, Response } from "express";
import type { ChatTurnRequest, ChatTurnResponse } from "@demo/shared";
import { extractTextParts, parseAgentStructuredText } from "../services/agent-output.js";
import {
  buildAssistantDemoMessage,
  buildUserDemoMessage,
} from "../services/demo-message.js";
import { generateId } from "../lib/id.js";

export function createChatHandler(deps: {
  sendMessage: (input: {
    sessionId: string;
    messageId: string;
    text: string;
  }) => Promise<{ info: unknown; parts: unknown[] }>;
}) {
  return async function chatHandler(
    req: Request<unknown, unknown, ChatTurnRequest>,
    res: Response<ChatTurnResponse>,
  ) {
    const userMessageId = generateId();
    const sessionId = req.body.sessionId;

    const response = await deps.sendMessage({
      sessionId,
      messageId: userMessageId,
      text: JSON.stringify({
        kind: "chat",
        userMessage: req.body.text,
        uiPolicy: {
          allowForm: true,
          allowedActions: ["submit_booking", "confirm_selection"],
          maxFields: 6,
          supportedInputTypes: ["text"],
        },
      }),
    });

    const parsed = parseAgentStructuredText(extractTextParts(response));

    res.json({
      sessionId,
      userMessage: buildUserDemoMessage({
        sessionId,
        text: req.body.text,
      }),
      assistantMessage: buildAssistantDemoMessage({
        sessionId,
        parsed,
        response,
        panelMode: "interactive",
      }),
    });
  };
}
