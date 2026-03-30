import { describe, expect, it } from "vitest";
import { agentStructuredResponseSchema } from "./agent";

describe("agentStructuredResponseSchema", () => {
  it("accepts a valid response with a form intent", () => {
    const result = agentStructuredResponseSchema.parse({
      replyText: "Please fill in this form.",
      uiIntent: {
        type: "form",
        title: "Booking",
        submitLabel: "Submit",
        submitAction: "submit_booking",
        fields: [
          {
            name: "partySize",
            label: "Party Size",
            inputType: "text",
          },
        ],
      },
    });

    expect(result.uiIntent?.fields[0]?.name).toBe("partySize");
  });

  it("rejects unsupported submit actions", () => {
    expect(() =>
      agentStructuredResponseSchema.parse({
        replyText: "Bad response",
        uiIntent: {
          type: "form",
          title: "Booking",
          submitLabel: "Submit",
          submitAction: "delete_everything",
          fields: [],
        },
      }),
    ).toThrow();
  });
});
