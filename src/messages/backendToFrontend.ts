import type { AssignableUser, ErrorAction, ErrorCodeFull, ErrorCodeOption, ErrorEvent, ErrorSummary, LocationOption, Reason, ValidationError } from '@/types';

interface ResponseBase {
  ID: string;
  Successful: boolean;
  Reason?: Reason;
  ValidationErrors?: ValidationError[];
}

export interface IFuncResponseGetReportFormData extends ResponseBase {
  funcResponseGetReportFormData: string;
  ErrorCodes?: ErrorCodeOption[];
  Locations?: LocationOption[];
  NoActiveCodes?: boolean;
  /** false = the backend does not read the facility structure; the form has no location field (config Location.Enabled). */
  LocationEnabled?: boolean;
}

export interface IFuncResponseSubmitError extends ResponseBase {
  funcResponseSubmitError: string;
  ErrorId?: string;
  ErrorNumber?: string;
  Duplicate?: boolean;
  NoManagersConfigured?: boolean;
}

export interface IFuncResponseGetMyErrors extends ResponseBase {
  funcResponseGetMyErrors: string;
  Errors?: ErrorSummary[];
  /** Model id of the user's own "my errors" table. */
  TableModelId?: string;
}

export interface IFuncResponseGetErrorDetail extends ResponseBase {
  funcResponseGetErrorDetail: string;
  Error?: ErrorSummary;
  Events?: ErrorEvent[];
  AllowedActions?: ErrorAction[];
  Archived?: boolean;
}

/** Shared response of cancel, status change, assign, severity change and note. */
export interface IFuncResponseChangeError extends ResponseBase {
  funcResponseChangeError: string;
  Error?: ErrorSummary;
  ConflictByName?: string;
}

export interface IFuncResponseGetAssignableUsers extends ResponseBase {
  funcResponseGetAssignableUsers: string;
  Users?: AssignableUser[];
}

export interface IFuncResponseGetErrorCodes extends ResponseBase {
  funcResponseGetErrorCodes: string;
  ErrorCodes?: ErrorCodeFull[];
}

export interface IFuncResponseSaveErrorCode extends ResponseBase {
  funcResponseSaveErrorCode: string;
  ErrorCode?: ErrorCodeFull;
}

export interface IFuncResponseDeleteErrorCode extends ResponseBase {
  funcResponseDeleteErrorCode: string;
}

export interface IFuncResponseDeleteError extends ResponseBase {
  funcResponseDeleteError: string;
}

export interface IFuncErrorChanged {
  ID: string;
  funcErrorChanged: unknown;
  ErrorId: string;
  ChangeType: 'Created' | 'Updated' | 'Deleted';
  Error?: ErrorSummary;
}

/** The "Open" button of a notification: open the detail of the error (07 addendum). */
export interface IFuncOpenError {
  ID: string;
  funcOpenError: unknown;
  ErrorId: string;
}

export interface IFuncErrorCodesChanged {
  ID: string;
  funcErrorCodesChanged: unknown;
}

export type backendToFrontendMessage =
  | IFuncResponseGetReportFormData
  | IFuncResponseSubmitError
  | IFuncResponseGetMyErrors
  | IFuncResponseGetErrorDetail
  | IFuncResponseChangeError
  | IFuncResponseGetAssignableUsers
  | IFuncResponseGetErrorCodes
  | IFuncResponseSaveErrorCode
  | IFuncResponseDeleteErrorCode
  | IFuncResponseDeleteError
  | IFuncErrorChanged
  | IFuncOpenError
  | IFuncErrorCodesChanged;

export function isFuncErrorChanged(msg: backendToFrontendMessage): msg is IFuncErrorChanged {
  return (msg as IFuncErrorChanged).funcErrorChanged !== undefined;
}

export function isFuncOpenError(msg: backendToFrontendMessage): msg is IFuncOpenError {
  return (msg as IFuncOpenError).funcOpenError !== undefined;
}

export function isFuncErrorCodesChanged(msg: backendToFrontendMessage): msg is IFuncErrorCodesChanged {
  return (msg as IFuncErrorCodesChanged).funcErrorCodesChanged !== undefined;
}

/** Name of the response key for a request key; all change-style requests share one response. */
const CHANGE_REQUESTS = ['funcCancelError', 'funcChangeErrorStatus', 'funcAssignError', 'funcChangeErrorSeverity', 'funcAddErrorNote'];

export function getResponseKey(requestKey: string): string {
  if (CHANGE_REQUESTS.includes(requestKey)) {
    return 'funcResponseChangeError';
  }
  return requestKey.replace(/^func/, 'funcResponse');
}
