<template>
  <div class="emt-page">
    <h5 class="title pb-05">{{ $translate('EMT_MENU_CATALOG') }}</h5>

    <Table
      class="flexlog-table"
      :columns="columns"
      :rowHeight="48"
      :modelId="TABLES.ERROR_CODES"
      :defaultSorting="defaultSorting"
      :CSVExport="false"
      scrollTarget="DynamicWindow"
      :selectRowCallback="selectRow"
      :deselectRowCallback="closeEditor"
      :deselectBeforeSelect="false"
    >
      <template #headerButtons>
        <FlexButton class="add-button" type="Primary" size="M" icon-type="icon-plus" :text="$translate('EMT_NEW_CODE')" :handle-click="newCode" />
      </template>

      <template v-for="slot of slots" :key="slot.keySelector" v-slot:[slot.keySelector]="{ objectId }">
        <div class="table-column">
          <span>{{ cellText(slot.keySelector, objectId) }}</span>
        </div>
      </template>

      <template #Button_Column="{ objectId }">
        <div class="table-column btn-column">
          <FlexButton type="Secondary" size="M" :label="false" icon-type="icon-pencil" :title="$translate('EMT_EDIT_CODE')" :handle-click="editHandler(objectId)" />
          <FlexButton type="Secondary" size="M" :label="false" icon-type="icon-trash" :title="$translate('EMT_DELETE')" :handle-click="deleteHandler(objectId)" />
        </div>
      </template>
    </Table>
  </div>
</template>

<script setup lang="ts">
import { ref, type ComputedRef } from 'vue';
import { FlexButton } from '@fsdev/button';
import Table, { type Column, type DefaultSorting } from '@fsdev/table';
import { getEventBus } from '@fsdev/eventbus/eventBus.js';
import { ADAPTIVE_WINDOW, TABLES, WEBAPPLICATION_EVENTS } from '@/constants';
import { mapGetters } from '@/stores/storeLib';
import { useTranslate } from '@/utils/format';
import { confirmDeleteErrorCode } from '@/utils/confirmDelete';

const translate = useTranslate();

const { getObject } = mapGetters<{
  getObject: ComputedRef<(objectId: string) => Record<string, unknown>>;
}>('objectStore');

const slots = [{ keySelector: 'Code' }, { keySelector: 'Title' }, { keySelector: 'Group' }, { keySelector: 'DefaultSeverity' }, { keySelector: 'Active' }, { keySelector: 'IsUsed' }];

const columns = ref<Column[]>([
  { name: 'EMT_COL_CODE', slotName: 'Code', sorting: { keySelector: 'Code' } },
  { name: 'EMT_COL_TITLE', slotName: 'Title', sorting: { keySelector: 'Title' } },
  { name: 'EMT_COL_GROUP', slotName: 'Group', sorting: { keySelector: 'Group' } },
  { name: 'EMT_COL_SEVERITY', slotName: 'DefaultSeverity', sorting: { keySelector: 'DefaultSeverity' } },
  { name: 'EMT_COL_ACTIVE', slotName: 'Active', sorting: { keySelector: 'Active' } },
  { name: 'EMT_COL_IS_USED', slotName: 'IsUsed', sorting: { keySelector: 'IsUsed' } },
  { name: '', slotName: 'Button_Column', sorting: false },
] as Column[]);

const defaultSorting: DefaultSorting = {
  columnName: 'EMT_COL_CODE',
  direction: 'Ascending',
};

function cellText(keySelector: string, objectId: string): string {
  const value = getObject.value(objectId)?.[keySelector];
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  if (keySelector === 'Active' || keySelector === 'IsUsed') {
    return value === true ? translate('EMT_YES') : translate('EMT_NO');
  }
  if (keySelector === 'DefaultSeverity') {
    return translate('EMT_SEVERITY_' + String(value));
  }
  return String(value);
}

/** Opens the editor window; no id creates a new code. The row's object id is the error code id (ManualDictTable key). */
function openEditor(errorCodeId?: string) {
  getEventBus().emit(WEBAPPLICATION_EVENTS.EVENT_ADAPTIVE_WINDOW, {
    PageType: 'adaptive',
    Id: ADAPTIVE_WINDOW.CODE_EDITOR,
    Options: { errorCodeId },
    Position: 'right',
    Size: 'middle',
  });
}

function newCode() {
  openEditor();
}

/** @fsdev/table calls this with (objectId, modelId), not with a SelectionEvent. */
function selectRow(objectId: string) {
  if (objectId) {
    openEditor(objectId);
  }
}

/** FlexButton takes a handler, not a listener, so the click is stopped here — otherwise the row's selectRowCallback fires too. */
function editHandler(objectId: string) {
  return (event: MouseEvent) => {
    event.stopPropagation();
    openEditor(objectId);
  };
}

/**
 * Every code offers delete; the backend refuses codes in use and "Other", and that refusal is shown
 * as an overlay. A deleted code may still be open in the editor window, so that is closed too.
 */
function deleteHandler(objectId: string) {
  return (event: MouseEvent) => {
    event.stopPropagation();
    confirmDeleteErrorCode(objectId, closeEditor);
  };
}

function closeEditor() {
  getEventBus().emit(WEBAPPLICATION_EVENTS.EVENT_CLOSE_ALL_ADAPTIVE_WINDOWS, { Position: 'right' });
}
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
.btn-column {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
}
</style>
