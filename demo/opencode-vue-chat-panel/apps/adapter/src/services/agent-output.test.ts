import { describe, expect, it } from "vitest";
import { parseAgentStructuredText } from "../services/agent-output.js";

describe("parseAgentStructuredText", () => {
  it("returns structured output when the text is valid JSON", () => {
    const result = parseAgentStructuredText([
      '{"replyText":"hello","uiIntent":{"type":"form","title":"Booking","submitLabel":"Submit","submitAction":"submit_booking","fields":[{"name":"partySize","label":"Party Size","inputType":"text"}]}}',
    ]);

    expect(result.replyText).toBe("hello");
    expect(result.uiIntent?.title).toBe("Booking");
  });

  it("falls back to plain text when JSON parsing fails", () => {
    const result = parseAgentStructuredText(["plain text reply"]);
    expect(result.replyText).toBe("plain text reply");
    expect(result.uiIntent).toBeUndefined();
  });
});
