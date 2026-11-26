<template>
  <section class="emt-detail" :aria-label="$translate('EMT_DETAIL')">
    <div class="col-100 form-horizontal">
      <h5 class="title pb-05">{{ $translate('EMT_DETAIL') }} {{ error?.ErrorNumber ?? '' }}</h5>
    </div>

    <template v-if="error !== undefined">
      <dl class="emt-facts">
        <dt>{{ $translate('EMT_COL_STATUS') }}</dt>
        <dd>{{ $translate('EMT_STATUS_' + error.Status) }}</dd>
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

      <div v-if="actionButtons.length > 0" class="emt-actions">
        <FlexButton v-for="action in actionButtons" :key="action" type="Secondary" size="M" :text="$translate('EMT_ACTION_' + action)" :state="busy ? 'Disabled' : 'Default'" :handle-click="() => startAction(action)" />
      </div>

      <div v-if="pendingAction !== null" class="emt-field">
        <label for="emt-action-text">{{ $translate('EMT_ACTION_TEXT') }} {{ textRequired ? '*' : '' }}</label>
        <textarea id="emt-action-text" v-model="actionText" rows="3" :aria-invalid="actionTextError !== ''"></textarea>
        <span v-if="actionTextError !== ''" class="emt-error">{{ actionTextError }}</span>
        <div class="emt-actions">
          <FlexButton type="Primary" size="M" :text="$translate('EMT_CONFIRM')" :state="busy ? 'Disabled' : 'Default'" :handle-click="confirmAction" />
          <FlexButton type="Secondary" size="M" :text="$translate('EMT_CANCEL')" :handle-click="cancelAction" />
        </div>
      </div>

      <div v-if="canEdit" class="emt-edit">
        <div class="emt-field">
          <label for="emt-assignee">{{ $translate('EMT_COL_ASSIGNEE') }}</label>
          <select id="emt-assignee" :value="error.AssigneeUserId ?? ''" :disabled="busy || !canAssign" @change="assign(($event.target as HTMLSelectElement).value)">
            <option value="">{{ $translate('EMT_UNASSIGNED') }}</option>
            <option v-for="user in assignableUsers" :key="user.UserId" :value="user.UserId">{{ user.DisplayName }}</option>
          </select>
        </div>

        <div class="emt-field">
          <label for="emt-severity">{{ $translate('EMT_COL_SEVERITY') }}</label>
          <select id="emt-severity" :value="error.Severity" :disabled="busy || isFinal" @change="changeSeverity(($event.target as HTMLSelectElement).value as Severity)">
            <option v-for="severity in SEVERITIES" :key="severity" :value="severity">{{ $translate('EMT_SEVERITY_' + severity) }}</option>
          </select>
        </div>

        <div v-if="!isFinal" class="emt-field">
          <label for="emt-note">{{ $translate('EMT_NOTE') }}</label>
          <textarea id="emt-note" v-model="noteText" rows="2"></textarea>
          <div class="emt-actions">
            <FlexButton type="Secondary" size="M" :text="$translate('EMT_ADD_NOTE')" :state="busy || noteText.trim() === '' ? 'Disabled' : 'Default'" :handle-click="addNote" />
          </div>
        </div>
      </div>

      <h6>{{ $translate('EMT_HISTORY') }}</h6>
      <ol class="emt-timeline">
        <li v-for="event in events" :key="event.Seq">
          <strong>{{ formatDateTime(event.At) }}</strong>
          {{ $translate('EMT_EVENT_' + event.EventType) }}
          <span v-if="event.UserName">({{ event.UserName }})</span>
          <span v-if="event.FromValue || event.ToValue">: {{ event.FromValue ?? '' }} &rarr; {{ event.ToValue ?? '' }}</span>
          <div v-if="event.Text" class="emt-pre">{{ event.Text }}</div>
        </li>
      </ol>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, type ComputedRef } from 'vue';
import { FlexButton } from '@fsdev/button';
import { EMT_PERMISSIONS, FINAL_STATUSES, MESSAGE_ID, SEVERITIES, STORE_KEY } from '@/constants';
import { mapGetters } from '@/stores/storeLib';
import { useHasPermission } from '@/composables/useHasAccess';
import { sendRequest } from '@/utils/requests';
import { formatDateTime, useTranslate } from '@/utils/format';
import type { IFuncErrorChanged, IFuncResponseChangeError, IFuncResponseGetAssignableUsers, IFuncResponseGetErrorDetail } from '@/messages/backendToFrontend';
import type { AssignableUser, ErrorAction, ErrorEvent, ErrorSummary, Severity } from '@/types';

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
  padding: 0 1rem 1rem;
}
.title {
  border-bottom: solid 1px var(--gray-dark);
}
.emt-facts {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.25rem 1rem;
}
.emt-facts dt {
  font-weight: bold;
}
.emt-facts dd {
  margin: 0;
}
.emt-pre {
  white-space: pre-wrap;
}
.emt-field {
  display: flex;
  flex-direction: column;
  margin: 0.75rem 0;
}
.emt-actions {
  display: flex;
  gap: 0.5rem;
  margin: 0.5rem 0;
}
.emt-timeline {
  padding-left: 1.2rem;
}
.emt-error {
  color: var(--color-error, #c62828);
}
</style>
