import { closeOverlay, failedResponse, showOverlay } from '@fsdev/overlay';
import { MESSAGE_ID } from '@/constants';
import { sendRequest } from '@/utils/requests';
import type { backendToFrontendMessage } from '@/messages/backendToFrontend';
import type { frontendToBackendMessage } from '@/messages/frontendToBackend';
import ConfirmDeleteFooter from '@/components/ConfirmDeleteFooter.vue';

interface ConfirmDeleteOptions {
  /** Translation key of the question in the overlay. */
  description: string;
  /** Translation key of the title of the overlay shown when the backend refuses. */
  failedTitle: string;
  request: frontendToBackendMessage;
  onDeleted?: () => void;
}

/** Asks for confirmation in an overlay, then sends the delete request; a refusal from the backend is shown in a second overlay. */
function confirmDelete({ description, failedTitle, request, onDeleted }: ConfirmDeleteOptions) {
  async function remove() {
    const response = (await sendRequest<backendToFrontendMessage>(request)) as { Successful?: boolean; Reason?: string };
    if (response.Successful === true) {
      onDeleted?.();
      return;
    }
    failedResponse(failedTitle, 'EMT_REASON_' + (response.Reason ?? 'Internal'));
  }

  showOverlay({
    title: 'EMT_DELETE',
    description,
    footer: ConfirmDeleteFooter,
    footerProps: { confirm: () => void remove() },
    onMainAction: () => {
      void remove();
      closeOverlay();
    },
  });
}

/** The backend refuses codes in use and "Other". */
export function confirmDeleteErrorCode(errorCodeId: string, onDeleted?: () => void) {
  confirmDelete({
    description: 'EMT_CONFIRM_DELETE_CODE',
    failedTitle: 'EMT_DELETE_CODE_FAILED',
    request: { ID: MESSAGE_ID.EMT, funcDeleteErrorCode: '', ErrorCodeId: errorCodeId },
    onDeleted,
  });
}

/** Removes the error with its history for good; only error managers may do this. */
export function confirmDeleteError(errorId: string, onDeleted?: () => void) {
  confirmDelete({
    description: 'EMT_CONFIRM_DELETE_ERROR',
    failedTitle: 'EMT_DELETE_ERROR_FAILED',
    request: { ID: MESSAGE_ID.EMT, funcDeleteError: '', ErrorId: errorId },
    onDeleted,
  });
}
