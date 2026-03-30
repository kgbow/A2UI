export interface TextPart {
  id: string;
  sessionID: string;
  messageID: string;
  type: "text";
  text: string;
  synthetic?: boolean;
  ignored?: boolean;
  metadata?: Record<string, unknown>;
}

export interface OpencodeResponse {
  info: unknown;
  parts: Array<TextPart | Record<string, unknown>>;
}
