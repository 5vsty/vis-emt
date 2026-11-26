import { getEventBus } from '@fsdev/eventbus/eventBus.js';
import { ADAPTIVE_WINDOW, WEBAPPLICATION_EVENTS } from '@/constants';
import { formatDateTime } from '@/utils/format';

/**
 * Shared by the error list and the "my errors" table of the report page: both tables have the columns of the backend's
 * ErrorListTable (07 §2.4), and a row's object id is the error id.
 */

/** The text of a cell; empty values give a dash. */
export function errorCellText(value: unknown, keySelector: string, translate: (key: string) => string): string {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  switch (keySelector) {
    case 'ReportedAt':
      return formatDateTime(Number(value));
    case 'Status':
      return translate('EMT_STATUS_' + String(value));
    case 'Severity':
      return translate('EMT_SEVERITY_' + String(value));
    default:
      return String(value);
  }
}

/** Opens the error detail window; readOnly is the reporter's view (only cancel). */
export function openErrorDetail(errorId: string, readOnly = false) {
  getEventBus().emit(WEBAPPLICATION_EVENTS.EVENT_ADAPTIVE_WINDOW, {
    PageType: 'adaptive',
    Id: ADAPTIVE_WINDOW.ERROR_DETAIL,
    Options: { errorId, readOnly },
    Position: 'right',
    Size: 'middle',
  });
}

export function closeRightWindows() {
  getEventBus().emit(WEBAPPLICATION_EVENTS.EVENT_CLOSE_ALL_ADAPTIVE_WINDOWS, { Position: 'right' });
}
