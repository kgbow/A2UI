import type {InboundEvent} from './inbound.js';

export type RestaurantListView = {
  intent: 'restaurant_list';
  title?: string;
  items?: Array<{
    name: string;
    detail: string;
    imageUrl: string;
    rating: string;
    infoLink: string;
    address: string;
  }>;
};

export type BookingFormView = {
  intent: 'booking_form';
  restaurantName: string;
  imageUrl: string;
  address: string;
};

export type BookingConfirmationView = {
  intent: 'booking_confirmation';
  restaurantName: string;
  partySize: string;
  reservationTime: string;
  dietary: string;
  imageUrl: string;
};

export type ErrorView = {
  intent: 'error_view';
  title?: string;
  message: string;
};

export type BusinessView =
  | RestaurantListView
  | BookingFormView
  | BookingConfirmationView
  | ErrorView;

export type OpenCodeResult =
  | {type: 'business_json'; payload: BusinessView}
  | {type: 'text'; text: string}
  | {type: 'error'; message: string};

type OpenCodePart = {
  type?: string;
  text?: string;
};

type OpenCodeMessage = {
  info?: {
    role?: string;
    error?: {
      name?: string;
      data?: {
        message?: string;
        [key: string]: unknown;
      };
    };
  };
  parts?: OpenCodePart[];
};

function toPrompt(event: InboundEvent): string {
  if (event.type === 'text_query') {
    return event.text;
  }

  return JSON.stringify(event);
}

function extractAssistantError(message: OpenCodeMessage): string | null {
  const error = message.info?.error;
  if (!error) {
    return null;
  }

  const name = error.name?.trim();
  const detail = error.data?.message?.trim();
  if (name && detail) {
    return `${name}: ${detail}`;
  }

  return name ?? detail ?? 'OpenCode returned an assistant error';
}

function extractText(message: OpenCodeMessage): string {
  const text = (message.parts ?? [])
    .map((part) => (typeof part.text === 'string' ? part.text.trim() : ''))
    .filter(Boolean)
    .join('\n');

  return text || 'OpenCode returned no text output';
}

function tryParseBusinessView(text: string): BusinessView | null {
  if (!text) {
    return null;
  }

  try {
    const parsed = JSON.parse(text) as {intent?: unknown};
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.intent === 'string'
    ) {
      return parsed as BusinessView;
    }
  } catch {
    return null;
  }

  return null;
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function ensureSession(serverUrl: string): Promise<string> {
  const response = await fetch(`${serverUrl}/session`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: '{}',
  });

  if (!response.ok) {
    throw new Error(`OpenCode session creation failed with ${response.status}`);
  }

  const session = (await readJson<{id?: unknown}>(response)).id;
  if (typeof session !== 'string' || !session) {
    throw new Error('OpenCode session creation returned no session id');
  }

  return session;
}

async function postPrompt(
  serverUrl: string,
  sessionId: string,
  prompt: string
): Promise<OpenCodeMessage> {
  const response = await fetch(`${serverUrl}/session/${sessionId}/message`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({
      parts: [{type: 'text', text: prompt}],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenCode message request failed with ${response.status}`);
  }

  return readJson<OpenCodeMessage>(response);
}

export class OpenCodeClient {
  readonly #serverUrl: string;

  constructor(
    serverUrl: string = process.env.OPENCODE_SERVER_URL ?? 'http://127.0.0.1:4096'
  ) {
    this.#serverUrl = serverUrl.replace(/\/$/, '');
  }

  async run(
    event: InboundEvent,
    sessionId?: string
  ): Promise<{sessionId: string; result: OpenCodeResult}> {
    const resolvedSessionId = sessionId ?? (await ensureSession(this.#serverUrl));
    const message = await postPrompt(
      this.#serverUrl,
      resolvedSessionId,
      toPrompt(event)
    );

    const error = extractAssistantError(message);
    if (error) {
      return {
        sessionId: resolvedSessionId,
        result: {
          type: 'error',
          message: error,
        },
      };
    }

    const text = extractText(message);
    const businessView = tryParseBusinessView(text);
    return {
      sessionId: resolvedSessionId,
      result: businessView
        ? {type: 'business_json', payload: businessView}
        : {type: 'text', text},
    };
  }
}
