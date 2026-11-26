import { store } from '@fsdev/pluginapi';
import { v4 as uuidv4 } from 'uuid';
import { REQUEST_TIMEOUT_MS } from '@/constants';
import { getResponseKey, type backendToFrontendMessage } from '@/messages/backendToFrontend';
import type { frontendToBackendMessage } from '@/messages/frontendToBackend';

interface Pending {
  resolve: (msg: backendToFrontendMessage) => void;
  timer: ReturnType<typeof setTimeout>;
}

const pending = new Map<string, Pending>();

/** Requests whose func value is not a token are matched by response key only. */
const KEY_CORRELATED: string[] = [];

function pendingKey(responseKey: string, token: string) {
  return `${responseKey}:${token}`;
}

/** Called by the message handler for every EMT response. Returns true if a request was waiting for it. */
export function resolveRequest(msg: backendToFrontendMessage): boolean {
  for (const [key, value] of Object.entries(msg)) {
    if (!key.startsWith('funcResponse')) {
      continue;
    }
    const candidates = [pendingKey(key, String(value)), pendingKey(key, '*')];
    for (const candidate of candidates) {
      const entry = pending.get(candidate);
      if (entry !== undefined) {
        clearTimeout(entry.timer);
        pending.delete(candidate);
        entry.resolve(msg);
        return true;
      }
    }
  }
  return false;
}

function getFuncKey(message: frontendToBackendMessage): string {
  const key = Object.keys(message).find((k) => k.startsWith('func'));
  if (key === undefined) {
    throw new Error('[Emt] message without func key');
  }
  return key;
}

/**
 * Sends a request and resolves with the matching response. A token is generated and stored as the
 * value of the func key (and of RequestId, if the message has one); the backend answers with the
 * same token in funcResponse<X>. If no response arrives in time, a failed response with reason
 * Unavailable is returned instead of rejecting.
 */
export function sendRequest<TResponse extends backendToFrontendMessage>(message: frontendToBackendMessage): Promise<TResponse> {
  const token = uuidv4();
  const requestKey = getFuncKey(message);
  const responseKey = getResponseKey(requestKey);
  const correlation = KEY_CORRELATED.includes(requestKey) ? '*' : token;
  const key = pendingKey(responseKey, correlation);

  const outgoing: Record<string, unknown> = { ...message };
  if (correlation !== '*') {
    outgoing[requestKey] = token;
  }
  if ('RequestId' in outgoing) {
    outgoing.RequestId = token;
  }

  return new Promise<TResponse>((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(key);
      resolve({ ID: message.ID, [responseKey]: token, Successful: false, Reason: 'Unavailable' } as unknown as TResponse);
    }, REQUEST_TIMEOUT_MS);

    pending.set(key, { resolve: resolve as (msg: backendToFrontendMessage) => void, timer });
    // addMessage lives in the host's objectStore module, as in the other plugins (e.g. instructions).
    store.commit('objectStore/addMessage', [outgoing]);
  });
}
