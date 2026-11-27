<template>
  <div class="emt-page">
    <!-- Always rendered so that a screen reader announces the text when it changes. -->
    <div class="emt-notice" :class="notice ? `emt-notice--${notice.kind}` : ''" role="status" aria-live="polite">{{ notice?.text ?? '' }}</div>

    <p v-if="loadState === 'loading'" class="emt-state">{{ $translate('EMT_REPORT_SENDING') }}</p>

    <div v-else-if="loadState === 'failed'" class="emt-state" role="alert">
      <p>{{ $translate('EMT_REASON_Unavailable') }}</p>
      <FlexButton type="Primary" size="M" :icon="false" :text="$translate('EMT_RETRY')" :handle-click="loadAll" />
    </div>

    <template v-else>
      <div v-if="locationEnabled" class="emt-location">
        <label for="emt-report-location">{{ $translate('EMT_COL_LOCATION') }}</label>
        <select id="emt-report-location" ref="locationSelect" v-model="locationId">
          <option value="" disabled>{{ $translate('EMT_SELECT_PLACEHOLDER') }}</option>
          <option v-for="location in locations" :key="location.LocationId" :value="location.LocationId">{{ location.Path }}</option>
        </select>
      </div>

      <p v-if="codes.length === 0" class="emt-state">{{ $translate('EMT_REPORT_NO_CODES') }}</p>
      <ErrorCodeGrid v-else :codes="codes" :status-by-code="statusByCode" :status-labels="statusLabels" :busy-code-id="busyCodeId" :busy-label="$translate('EMT_REPORT_SENDING')" @select="onSelect" />
    </template>

    <h6 v-if="!embedded" class="emt-my-errors pb-05">{{ $translate('EMT_MY_ERRORS') }}</h6>

    <!-- The backend gives every reporter an own table (AMF tables cannot filter rows per user); its model id comes with funcGetMyErrors. -->
    <div v-if="!embedded" class="emt-table-scroll">
      <Table
        v-if="tableModelId !== ''"
        class="flexlog-table"
        :columns="columns"
        :rowHeight="48"
        :modelId="tableModelId"
        :defaultSorting="defaultSorting"
        :CSVExport="false"
        scrollTarget="DynamicWindow"
        :selectRowCallback="selectRow"
        :deselectRowCallback="closeRightWindows"
        :deselectBeforeSelect="false"
      >
        <template v-for="slot of slots" :key="slot.keySelector" v-slot:[slot.keySelector]="{ objectId }">
          <div class="table-column">
            <StatusTag v-if="slot.keySelector === 'Status' && getObject(objectId)?.Status" :status="String(getObject(objectId)?.Status)" :label="errorCellText(getObject(objectId)?.Status, 'Status', translate)" />
          <span v-else>{{ errorCellText(getObject(objectId)?.[slot.keySelector], slot.keySelector, translate) }}</span>
          </div>
        </template>
      </Table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type ComputedRef } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { FlexButton } from '@fsdev/button';
import Table, { type Column, type DefaultSorting } from '@fsdev/table';
import { MESSAGE_ID, STORE_KEY } from '@/constants';
import { mapGetters } from '@/stores/storeLib';
import { sendRequest } from '@/utils/requests';
import { useTranslate } from '@/utils/format';
import StatusTag from './StatusTag.vue';
import { closeRightWindows, errorCellText, errorColumnFilter, openErrorDetail, openErrorFromNotification } from '@/utils/errorTable';
import { fillPlaceholders, gridCodes, latestStatusByCode, loadStoredLocation, openErrorsByCode, storeLocation, TILE_STATUSES } from '@/utils/errorCodeGrid';
import type { IFuncResponseGetMyErrors, IFuncResponseGetReportFormData, IFuncResponseSubmitError } from '@/messages/backendToFrontend';
import type { ErrorCodeOption, ErrorSummary, LocationOption } from '@/types';
import ErrorCodeGrid from './ErrorCodeGrid.vue';

/** How often the own errors are read again; the backend pushes changes only into the table below the grid. */
const REFRESH_INTERVAL_MS = 5000;
/** How long a result text stays on the screen. */
const NOTICE_MS = 8000;

/** `embedded`: shown in the report window next to another screen, without the table of the own errors. */
withDefaults(defineProps<{ embedded?: boolean }>(), { embedded: false });

const translate = useTranslate();

const { getObject } = mapGetters<{
  getObject: ComputedRef<(objectId: string) => Record<string, unknown>>;
}>('objectStore');

/** Counts the pushes of the backend about changed errors; the tiles are read again at once when it changes. */
const { getErrorsVersion } = mapGetters<{ getErrorsVersion: ComputedRef<number> }>(STORE_KEY);

type LoadState = 'loading' | 'ready' | 'failed';

const loadState = ref<LoadState>('loading');
const codes = ref<ErrorCodeOption[]>([]);
const locations = ref<LocationOption[]>([]);
const locationEnabled = ref(false);
const locationId = ref('');
const locationSelect = ref<HTMLSelectElement | null>(null);
const myErrors = ref<ErrorSummary[]>([]);
const tableModelId = ref('');
const busyCodeId = ref<string | null>(null);
const notice = ref<{ kind: 'success' | 'info' | 'error'; text: string } | null>(null);

/** A request id is reused for the same code until the backend answered, so that a tap repeated after a lost answer is not a second error. */
const pendingRequestIds = new Map<string, string>();
let noticeTimer: ReturnType<typeof setTimeout> | undefined;
let refreshTimer: ReturnType<typeof setInterval> | undefined;

const openByCode = computed(() => openErrorsByCode(myErrors.value, locationEnabled.value && locationId.value !== '' ? locationId.value : null));
const statusByCode = computed(() => latestStatusByCode(myErrors.value, locationEnabled.value && locationId.value !== '' ? locationId.value : null));
const statusLabels = computed(() => Object.fromEntries(TILE_STATUSES.map((status) => [status, translate('EMT_STATUS_' + status)])));

const slots = [{ keySelector: 'ErrorNumber' }, { keySelector: 'ReportedAt' }, { keySelector: 'ErrorCode' }, { keySelector: 'CodeTitle' }, { keySelector: 'LocationPath' }, { keySelector: 'Severity' }, { keySelector: 'Status' }];

/** Every column has a filter, like in the error list. */
const columns = computed(
  () =>
    [
      { name: 'EMT_COL_ERROR_NUMBER', slotName: 'ErrorNumber', sorting: { keySelector: 'Number' }, filter: errorColumnFilter('ErrorNumber', translate) },
      { name: 'EMT_COL_REPORTED_AT', slotName: 'ReportedAt', sorting: { keySelector: 'ReportedAt' }, filter: errorColumnFilter('ReportedAt', translate) },
      { name: 'EMT_COL_ERROR_CODE', slotName: 'ErrorCode', sorting: { keySelector: 'ErrorCode' }, filter: errorColumnFilter('ErrorCode', translate) },
      { name: 'EMT_COL_CODE_TITLE', slotName: 'CodeTitle', sorting: { keySelector: 'CodeTitle' }, filter: errorColumnFilter('CodeTitle', translate) },
      { name: 'EMT_COL_LOCATION', slotName: 'LocationPath', sorting: { keySelector: 'LocationPath' }, filter: errorColumnFilter('LocationPath', translate) },
      { name: 'EMT_COL_SEVERITY', slotName: 'Severity', sorting: { keySelector: 'Severity' }, filter: errorColumnFilter('Severity', translate) },
      { name: 'EMT_COL_STATUS', slotName: 'Status', sorting: { keySelector: 'Status' }, filter: errorColumnFilter('Status', translate) },
    ] as Column[],
);

const defaultSorting: DefaultSorting = {
  columnName: 'EMT_COL_REPORTED_AT',
  direction: 'Descending',
};

function showNotice(kind: 'success' | 'info' | 'error', text: string) {
  notice.value = { kind, text };
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => (notice.value = null), NOTICE_MS);
}

async function loadFormData(): Promise<boolean> {
  const response = await sendRequest<IFuncResponseGetReportFormData>({ ID: MESSAGE_ID.EMT, funcGetReportFormData: '', RequestId: '' });
  if (response.Successful !== true) {
    return false;
  }
  codes.value = gridCodes(response.ErrorCodes ?? []);
  locations.value = response.Locations ?? [];
  locationEnabled.value = response.LocationEnabled !== false;
  if (locationEnabled.value && !locations.value.some((location) => location.LocationId === locationId.value)) {
    const stored = loadStoredLocation();
    locationId.value = locations.value.some((location) => location.LocationId === stored) ? stored : '';
  }
  return true;
}

/** Reads the own errors (to highlight the tiles) and opens the own errors table on the backend. */
async function loadMyErrors(): Promise<boolean> {
  const response = await sendRequest<IFuncResponseGetMyErrors>({ ID: MESSAGE_ID.EMT, funcGetMyErrors: '', RequestId: '' });
  if (response.Successful !== true) {
    return false;
  }
  myErrors.value = response.Errors ?? [];
  tableModelId.value = response.TableModelId ?? tableModelId.value;
  return true;
}

async function loadAll() {
  loadState.value = 'loading';
  const [formOk, errorsOk] = await Promise.all([loadFormData(), loadMyErrors()]);
  loadState.value = formOk && errorsOk ? 'ready' : 'failed';
}

async function refreshQuietly() {
  if (loadState.value === 'ready' && busyCodeId.value === null && document.visibilityState !== 'hidden') {
    await loadMyErrors();
  }
}

/** One tap on a tile reports the error: no description, no confirmation. */
async function onSelect(code: ErrorCodeOption) {
  if (busyCodeId.value !== null) {
    return;
  }

  // the problem is already reported: a tap opens the newest error of it, to look at it again, instead of saying "already reported"
  const open = openByCode.value.get(code.ErrorCodeId);
  if (open !== undefined) {
    openErrorFromNotification(open.ErrorId);
    return;
  }

  if (locationEnabled.value && locationId.value === '') {
    showNotice('error', translate('EMT_REPORT_PICK_LOCATION'));
    locationSelect.value?.focus();
    return;
  }

  const requestId = pendingRequestIds.get(code.ErrorCodeId) ?? uuidv4();
  pendingRequestIds.set(code.ErrorCodeId, requestId);
  busyCodeId.value = code.ErrorCodeId;

  const response = await sendRequest<IFuncResponseSubmitError>({
    ID: MESSAGE_ID.EMT,
    funcSubmitError: '',
    ClientRequestId: requestId,
    ...(locationEnabled.value ? { LocationId: locationId.value } : {}),
    ErrorCodeId: code.ErrorCodeId,
  });
  busyCodeId.value = null;

  if (response.Successful === true) {
    pendingRequestIds.delete(code.ErrorCodeId);
    const key = response.Duplicate === true ? 'EMT_REPORT_ALREADY' : 'EMT_REPORT_SENT';
    showNotice('success', fillPlaceholders(translate(key), { ErrorNumber: response.ErrorNumber ?? '' }));
    await loadMyErrors();
    return;
  }

  if (response.Reason === 'ErrorCodeInactive') {
    pendingRequestIds.delete(code.ErrorCodeId);
    await loadFormData();
  }
  showNotice('error', response.Reason === undefined || response.Reason === 'Unavailable' ? translate('EMT_REPORT_FAILED') : translate('EMT_REASON_' + response.Reason));
}

/** @fsdev/table calls this with (objectId, modelId); the reporter sees the own error read only (cancel only). */
function selectRow(objectId: string) {
  if (objectId) {
    openErrorDetail(objectId, true);
  }
}

watch(getErrorsVersion, () => {
  if (loadState.value === 'ready') {
    void loadMyErrors();
  }
});

watch(locationId, (value) => {
  if (value !== '') {
    storeLocation(value);
  }
});

onMounted(() => {
  void loadAll();
  refreshTimer = setInterval(() => void refreshQuietly(), REFRESH_INTERVAL_MS);
  document.addEventListener('visibilitychange', onVisibilityChange);
});

onBeforeUnmount(() => {
  clearInterval(refreshTimer);
  clearTimeout(noticeTimer);
  document.removeEventListener('visibilitychange', onVisibilityChange);
});

function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    void refreshQuietly();
  }
}
</script>

<style scoped>
.emt-page {
  padding: 1rem;
}

.emt-notice {
  min-height: 2.5rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-weight: 600;
}

.emt-notice:empty {
  visibility: hidden;
}

.emt-notice--success {
  background: #e3f1c8;
  color: #1a1a1a;
}

.emt-notice--info {
  background: #dbe8fb;
  color: #1a1a1a;
}

.emt-notice--error {
  background: #fbdcdc;
  color: #7a1010;
}

.emt-state {
  margin: 1rem 0;
}

.emt-location {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-width: 28rem;
  margin-bottom: 1rem;
}

.emt-location select {
  min-height: 2.75rem;
  font-size: 1rem;
}

.emt-my-errors {
  margin-top: 1.5rem;
}

/* A phone is too narrow for all table columns: the table scrolls sideways instead of breaking the page. */
.emt-table-scroll {
  overflow-x: auto;
}

.flexlog-table :deep(.table-header .header-row) {
  gap: 8px;
}

.table-column {
  align-content: center;
  height: 100%;
  overflow: hidden;
  display: inline-block;
  text-overflow: ellipsis;
  width: 100%;
}

@media (max-width: 519px) {
  .emt-page {
    padding: 0.5rem;
  }

  .emt-table-scroll :deep(.flexlog-table) {
    min-width: 40rem;
  }
}
</style>
