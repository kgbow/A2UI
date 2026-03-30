import {
  agentStructuredResponseSchema,
  type AgentStructuredResponse,
  type OpencodeResponse,
} from "@demo/shared";

export function extractTextParts(response: OpencodeResponse): string[] {
  return response.parts
    .filter((part): part is { type: "text"; text: string } => {
      return (
        typeof part === "object" &&
        part !== null &&
        part.type === "text" &&
        typeof (part as { type: "text"; text: string }).text === "string"
      );
    })
    .map((part) => part.text);
}

export function parseAgentStructuredText(
  textParts: string[],
): AgentStructuredResponse {
  const combined = textParts.join("\n").trim();

  try {
    return agentStructuredResponseSchema.parse(JSON.parse(combined));
  } catch {
    return {
      replyText: combined || "The assistant returned no text output.",
    };
  }
}
