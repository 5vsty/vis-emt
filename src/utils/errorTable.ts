import { getEventBus } from '@fsdev/eventbus/eventBus.js';
import { store } from '@fsdev/pluginapi';
import type { Column } from '@fsdev/table';
import { ADAPTIVE_WINDOW, EMT_PERMISSIONS, SEVERITIES, STATUSES, WEBAPPLICATION_EVENTS } from '@/constants';
import type { HasAccessFn } from '@/types';
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

/**
 * The filter of a column of the error tables: every column can be filtered. Dates by a range, everything else by a selection of the values the
 * rows have (the backend answers with them); status and severity show the translated names, the rows carry the wire values.
 */
export function errorColumnFilter(keySelector: string, translate: (key: string) => string): Column['filter'] {
  switch (keySelector) {
    case 'ReportedAt':
      return { type: 'DateTimePicker', keySelector };
    case 'Status':
      return { type: 'Multiselect', keySelector, labelValues: STATUSES.map((value) => ({ value, label: translate('EMT_STATUS_' + value) })) };
    case 'Severity':
      return { type: 'Multiselect', keySelector, labelValues: SEVERITIES.map((value) => ({ value, label: translate('EMT_SEVERITY_' + value) })) };
    default:
      return { type: 'Multiselect', keySelector };
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

/**
 * The "Open" button of a notification: opens the error. Somebody who may manage errors gets the full detail, everybody else (the reporter)
 * the read only one; what a user may see is decided by the backend when the detail is asked for.
 */
export function openErrorFromNotification(errorId: string) {
  const hasAccess = store.getters['accessControl/hasAccess'] as HasAccessFn | undefined;
  const canManage = typeof hasAccess === 'function' && hasAccess('customizable', EMT_PERMISSIONS.MODULE_ID, EMT_PERMISSIONS.SCOPE_ID, EMT_PERMISSIONS.PERMISSIONS.MANAGE_ERRORS);
  openErrorDetail(errorId, !canManage);
}

export function closeRightWindows() {
  getEventBus().emit(WEBAPPLICATION_EVENTS.EVENT_CLOSE_ALL_ADAPTIVE_WINDOWS, { Position: 'right' });
}
