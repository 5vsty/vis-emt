export const APP_NAME = 'Emt';

export const STORE_KEY = 'plugins.emt.objectStore';

export const MESSAGE_ID = {
  EMT: '33d46b35-cf3a-4ab4-aa07-d3f58cfe5d7f',
} as const;

export const EMT_PERMISSIONS = {
  MODULE_ID: '33d46b35-cf3a-4ab4-aa07-d3f58cfe5d7f',
  SCOPE_ID: 'b3c5933c-a4c0-4bdc-ba61-518f6041a89b',
  PERMISSIONS: {
    REPORT_ERRORS: 'Report-Errors',
    MANAGE_ERRORS: 'Manage-Errors',
    MANAGE_CATALOG: 'Manage-Catalog',
  },
};

export const TABLES = {
  ERROR_LIST: '997b9483-d628-4135-a81e-5df70cc2caf2',
  ERROR_CODES: '8a8eb2f7-3280-4066-8a4a-676ea5ff6115',
};

export const CATALOG = {
  OTHER_CODE_ID: '41339cce-e950-4bfd-b0dc-5644892ebd71',
};

export const MENU = {
  MAIN: '4a21b4e1-8823-46b6-88ad-e00ea428e64d',
  REPORT: '2f9db9cc-c339-4bfc-a5df-0c40452007c2',
  LIST: 'e20c9e0d-05f7-4765-8c68-a6d05cb3c542',
  /** Settings > EMT: parent entry and the error code catalog below it. */
  SETTINGS: '6448bd9f-3466-4099-86ca-c82e4907467f',
  CATALOG: '6bb43e4d-93be-4ed0-bc9d-4ae2402a0e41',
};

export const COMPONENT = {
  REPORT: '3dc96b9e-ed8a-4999-8462-cf7c58c5a4c5',
  LIST: '94af12b9-0ea1-458d-b63a-35d4cf17baf9',
  CATALOG: '0ac5368f-d24c-4cc9-b356-f65572ae8f56',
  ERROR_DETAIL: 'f3485f7c-8f57-4353-bd12-9eb7c0bd8469',
  CODE_EDITOR: 'f918fb68-053b-4c32-80bc-9c394c14679c',
};

export const ADAPTIVE_WINDOW = {
  /** Create/edit/delete one error code, opened from the catalog. */
  CODE_EDITOR: 'eebc5fe8-8bd5-40e5-94c5-9a32b9abedd2',
  /** Detail of one error (status actions, assignee, notes), opened from the error list and the report page. */
  ERROR_DETAIL: 'b6c8cd5d-4c1f-4fdb-918c-e446060d4882',
};

export const WEBAPPLICATION_EVENTS = {
  EVENT_ADAPTIVE_WINDOW: 'EVENT_ADAPTIVE_WINDOW',
  EVENT_CLOSE_ALL_ADAPTIVE_WINDOWS: 'EVENT_CLOSE_ALL_ADAPTIVE_WINDOWS',
};

export const TRANSLATION_EVENTS = {
  EVENT_ADD_MODULE_TRANSLATIONS: 'EVENT_ADD_MODULE_TRANSLATIONS',
};

/** Request timeout in milliseconds. */
export const REQUEST_TIMEOUT_MS = 15000;

export const SEVERITIES = ['Info', 'Warning', 'Error', 'Critical'] as const;

export const STATUSES = ['NEW', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED', 'CANCELLED'] as const;

/** Status values that count as "not finished" for the default list filter. */
export const OPEN_STATUSES = ['NEW', 'ACKNOWLEDGED', 'IN_PROGRESS'] as const;

export const FINAL_STATUSES = ['CLOSED', 'REJECTED', 'CANCELLED'] as const;

export const MAX_DESCRIPTION_LENGTH = 2000;
