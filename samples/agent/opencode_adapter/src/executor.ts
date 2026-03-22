import type {Message, Task, TaskState, TaskStatusUpdateEvent} from '@a2a-js/sdk';
import type {
  AgentExecutor,
  ExecutionEventBus,
  RequestContext,
} from '@a2a-js/sdk/server';

import {mapBusinessViewToA2UI} from './a2ui/mapper.js';
import {parseInboundEvent} from './inbound.js';
import {OpenCodeClient} from './opencode-client.js';
import {createA2UIParts, createTextSurfaceMessages} from './protocol/a2ui.js';
import {SessionStore} from './session-store.js';

function createAgentMessage(contextId: string, uiMessages: Record<string, unknown>[]): Message {
  return {
    kind: 'message',
    messageId: crypto.randomUUID(),
    role: 'agent',
    contextId,
    parts: createA2UIParts(uiMessages),
  } as Message;
}

function createInitialTask(requestContext: RequestContext): Task {
  return {
    kind: 'task',
    id: requestContext.taskId,
    contextId: requestContext.contextId,
    status: {
      state: 'submitted',
      timestamp: new Date().toISOString(),
    },
    history: [requestContext.userMessage],
  } as Task;
}

function createStatusUpdate(
  taskId: string,
  contextId: string,
  state: TaskState,
  message?: Message,
  final: boolean = false
): TaskStatusUpdateEvent {
  return {
    kind: 'status-update',
    taskId,
    contextId,
    status: {
      state,
      timestamp: new Date().toISOString(),
      ...(message ? {message} : {}),
    },
    final,
  } as TaskStatusUpdateEvent;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unknown adapter error';
}

export class OpenCodeAdapterExecutor implements AgentExecutor {
  readonly #opencodeClient: OpenCodeClient;
  readonly #sessions: SessionStore;

  constructor(
    opencodeClient: OpenCodeClient = new OpenCodeClient(),
    sessions: SessionStore = new SessionStore()
  ) {
    this.#opencodeClient = opencodeClient;
    this.#sessions = sessions;
  }

  async execute(
    requestContext: RequestContext,
    eventBus: ExecutionEventBus
  ): Promise<void> {
    const {task, taskId, contextId, userMessage} = requestContext;

    if (!task) {
      eventBus.publish(createInitialTask(requestContext));
    }

    eventBus.publish(createStatusUpdate(taskId, contextId, 'working'));

    try {
      const inboundEvent = parseInboundEvent(userMessage.parts ?? []);
      const existingSessionId = this.#sessions.get(taskId);
      const {sessionId, result} = await this.#opencodeClient.run(
        inboundEvent,
        existingSessionId
      );
      this.#sessions.set(taskId, sessionId);

      const uiMessages =
        result.type === 'business_json'
          ? mapBusinessViewToA2UI(result.payload)
          : result.type === 'text'
            ? createTextSurfaceMessages('OpenCode Response', result.text)
            : createTextSurfaceMessages('OpenCode Error', result.message, 'error');

      const message = createAgentMessage(contextId, uiMessages);
      eventBus.publish(
        createStatusUpdate(taskId, contextId, 'completed', message, true)
      );
    } catch (error) {
      const message = createAgentMessage(
        contextId,
        createTextSurfaceMessages('Adapter Error', getErrorMessage(error), 'error')
      );
      eventBus.publish(createStatusUpdate(taskId, contextId, 'failed', message, true));
    } finally {
      eventBus.finished();
    }
  }

  async cancelTask(
    taskId: string,
    eventBus: ExecutionEventBus
  ): Promise<void> {
    this.#sessions.delete(taskId);
    eventBus.finished();
  }
}
