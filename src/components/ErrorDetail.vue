<template>
  <div class="emt-detail" :aria-label="$translate('EMT_DETAIL')">
    <div class="emt-detail__body">
      <div class="col-100 form-horizontal">
        <h5 class="px-6 window-title">{{ $translate('EMT_DETAIL') }} {{ error?.ErrorNumber ?? '' }}</h5>
        <div class="title pb-05"></div>
      </div>

      <template v-if="error !== undefined">
        <FlexBox :label="$translate('EMT_SECTION_GENERAL')" :initial-expanded="true">
          <dl class="emt-facts">
            <dt>{{ $translate('EMT_COL_STATUS') }}</dt>
            <dd><StatusTag :status="error.Status" :label="$translate('EMT_STATUS_' + error.Status)" /></dd>
            <dt>{{ $translate('EMT_COL_SEVERITY') }}</dt>
            <dd>{{ $translate('EMT_SEVERITY_' + error.Severity) }}</dd>
            <dt>{{ $translate('EMT_COL_ERROR_CODE') }}</dt>
            <dd>{{ error.ErrorCode }} - {{ error.CodeTitle }}</dd>
            <template v-if="error.LocationPath">
              <dt>{{ $translate('EMT_COL_LOCATION') }}</dt>
              <dd>{{ error.LocationPath }}</dd>
            </template>
            <dt>{{ $translate('EMT_COL_REPORTER') }}</dt>
            <dd>{{ error.ReporterName }}</dd>
            <dt>{{ $translate('EMT_COL_ASSIGNEE') }}</dt>
            <dd>{{ error.AssigneeName || '-' }}</dd>
            <dt>{{ $translate('EMT_COL_REPORTED_AT') }}</dt>
            <dd>{{ formatDateTime(error.ReportedAt) }}</dd>
            <dt>{{ $translate('EMT_DESCRIPTION') }}</dt>
            <dd class="emt-pre">{{ error.Description || '-' }}</dd>
          </dl>
        </FlexBox>

        <FlexBox v-if="hasProcessing" :label="$translate('EMT_SECTION_PROCESSING')" :initial-expanded="true">
          <div class="emt-section">
            <div v-if="actionButtons.length > 0" class="emt-actions">
              <FlexButton v-for="action in actionButtons" :key="action" type="Secondary" size="M" :icon="false" :text="$translate('EMT_ACTION_' + action)" :state="busy ? 'Disabled' : 'Default'" :handle-click="() => startAction(action)" />
            </div>

            <div v-if="pendingAction !== null" class="emt-field">
              <label for="emt-action-text">{{ $translate('EMT_ACTION_TEXT') }} {{ textRequired ? '*' : '' }}</label>
              <textarea id="emt-action-text" v-model="actionText" rows="3" :aria-invalid="actionTextError !== ''"></textarea>
              <span v-if="actionTextError !== ''" class="emt-error">{{ actionTextError }}</span>
              <div class="emt-actions">
                <FlexButton type="Primary" size="M" :icon="false" :text="$translate('EMT_CONFIRM')" :state="busy ? 'Disabled' : 'Default'" :handle-click="confirmAction" />
                <FlexButton type="Secondary" size="M" :icon="false" :text="$translate('EMT_CANCEL')" :handle-click="cancelAction" />
              </div>
            </div>

            <template v-if="canEdit">
              <FlexInput
                control-type="select"
                :model-value="error.AssigneeUserId ?? ''"
                :options="assigneeOptions"
                :label="$translate('EMT_COL_ASSIGNEE')"
                :disabled="busy || !canAssign"
                @update:model-value="assign(String($event ?? ''))"
              />

              <FlexInput
                control-type="select"
                :model-value="error.Severity"
                :options="severityOptions"
                :label="$translate('EMT_COL_SEVERITY')"
                :disabled="busy || isFinal"
                @update:model-value="changeSeverity(String($event ?? '') as Severity)"
              />

              <!-- @fsdev/input has no multi-line control, so the note stays a textarea. -->
              <div v-if="!isFinal" class="emt-field">
                <label for="emt-note">{{ $translate('EMT_NOTE') }}</label>
                <textarea id="emt-note" v-model="noteText" rows="2"></textarea>
                <div class="emt-actions">
                  <FlexButton type="Secondary" size="M" :icon="false" :text="$translate('EMT_ADD_NOTE')" :state="busy || noteText.trim() === '' ? 'Disabled' : 'Default'" :handle-click="addNote" />
                </div>
              </div>
            </template>
          </div>
        </FlexBox>

        <!-- Closed at first: a long history must not push the rest out of the window. -->
        <FlexBox :label="$translate('EMT_HISTORY')" :initial-expanded="false">
          <div v-if="eventsNewestFirst.length > 0" class="emt-history">
            <div v-for="event in eventsNewestFirst" :key="event.Seq" class="emt-history__item">
              <div class="emt-history__header">
                <span class="emt-history__date">{{ formatDateTime(event.At) }}</span>
                <span v-if="event.UserName" class="emt-history__user">{{ event.UserName }}</span>
              </div>
              <div class="emt-history__event">{{ $translate('EMT_EVENT_' + event.EventType) }}</div>
              <div v-if="event.FromValue || event.ToValue" class="emt-history__change">
                <span class="emt-history__new">{{ event.ToValue ?? '' }}</span>
                <span class="emt-history__old">{{ event.FromValue ?? '' }}</span>
              </div>
              <div v-if="event.Text" class="emt-history__text emt-pre">{{ event.Text }}</div>
            </div>
          </div>
        </FlexBox>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, type ComputedRef } from 'vue';
import { FlexBox } from '@fsdev/box';
import { FlexButton } from '@fsdev/button';
import { FlexInput } from '@fsdev/input';
import { EMT_PERMISSIONS, FINAL_STATUSES, MESSAGE_ID, SEVERITIES, STORE_KEY } from '@/constants';
import { mapGetters } from '@/stores/storeLib';
import { useHasPermission } from '@/composables/useHasAccess';
import { sendRequest } from '@/utils/requests';
import { formatDateTime, useTranslate } from '@/utils/format';
import type { IFuncErrorChanged, IFuncResponseChangeError, IFuncResponseGetAssignableUsers, IFuncResponseGetErrorDetail } from '@/messages/backendToFrontend';
import type { AssignableUser, ErrorAction, ErrorEvent, ErrorSummary, Severity } from '@/types';
import StatusTag from './StatusTag.vue';

/** Opened as adaptive window from the error list and the report page; the props are the window's Options. */
const props = withDefaults(
  defineProps<{
    errorId?: string;
    /** Reporter view: only the cancel action is offered, no editing. */
    readOnly?: boolean;
  }>(),
  { errorId: '', readOnly: false },
);

const translate = useTranslate();
const canManage = useHasPermission(EMT_PERMISSIONS.PERMISSIONS.MANAGE_ERRORS);

/** The last push about a changed error (somebody else changed it, or an action of this window came back). */
const { getLastErrorChanged } = mapGetters<{ getLastErrorChanged: ComputedRef<IFuncErrorChanged | null> }>(STORE_KEY);

const error = ref<ErrorSummary>();
const events = ref<ErrorEvent[]>([]);
const allowedActions = ref<ErrorAction[]>([]);
const assignableUsers = ref<AssignableUser[]>([]);

const busy = ref(false);
/** Field error under the action text (required for some actions). */
const actionTextError = ref('');
const pendingAction = ref<ErrorAction | null>(null);
const actionText = ref('');
const noteText = ref('');

const TEXT_REQUIRED: ErrorAction[] = ['Resolve', 'Reopen', 'Reject', 'Cancel'];

const isFinal = computed(() => error.value !== undefined && (FINAL_STATUSES as readonly string[]).includes(error.value.Status));
const canEdit = computed(() => !props.readOnly && canManage.value && !isFinal.value);
const canAssign = computed(() => error.value !== undefined && ['NEW', 'ACKNOWLEDGED', 'IN_PROGRESS'].includes(error.value.Status));
const textRequired = computed(() => pendingAction.value !== null && TEXT_REQUIRED.includes(pendingAction.value));
const actionButtons = computed(() => allowedActions.value.filter((action) => (props.readOnly ? action === 'Cancel' : true)));

const assigneeOptions = computed(() => [{ value: '', name: translate('EMT_UNASSIGNED') }, ...assignableUsers.value.map((user) => ({ value: user.UserId, name: user.DisplayName }))]);
const severityOptions = computed(() => SEVERITIES.map((severity) => ({ value: severity, name: translate('EMT_SEVERITY_' + severity) })));
/** The newest entry first: the history is for looking back, what happened last is what one wants to see. */
const eventsNewestFirst = computed(() => [...events.value].sort((a, b) => b.At - a.At || b.Seq - a.Seq));
const hasProcessing = computed(() => actionButtons.value.length > 0 || canEdit.value || pendingAction.value !== null);

async function load() {
  if (props.errorId === '') {
    return;
  }
  const response = await sendRequest<IFuncResponseGetErrorDetail>({ ID: MESSAGE_ID.EMT, funcGetErrorDetail: '', ErrorId: props.errorId });
  if (response.Successful === true && response.Error !== undefined) {
    error.value = response.Error;
    events.value = response.Events ?? [];
    allowedActions.value = response.AllowedActions ?? [];
  }

  if (canEdit.value && assignableUsers.value.length === 0) {
    const users = await sendRequest<IFuncResponseGetAssignableUsers>({ ID: MESSAGE_ID.EMT, funcGetAssignableUsers: '', RequestId: '' });
    assignableUsers.value = users.Users ?? [];
  }
}

/** Applies the shared change response at once, then reloads the detail (timeline, allowed actions); on a version conflict it is only reloaded. */
async function applyChange(response: IFuncResponseChangeError) {
  if (response.Successful === true) {
    if (response.Error !== undefined && response.Error.ErrorId === props.errorId) {
      error.value = response.Error;
    }
    await load();
    return;
  }
  if (response.Reason === 'Conflict') {
    await load();
  }
}

function startAction(action: ErrorAction) {
  actionTextError.value = '';
  actionText.value = '';
  if (TEXT_REQUIRED.includes(action)) {
    pendingAction.value = action;
    return;
  }
  void runAction(action, '');
}

function cancelAction() {
  pendingAction.value = null;
  actionText.value = '';
}

async function confirmAction() {
  const action = pendingAction.value;
  if (action === null) {
    return;
  }
  if (textRequired.value && actionText.value.trim() === '') {
    actionTextError.value = translate('EMT_VALIDATION_REQUIRED');
    return;
  }
  await runAction(action, actionText.value.trim());
}

async function runAction(action: ErrorAction, text: string) {
  if (error.value === undefined || busy.value) {
    return;
  }
  busy.value = true;
  const response =
    action === 'Cancel'
      ? await sendRequest<IFuncResponseChangeError>({ ID: MESSAGE_ID.EMT, funcCancelError: '', ErrorId: error.value.ErrorId, ExpectedVersion: error.value.Version, Text: text })
      : await sendRequest<IFuncResponseChangeError>({
          ID: MESSAGE_ID.EMT,
          funcChangeErrorStatus: '',
          ErrorId: error.value.ErrorId,
          Action: action,
          ExpectedVersion: error.value.Version,
          ...(text !== '' ? { Text: text } : {}),
        });
  busy.value = false;
  pendingAction.value = null;
  actionText.value = '';
  await applyChange(response);
}

async function assign(userId: string) {
  if (error.value === undefined || busy.value) {
    return;
  }
  busy.value = true;
  const response = await sendRequest<IFuncResponseChangeError>({
    ID: MESSAGE_ID.EMT,
    funcAssignError: '',
    ErrorId: error.value.ErrorId,
    AssigneeUserId: userId === '' ? null : userId,
    ExpectedVersion: error.value.Version,
  });
  busy.value = false;
  await applyChange(response);
}

async function changeSeverity(severity: Severity) {
  if (error.value === undefined || busy.value) {
    return;
  }
  busy.value = true;
  const response = await sendRequest<IFuncResponseChangeError>({
    ID: MESSAGE_ID.EMT,
    funcChangeErrorSeverity: '',
    ErrorId: error.value.ErrorId,
    Severity: severity,
    ExpectedVersion: error.value.Version,
  });
  busy.value = false;
  await applyChange(response);
}

async function addNote() {
  if (error.value === undefined || busy.value || noteText.value.trim() === '') {
    return;
  }
  busy.value = true;
  const response = await sendRequest<IFuncResponseChangeError>({ ID: MESSAGE_ID.EMT, funcAddErrorNote: '', ErrorId: error.value.ErrorId, Text: noteText.value.trim() });
  busy.value = false;
  if (response.Successful === true) {
    noteText.value = '';
  }
  await applyChange(response);
}

onMounted(load);

// A change of the shown error by somebody else (assignee, status, note) shows up without closing and opening the window.
watch(getLastErrorChanged, (change) => {
  if (change !== null && change.ErrorId === props.errorId) {
    void load();
  }
});
watch(
  () => props.errorId,
  () => {
    pendingAction.value = null;
    void load();
  },
);
</script>

<style scoped>
.emt-detail {
  display: flex;
  flex-direction: column;
  padding-bottom: 1rem;
}
.emt-detail__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.px-6 {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}
/* Keeps the title clear of the back button of the adaptive window. */
.window-title {
  padding-left: 1.75rem;
}
.pb-05 {
  padding-bottom: 0.25rem;
}
.emt-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.emt-facts {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 0.5rem 1rem;
  margin: 0;
}
.emt-facts dt {
  font-weight: 500;
  color: var(--text-placeholder);
}
.emt-facts dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.emt-pre {
  white-space: pre-wrap;
}
.emt-field {
  display: flex;
  flex-direction: column;
  margin: 0.25rem 0;
}
.emt-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.25rem 0;
}
.emt-error {
  color: var(--error-color, #c62828);
}

/* The history looks like the one of the device manager (LogHistory). */
.emt-history {
  display: flex;
  flex-direction: column;
}
.emt-history__item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 1px solid var(--outline);
}
.emt-history__item:last-child {
  border-bottom: none;
}
.emt-history__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.emt-history__date {
  font-size: 13.3px;
  color: var(--text-placeholder);
}
.emt-history__user {
  height: 24px;
  display: inline-flex;
  align-items: center;
  background: var(--background-inverted);
  padding: 0 8px;
  border-radius: 4px;
  font-size: 13.3px;
  color: var(--text-placeholder);
  white-space: nowrap;
  letter-spacing: 0.2px;
}
.emt-history__event {
  font-weight: 500;
  font-size: 14px;
  color: var(--text-body, #343437);
  letter-spacing: 0.2px;
}
.emt-history__change {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15.2px;
  letter-spacing: 0.2px;
}
.emt-history__new {
  font-weight: 500;
  color: var(--text-body);
}
.emt-history__old {
  color: var(--text-placeholder);
  text-decoration: line-through;
}
.emt-history__text {
  color: var(--text-placeholder, #888);
  font-size: 13.3px;
  overflow-wrap: anywhere;
}
</style>
