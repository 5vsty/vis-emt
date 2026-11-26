<template>
  <div class="emt-page">
    <h5 class="title pb-05">{{ $translate('EMT_MENU_LIST') }}</h5>

    <section class="emt-overview" :aria-label="$translate('EMT_OVERVIEW')">
      <h6>{{ $translate('EMT_OVERVIEW') }}</h6>
      <p class="emt-placeholder">{{ $translate('EMT_OVERVIEW_PLACEHOLDER') }}</p>
    </section>

    <Table
      class="flexlog-table"
      :columns="columns"
      :rowHeight="48"
      :modelId="TABLES.ERROR_LIST"
      :defaultSorting="defaultSorting"
      :defaultFilter="defaultFilter"
      :CSVExport="false"
      scrollTarget="DynamicWindow"
      :selectRowCallback="selectRow"
      :deselectRowCallback="closeRightWindows"
      :deselectBeforeSelect="false"
    >
      <template v-for="slot of slots" :key="slot.keySelector" v-slot:[slot.keySelector]="{ objectId }">
        <div class="table-column">
          <span>{{ errorCellText(getObject(objectId)?.[slot.keySelector], slot.keySelector, translate) }}</span>
        </div>
      </template>

      <template #Button_Column="{ objectId }">
        <div class="table-column btn-column">
          <FlexButton type="Secondary" size="M" :label="false" icon-type="icon-pencil" :title="$translate('EMT_EDIT_ERROR')" :handle-click="editHandler(objectId)" />
          <FlexButton type="Secondary" size="M" :label="false" icon-type="icon-trash" :title="$translate('EMT_DELETE')" :handle-click="deleteHandler(objectId)" />
        </div>
      </template>
    </Table>
  </div>
</template>

<script setup lang="ts">
import { ref, type ComputedRef } from 'vue';
import { FlexButton } from '@fsdev/button';
import Table, { type Column, type DefaultFilter, type DefaultSorting } from '@fsdev/table';
import { OPEN_STATUSES, STATUSES, TABLES } from '@/constants';
import { mapGetters } from '@/stores/storeLib';
import { useTranslate } from '@/utils/format';
import { closeRightWindows, errorCellText, openErrorDetail } from '@/utils/errorTable';
import { confirmDeleteError } from '@/utils/confirmDelete';

const translate = useTranslate();

const { getObject } = mapGetters<{
  getObject: ComputedRef<(objectId: string) => Record<string, unknown>>;
}>('objectStore');

/** Table columns; the key selectors are the column names published by the backend (07 §2.4). */
const slots = [
  { keySelector: 'ErrorNumber' },
  { keySelector: 'ReportedAt' },
  { keySelector: 'LocationPath' },
  { keySelector: 'ErrorCode' },
  { keySelector: 'CodeTitle' },
  { keySelector: 'Severity' },
  { keySelector: 'Status' },
  { keySelector: 'ReporterName' },
  { keySelector: 'AssigneeName' },
];

const columns = ref<Column[]>([
  { name: 'EMT_COL_ERROR_NUMBER', slotName: 'ErrorNumber', sorting: { keySelector: 'Number' } },
  { name: 'EMT_COL_REPORTED_AT', slotName: 'ReportedAt', sorting: { keySelector: 'ReportedAt' } },
  { name: 'EMT_COL_LOCATION', slotName: 'LocationPath', sorting: { keySelector: 'LocationPath' } },
  { name: 'EMT_COL_ERROR_CODE', slotName: 'ErrorCode', sorting: { keySelector: 'ErrorCode' } },
  { name: 'EMT_COL_CODE_TITLE', slotName: 'CodeTitle', sorting: { keySelector: 'CodeTitle' } },
  { name: 'EMT_COL_SEVERITY', slotName: 'Severity', sorting: { keySelector: 'Severity' } },
  { name: 'EMT_COL_STATUS', slotName: 'Status', sorting: { keySelector: 'Status' }, filter: { type: 'Multiselect', keySelector: 'Status', values: [...STATUSES] } },
  { name: 'EMT_COL_REPORTER', slotName: 'ReporterName', sorting: { keySelector: 'ReporterName' } },
  { name: 'EMT_COL_ASSIGNEE', slotName: 'AssigneeName', sorting: { keySelector: 'AssigneeName' } },
  { name: '', slotName: 'Button_Column', sorting: false },
] as Column[]);

const defaultSorting: DefaultSorting = {
  columnName: 'EMT_COL_REPORTED_AT',
  direction: 'Descending',
};

/** Only unfinished errors are shown at first (FR-18). */
const defaultFilter: DefaultFilter = {
  columnName: 'Status',
  values: [...OPEN_STATUSES],
};

/** @fsdev/table calls this with (objectId, modelId); the row's object id is the error id (ManualDictTable key). */
function selectRow(objectId: string) {
  if (objectId) {
    openErrorDetail(objectId);
  }
}

/** FlexButton takes a handler, not a listener, so the click is stopped here — otherwise the row's selectRowCallback fires too. */
function editHandler(objectId: string) {
  return (event: MouseEvent) => {
    event.stopPropagation();
    openErrorDetail(objectId);
  };
}

/** The deleted error may still be open in the detail window, so that is closed too. */
function deleteHandler(objectId: string) {
  return (event: MouseEvent) => {
    event.stopPropagation();
    confirmDeleteError(objectId, closeRightWindows);
  };
}
</script>

<style scoped>
.emt-page {
  padding: 1rem;
}
.emt-overview {
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid rgba(128, 128, 128, 0.3);
}
.emt-placeholder {
  opacity: 0.7;
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
.btn-column {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
}
</style>
