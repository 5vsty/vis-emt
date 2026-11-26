import type { SEVERITIES, STATUSES } from '@/constants';

export interface ModuleConfig {
  /** Format: 0.0.0 */
  ModuleVersion: string;
  ModuleInstanceName?: string;
  ModuleInstanceNameTranslationKey?: string;
  Active: boolean;
  TranslationsPath?: string;
}

export type HasAccessFn = (type: string, moduleId: string, scopeId: string, permission: string) => boolean;

export type Severity = (typeof SEVERITIES)[number];
export type ErrorStatus = (typeof STATUSES)[number];

export interface ErrorCodeOption {
  ErrorCodeId: string;
  Code: string;
  Title: string;
  DefaultSeverity: Severity;
  Group: string | null;
  IsOther: boolean;
}

export interface ErrorCodeFull extends ErrorCodeOption {
  Description: string;
  Instructions: string;
  Active: boolean;
  Scope?: string;
  IsUsed: boolean;
  Version: number;
}

export interface LocationOption {
  LocationId: string;
  Path: string;
  Type: string;
}

export interface ErrorSummary {
  ErrorId: string;
  ErrorNumber: string;
  Number: number;
  Status: ErrorStatus;
  Severity: Severity;
  ErrorCodeId: string;
  ErrorCode: string;
  CodeTitle: string;
  LocationId: string;
  LocationPath: string;
  ReporterUserId: string;
  ReporterName: string;
  AssigneeUserId: string | null;
  AssigneeName: string | null;
  ReportedAt: number;
  LastChangedAt: number;
  FinalizedAt: number;
  Version: number;
  Description?: string;
}

export type ErrorEventType = 'Created' | 'StatusChanged' | 'Assigned' | 'SeverityChanged' | 'NoteAdded' | 'NotificationCreated' | 'NotificationRemoved' | 'NotificationFailed';

export interface ErrorEvent {
  /** Sequence number within the error (1, 2, 3, ...). */
  Seq: number;
  EventType: ErrorEventType;
  At: number;
  UserId?: string;
  UserName?: string;
  Text?: string;
  FromValue?: string;
  ToValue?: string;
}

export type ErrorAction = 'Acknowledge' | 'StartProgress' | 'Resolve' | 'Reopen' | 'Close' | 'Reject' | 'Cancel';

export interface ValidationError {
  Field: string;
  MessageKey: string;
}

export type Reason =
  | 'Forbidden'
  | 'NotFound'
  | 'ValidationFailed'
  | 'InvalidTransition'
  | 'FinalState'
  | 'Conflict'
  | 'NotReporter'
  | 'InvalidAssignee'
  | 'ErrorCodeInactive'
  | 'LocationNotFound'
  | 'CodeExists'
  | 'CodeLocked'
  | 'CodeInUse'
  | 'OtherCodeProtected'
  | 'Unavailable'
  | 'Internal';

export interface AssignableUser {
  UserId: string;
  DisplayName: string;
}
