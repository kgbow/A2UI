import type { Request, Response } from "express";
import type { PanelActionRequest, PanelActionResponse } from "@demo/shared";
import { extractTextParts, parseAgentStructuredText } from "../services/agent-output.js";
import { buildAssistantDemoMessage } from "../services/demo-message.js";
import { generateId } from "../lib/id.js";

export function createPanelActionHandler(deps: {
  sendMessage: (input: {
    sessionId: string;
    messageId: string;
    text: string;
  }) => Promise<{ info: unknown; parts: unknown[] }>;
}) {
  return async function panelActionHandler(
    req: Request<unknown, unknown, PanelActionRequest>,
    res: Response<PanelActionResponse>,
  ) {
    const messageId = generateId();
    const sessionId = req.body.sessionId;

    const response = await deps.sendMessage({
      sessionId,
      messageId,
      text: JSON.stringify({
        kind: "ui_action",
        actionName: req.body.actionName,
        formData: req.body.formData,
      }),
    });

    const parsed = parseAgentStructuredText(extractTextParts(response));

    res.json({
      sessionId,
      assistantMessage: buildAssistantDemoMessage({
        sessionId,
        parsed,
        response,
        panelMode: "interactive",
      }),
    });
  };
}
