import type { ErrorAction, Severity } from '@/types';

const ID = '33d46b35-cf3a-4ab4-aa07-d3f58cfe5d7f';

export interface IFuncGetReportFormData {
  ID: typeof ID;
  funcGetReportFormData: string;
  /** Same value as the func key (07 §2.3 lists RequestId for this message). */
  RequestId: string;
}

export interface IFuncSubmitError {
  ID: typeof ID;
  funcSubmitError: string;
  ClientRequestId: string;
  /** Required unless the backend reported LocationEnabled = false. */
  LocationId?: string;
  ErrorCodeId: string;
  Description?: string;
}

export interface IFuncGetMyErrors {
  ID: typeof ID;
  funcGetMyErrors: string;
  /** Same value as the func key (07 §2.3 lists RequestId for this message). */
  RequestId: string;
}

export interface IFuncCancelError {
  ID: typeof ID;
  funcCancelError: string;
  ErrorId: string;
  ExpectedVersion: number;
  Text: string;
}

export interface IFuncDeleteError {
  ID: typeof ID;
  funcDeleteError: string;
  ErrorId: string;
}

export interface IFuncGetErrorDetail {
  ID: typeof ID;
  funcGetErrorDetail: string;
  ErrorId: string;
}

export interface IFuncChangeErrorStatus {
  ID: typeof ID;
  funcChangeErrorStatus: string;
  ErrorId: string;
  Action: ErrorAction;
  ExpectedVersion: number;
  Text?: string;
}

export interface IFuncAssignError {
  ID: typeof ID;
  funcAssignError: string;
  ErrorId: string;
  AssigneeUserId: string | null;
  ExpectedVersion: number;
}

export interface IFuncChangeErrorSeverity {
  ID: typeof ID;
  funcChangeErrorSeverity: string;
  ErrorId: string;
  Severity: Severity;
  ExpectedVersion: number;
}

export interface IFuncAddErrorNote {
  ID: typeof ID;
  funcAddErrorNote: string;
  ErrorId: string;
  Text: string;
}

export interface IFuncGetAssignableUsers {
  ID: typeof ID;
  funcGetAssignableUsers: string;
  /** Same value as the func key (07 §2.3 lists RequestId for this message). */
  RequestId: string;
}

export interface IFuncGetErrorCodes {
  ID: typeof ID;
  funcGetErrorCodes: string;
  /** Same value as the func key (07 §2.3 lists RequestId for this message). */
  RequestId: string;
}

export interface IFuncSaveErrorCode {
  ID: typeof ID;
  /** Request token, set by sendRequest. */
  funcSaveErrorCode: string;
  /** Id of the code to change; null creates a new code. */
  ErrorCodeId: string | null;
  ExpectedVersion: number | null;
  Code: string;
  Title: string;
  Description: string;
  Instructions: string;
  Group: string | null;
  DefaultSeverity: Severity;
  Active: boolean;
}

export interface IFuncDeleteErrorCode {
  ID: typeof ID;
  funcDeleteErrorCode: string;
  ErrorCodeId: string;
}

export type frontendToBackendMessage =
  | IFuncGetReportFormData
  | IFuncSubmitError
  | IFuncGetMyErrors
  | IFuncCancelError
  | IFuncDeleteError
  | IFuncGetErrorDetail
  | IFuncChangeErrorStatus
  | IFuncAssignError
  | IFuncChangeErrorSeverity
  | IFuncAddErrorNote
  | IFuncGetAssignableUsers
  | IFuncGetErrorCodes
  | IFuncSaveErrorCode
  | IFuncDeleteErrorCode;
