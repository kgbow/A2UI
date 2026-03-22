import {describe, expect, it, vi, afterEach} from 'vitest';

import {mapBusinessViewToA2UI} from '../src/a2ui/mapper.js';
import {parseInboundEvent} from '../src/inbound.js';
import {OpenCodeClient} from '../src/opencode-client.js';
import {createA2UIParts} from '../src/protocol/a2ui.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('parseInboundEvent', () => {
  it('parses text input', () => {
    const event = parseInboundEvent([{kind: 'text', text: 'hello'} as never]);
    expect(event).toEqual({type: 'text_query', text: 'hello'});
  });

  it('parses userAction input', () => {
    const event = parseInboundEvent([
      {
        kind: 'data',
        data: {
          userAction: {
            name: 'book_restaurant',
            context: {restaurantName: 'Han Dynasty'},
          },
        },
      } as never,
    ]);

    expect(event).toEqual({
      type: 'ui_action',
      action: 'book_restaurant',
      payload: {restaurantName: 'Han Dynasty'},
    });
  });
});

describe('createA2UIParts', () => {
  it('creates one data part per message', () => {
    const parts = createA2UIParts([{beginRendering: {}}, {surfaceUpdate: {}}]);
    expect(parts).toHaveLength(2);
    expect(parts[0]).toMatchObject({
      kind: 'data',
      metadata: {mimeType: 'application/json+a2ui'},
      mimeType: 'application/json+a2ui',
    });
  });
});

describe('mapBusinessViewToA2UI', () => {
  it('maps restaurant list intent to full snapshot messages', () => {
    const messages = mapBusinessViewToA2UI({
      intent: 'restaurant_list',
      title: 'Demo Restaurants',
      items: [],
    });

    expect(messages).toHaveLength(3);
    expect(messages[0]).toHaveProperty('beginRendering');
    expect(messages[1]).toHaveProperty('surfaceUpdate');
    expect(messages[2]).toHaveProperty('dataModelUpdate');
  });

  it('maps error views to text surface messages', () => {
    const messages = mapBusinessViewToA2UI({
      intent: 'error_view',
      title: 'Oops',
      message: 'Something went wrong',
    });

    expect(messages[0]).toHaveProperty('beginRendering');
    expect(messages[2]).toMatchObject({
      dataModelUpdate: {
        surfaceId: 'error',
      },
    });
  });
});

describe('OpenCodeClient', () => {
  it('creates a session and returns text output', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({id: 'ses_test_1'}), {
          status: 200,
          headers: {'content-type': 'application/json'},
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            info: {role: 'assistant'},
            parts: [{type: 'text', text: 'plain text reply'}],
          }),
          {
            status: 200,
            headers: {'content-type': 'application/json'},
          }
        )
      );

    const client = new OpenCodeClient('http://127.0.0.1:4096');
    const output = await client.run({type: 'text_query', text: 'hello'});

    expect(output).toEqual({
      sessionId: 'ses_test_1',
      result: {type: 'text', text: 'plain text reply'},
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns assistant errors as error results', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            info: {
              role: 'assistant',
              error: {
                name: 'ProviderAuthError',
                data: {message: 'Missing provider key'},
              },
            },
            parts: [],
          }),
          {
            status: 200,
            headers: {'content-type': 'application/json'},
          }
        )
      );

    const client = new OpenCodeClient('http://127.0.0.1:4096');
    const output = await client.run(
      {type: 'text_query', text: 'hello'},
      'ses_existing'
    );

    expect(output).toEqual({
      sessionId: 'ses_existing',
      result: {
        type: 'error',
        message: 'ProviderAuthError: Missing provider key',
      },
    });
  });
});
