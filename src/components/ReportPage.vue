<template>
  <div class="emt-page">
    <h5 class="title pb-05">{{ $translate('EMT_MENU_REPORT') }}</h5>

    <h6 class="pb-05">{{ $translate('EMT_MY_ERRORS') }}</h6>

    <!-- The backend gives every reporter an own table (AMF tables cannot filter rows per user); its model id comes with funcGetMyErrors. -->
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
      <template #headerButtons>
        <FlexButton class="add-button" type="Primary" size="M" icon-type="icon-plus" :text="$translate('EMT_REPORT_ERROR')" :handle-click="openForm" />
      </template>

      <template v-for="slot of slots" :key="slot.keySelector" v-slot:[slot.keySelector]="{ objectId }">
        <div class="table-column">
          <span>{{ errorCellText(getObject(objectId)?.[slot.keySelector], slot.keySelector, translate) }}</span>
        </div>
      </template>
    </Table>

    <ReportErrorForm v-if="formOpen" @close="formOpen = false" @submitted="formOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, type ComputedRef } from 'vue';
import { FlexButton } from '@fsdev/button';
import Table, { type Column, type DefaultSorting } from '@fsdev/table';
import { MESSAGE_ID } from '@/constants';
import { mapGetters } from '@/stores/storeLib';
import { sendRequest } from '@/utils/requests';
import { useTranslate } from '@/utils/format';
import { closeRightWindows, errorCellText, openErrorDetail } from '@/utils/errorTable';
import type { IFuncResponseGetMyErrors } from '@/messages/backendToFrontend';
import ReportErrorForm from './ReportErrorForm.vue';

const translate = useTranslate();

const { getObject } = mapGetters<{
  getObject: ComputedRef<(objectId: string) => Record<string, unknown>>;
}>('objectStore');

const tableModelId = ref('');
const formOpen = ref(false);

const slots = [{ keySelector: 'ErrorNumber' }, { keySelector: 'ReportedAt' }, { keySelector: 'ErrorCode' }, { keySelector: 'CodeTitle' }, { keySelector: 'LocationPath' }, { keySelector: 'Severity' }, { keySelector: 'Status' }];

const columns = ref<Column[]>([
  { name: 'EMT_COL_ERROR_NUMBER', slotName: 'ErrorNumber', sorting: { keySelector: 'Number' } },
  { name: 'EMT_COL_REPORTED_AT', slotName: 'ReportedAt', sorting: { keySelector: 'ReportedAt' } },
  { name: 'EMT_COL_ERROR_CODE', slotName: 'ErrorCode', sorting: { keySelector: 'ErrorCode' } },
  { name: 'EMT_COL_CODE_TITLE', slotName: 'CodeTitle', sorting: { keySelector: 'CodeTitle' } },
  { name: 'EMT_COL_LOCATION', slotName: 'LocationPath', sorting: { keySelector: 'LocationPath' } },
  { name: 'EMT_COL_SEVERITY', slotName: 'Severity', sorting: { keySelector: 'Severity' } },
  { name: 'EMT_COL_STATUS', slotName: 'Status', sorting: { keySelector: 'Status' } },
] as Column[]);

const defaultSorting: DefaultSorting = {
  columnName: 'EMT_COL_REPORTED_AT',
  direction: 'Descending',
};

/** Opens the user's table on the backend; from then on the backend keeps its rows up to date. */
async function openMyErrorsTable() {
  const response = await sendRequest<IFuncResponseGetMyErrors>({ ID: MESSAGE_ID.EMT, funcGetMyErrors: '', RequestId: '' });
  tableModelId.value = response.Successful === true ? (response.TableModelId ?? '') : '';
}

function openForm() {
  formOpen.value = true;
}

/** @fsdev/table calls this with (objectId, modelId); the reporter sees the own error read only (cancel only). */
function selectRow(objectId: string) {
  if (objectId) {
    openErrorDetail(objectId, true);
  }
}

onMounted(openMyErrorsTable);
</script>

<style scoped>
.emt-page {
  padding: 1rem;
}
.flexlog-table :deep(.table-header .header-row) {
  gap: 8px;
}
.add-button {
  flex-shrink: 0;
  white-space: nowrap;
}
.table-column {
  align-content: center;
  height: 100%;
  overflow: hidden;
  display: inline-block;
  text-overflow: ellipsis;
  width: 100%;
}
</style>
