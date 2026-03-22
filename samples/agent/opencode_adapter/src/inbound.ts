import type {Part} from '@a2a-js/sdk';

export type InboundEvent =
  | {type: 'text_query'; text: string}
  | {type: 'ui_action'; action: string; payload: Record<string, unknown>};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractUserAction(
  data: unknown
): {name: string; context: Record<string, unknown>} | null {
  if (!isRecord(data) || !isRecord(data.userAction)) {
    return null;
  }

  const name = data.userAction.name;
  const context = data.userAction.context;

  if (typeof name !== 'string') {
    return null;
  }

  return {
    name,
    context: isRecord(context) ? context : {},
  };
}

export function parseInboundEvent(parts: Part[]): InboundEvent {
  for (const part of parts) {
    if (part.kind === 'text' && part.text.trim()) {
      return {
        type: 'text_query',
        text: part.text,
      };
    }

    if (part.kind === 'data') {
      const action = extractUserAction(part.data);
      if (action) {
        return {
          type: 'ui_action',
          action: action.name,
          payload: action.context,
        };
      }

      if (isRecord(part.data)) {
        return {
          type: 'text_query',
          text: JSON.stringify(part.data),
        };
      }
    }
  }

  throw new Error('No supported input part found in the incoming A2A message.');
}
