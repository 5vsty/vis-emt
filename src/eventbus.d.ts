declare module '@fsdev/eventbus/eventBus.js' {
  interface EventBus {
    emit(event: string, payload?: unknown): void;
    on(event: string, callback: (payload: never) => void): void;
    off(event: string, callback: (payload: never) => void): void;
  }

  function getEventBus(): EventBus;
}
