import { describe, expect, it, vi } from "vitest";
import { createChatHandler } from "../routes/chat.js";

describe("createChatHandler", () => {
  it("returns an assistant message with a panel when the agent output includes uiIntent", async () => {
    const handler = createChatHandler({
      sendMessage: vi.fn().mockResolvedValue({
        info: { id: "assistant-1" },
        parts: [
          {
            id: "part-1",
            sessionID: "session-1",
            messageID: "assistant-1",
            type: "text",
            text: '{"replyText":"Please fill in this form.","uiIntent":{"type":"form","title":"Booking","submitLabel":"Submit","submitAction":"submit_booking","fields":[{"name":"partySize","label":"Party Size","inputType":"text"}]}}',
          },
        ],
      }),
    });

    const json = vi.fn();
    await handler(
      { body: { sessionId: "session-1", text: "book" } } as never,
      { json } as never,
    );

    expect(json).toHaveBeenCalled();
    const response = json.mock.calls[0][0];
    expect(response.assistantMessage.panel).toBeDefined();
    expect(response.assistantMessage.panelMode).toBe("interactive");
  });
});
