import type { OpencodeResponse, TextPart } from "@demo/shared";
import { config } from "../config.js";

export interface OpencodeClient {
  sendMessage(input: {
    sessionId: string;
    messageId: string;
    text: string;
  }): Promise<OpencodeResponse>;
}

export function createOpencodeClient(): OpencodeClient {
  return {
    async sendMessage({ sessionId, messageId, text }) {
      const part: TextPart = {
        id: `${messageId}-part`,
        sessionID: sessionId,
        messageID: messageId,
        type: "text",
        text,
      };

      const response = await fetch(
        `${config.opencodeBaseUrl}/session/${sessionId}/message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messageID: messageId,
            agent: config.opencodeAgent,
            system: config.opencodeSystemPrompt,
            parts: [part],
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Opencode request failed: ${response.status} ${response.statusText}`,
        );
      }

      return (await response.json()) as OpencodeResponse;
    },
  };
}
