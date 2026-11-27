import { store } from '@fsdev/pluginapi';
import { STORE_KEY } from './constants';
import { isFuncErrorChanged, isFuncErrorCodesChanged, isFuncOpenError, type backendToFrontendMessage } from './messages/backendToFrontend';
import { openErrorFromNotification } from './utils/errorTable';
import { resolveRequest } from './utils/requests';

export const MESSAGE_ID = {
  EMT: '33d46b35-cf3a-4ab4-aa07-d3f58cfe5d7f',
};

export function handleMessageReceived(msgJson: { ID?: string }[]) {
  if (!Array.isArray(msgJson)) {
    return;
  }

  for (const msg of msgJson as backendToFrontendMessage[]) {
    // Messages are recognised by their unique func keys, not by ID: the host may replace the ID of
    // messages that look like records (they carry an ErrorId), see VIS/device-manager.
    if (msg === null || typeof msg !== 'object') {
      continue;
    }

    if (isFuncErrorChanged(msg)) {
      store.commit(`${STORE_KEY}/errorChanged`, msg);
    } else if (isFuncOpenError(msg)) {
      openErrorFromNotification(msg.ErrorId);
    } else if (isFuncErrorCodesChanged(msg)) {
      store.commit(`${STORE_KEY}/codesChanged`);
    } else {
      resolveRequest(msg);
    }
  }
}
