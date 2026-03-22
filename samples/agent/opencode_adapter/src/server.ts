import {AGENT_CARD_PATH} from '@a2a-js/sdk';
import {DefaultRequestHandler, InMemoryTaskStore} from '@a2a-js/sdk/server';
import {
  UserBuilder,
  agentCardHandler,
  jsonRpcHandler,
} from '@a2a-js/sdk/server/express';
import express from 'express';

import {createAgentCard} from './agent-card.js';
import {OpenCodeAdapterExecutor} from './executor.js';
import {OpenCodeClient} from './opencode-client.js';
import {SessionStore} from './session-store.js';

function readPort(): number {
  const rawPort = process.env.PORT;
  if (!rawPort) {
    return 10002;
  }

  const port = Number(rawPort);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${rawPort}`);
  }

  return port;
}

const port = readPort();
const baseUrl = process.env.AGENT_BASE_URL ?? `http://localhost:${port}`;
const requestHandler = new DefaultRequestHandler(
  createAgentCard(baseUrl),
  new InMemoryTaskStore(),
  new OpenCodeAdapterExecutor(new OpenCodeClient(), new SessionStore())
);

const app = express();
app.disable('x-powered-by');

app.use(
  `/${AGENT_CARD_PATH}`,
  agentCardHandler({agentCardProvider: requestHandler})
);
app.use(
  '/a2a/jsonrpc',
  jsonRpcHandler({
    requestHandler,
    userBuilder: UserBuilder.noAuthentication,
  })
);

app.listen(port, () => {
  console.log(`OpenCode adapter listening on ${baseUrl}`);
  console.log(`Agent card: ${baseUrl}/${AGENT_CARD_PATH}`);
  console.log(`JSON-RPC: ${baseUrl}/a2a/jsonrpc`);
});
