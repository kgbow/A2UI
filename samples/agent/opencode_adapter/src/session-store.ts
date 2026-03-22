export class SessionStore {
  readonly #taskToSession = new Map<string, string>();

  get(taskId: string): string | undefined {
    return this.#taskToSession.get(taskId);
  }

  set(taskId: string, sessionId: string): void {
    this.#taskToSession.set(taskId, sessionId);
  }

  delete(taskId: string): void {
    this.#taskToSession.delete(taskId);
  }
}
