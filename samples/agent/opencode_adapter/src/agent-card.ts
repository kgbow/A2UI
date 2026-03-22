import type {AgentCard} from '@a2a-js/sdk';

import {A2UI_EXTENSION_URI, STANDARD_CATALOG_ID} from './protocol/a2ui.js';

export function createAgentCard(baseUrl: string): AgentCard {
  return {
    name: 'OpenCode Adapter',
    description:
      'A minimal A2A adapter that serves A2UI v0.8 messages for the React shell sample.',
    protocolVersion: '0.3.0',
    version: '0.1.0',
    url: `${baseUrl}/a2a/jsonrpc`,
    skills: [
      {
        id: 'restaurant_demo',
        name: 'Restaurant demo',
        description: 'Returns restaurant discovery and booking UIs over A2UI.',
        tags: ['a2ui', 'restaurant', 'demo'],
      },
    ],
    capabilities: {
      pushNotifications: false,
      extensions: [
        {
          uri: A2UI_EXTENSION_URI,
          description: 'Ability to render A2UI',
          required: false,
          params: {
            supportedCatalogIds: [STANDARD_CATALOG_ID],
            acceptsInlineCatalogs: false,
          },
        },
      ],
    },
    defaultInputModes: ['text'],
    defaultOutputModes: ['text'],
    additionalInterfaces: [
      {
        url: `${baseUrl}/a2a/jsonrpc`,
        transport: 'JSONRPC',
      },
    ],
  } as AgentCard;
}
