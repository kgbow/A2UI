import type {Part} from '@a2a-js/sdk';

export const A2UI_EXTENSION_URI =
  'https://a2ui.org/a2a-extension/a2ui/v0.8';
export const A2UI_MIME_TYPE = 'application/json+a2ui';
export const STANDARD_CATALOG_ID =
  'https://a2ui.org/specification/v0_8/standard_catalog_definition.json';

export type A2UIMessage = Record<string, unknown>;

export function createA2UIPart(message: A2UIMessage): Part {
  return {
    kind: 'data',
    data: message,
    metadata: {
      mimeType: A2UI_MIME_TYPE,
    },
    mimeType: A2UI_MIME_TYPE,
  } as Part;
}

export function createA2UIParts(messages: A2UIMessage[]): Part[] {
  return messages.map(createA2UIPart);
}

export function createTextSurfaceMessages(
  title: string,
  body: string,
  surfaceId: string = 'default'
): A2UIMessage[] {
  return [
    {
      beginRendering: {
        surfaceId,
        root: `${surfaceId}-root`,
        styles: {primaryColor: '#FF0000', font: 'Roboto'},
      },
    },
    {
      surfaceUpdate: {
        surfaceId,
        components: [
          {
            id: `${surfaceId}-root`,
            component: {
              Card: {
                child: `${surfaceId}-content`,
              },
            },
          },
          {
            id: `${surfaceId}-content`,
            component: {
              Column: {
                children: {
                  explicitList: [`${surfaceId}-title`, `${surfaceId}-body`],
                },
              },
            },
          },
          {
            id: `${surfaceId}-title`,
            component: {
              Text: {
                usageHint: 'h2',
                text: {path: '/title'},
              },
            },
          },
          {
            id: `${surfaceId}-body`,
            component: {
              Text: {
                text: {path: '/body'},
              },
            },
          },
        ],
      },
    },
    {
      dataModelUpdate: {
        surfaceId,
        path: '/',
        contents: [
          {key: 'title', valueString: title},
          {key: 'body', valueString: body},
        ],
      },
    },
  ];
}
