<template>
  <section class="emt-editor" :aria-label="$translate('EMT_CODE_EDITOR')">
    <div class="col-100 form-horizontal">
      <h5 class="title pb-05">{{ isNew ? $translate('EMT_NEW_CODE') : $translate('EMT_EDIT_CODE') }}</h5>
    </div>

    <form @submit.prevent="save">
      <div class="emt-field">
        <FlexInput
          control-type="input"
          type="text"
          :model-value="form.Code"
          :placeholder="$translate('EMT_COL_CODE')"
          :is-required="true"
          :is-disabled="busy"
          :invalid="fieldError('Code') !== ''"
          :error-text="fieldError('Code')"
          @update:model-value="setField('Code', $event)"
        />
      </div>

      <div class="emt-field">
        <FlexInput
          control-type="input"
          type="text"
          :model-value="form.Title"
          :placeholder="$translate('EMT_COL_TITLE')"
          :is-required="true"
          :is-disabled="busy"
          :invalid="fieldError('Title') !== ''"
          :error-text="fieldError('Title')"
          @update:model-value="setField('Title', $event)"
        />
      </div>

      <!-- @fsdev/input has no multi-line control, so these stay textareas (as in the safety instruction window). -->
      <div class="emt-field">
        <label for="emt-code-desc">{{ $translate('EMT_DESCRIPTION') }}</label>
        <textarea id="emt-code-desc" :value="form.Description" rows="3" :disabled="busy || !fullLoaded" @input="setField('Description', ($event.target as HTMLTextAreaElement).value)"></textarea>
      </div>

      <div class="emt-field">
        <label for="emt-code-instr">{{ $translate('EMT_INSTRUCTIONS') }}</label>
        <textarea id="emt-code-instr" :value="form.Instructions" rows="3" :disabled="busy || !fullLoaded" @input="setField('Instructions', ($event.target as HTMLTextAreaElement).value)"></textarea>
      </div>

      <div class="emt-field">
        <FlexInput control-type="input" type="text" :model-value="form.Group" :placeholder="$translate('EMT_COL_GROUP')" :is-disabled="busy" @update:model-value="setField('Group', $event)" />
      </div>

      <div class="emt-field">
        <FlexInput control-type="select" :model-value="form.DefaultSeverity" :options="severityOptions" :label="$translate('EMT_COL_SEVERITY')" :disabled="busy" @update:model-value="setSeverity($event)" />
      </div>

      <div class="emt-field">
        <FlexCheckbox :model-value="form.Active" :label="$translate('EMT_COL_ACTIVE')" :disabled="busy" @update:model-value="setActive($event)" />
      </div>

      <div class="emt-actions">
        <FlexButton type="Primary" size="M" :text="$translate('EMT_SAVE')" :state="busy || !fullLoaded ? 'Disabled' : 'Default'" :handle-click="save" />
        <FlexButton v-if="canDelete" type="Secondary" size="M" :text="$translate('EMT_DELETE')" :state="busy ? 'Disabled' : 'Default'" :handle-click="remove" />
        <FlexButton type="Secondary" size="M" :text="$translate('EMT_CANCEL')" :handle-click="close" />
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { store } from '@fsdev/pluginapi';
import { FlexButton } from '@fsdev/button';
import { FlexInput } from '@fsdev/input';
import { FlexCheckbox } from '@fsdev/checkbox';
// FlexCheckbox draws an element-plus ElCheckbox but ships none of its CSS (no box, no tick without it);
// each plugin injects the element-plus CSS it needs, as in instructions' ReportAreasFilterWindow.
import 'element-plus/es/components/checkbox/style/css';
import { getEventBus } from '@fsdev/eventbus/eventBus.js';
import { MESSAGE_ID, SEVERITIES, WEBAPPLICATION_EVENTS } from '@/constants';
import { sendRequest } from '@/utils/requests';
import { useTranslate } from '@/utils/format';
import { confirmDeleteErrorCode } from '@/utils/confirmDelete';
import type { IFuncResponseGetErrorCodes, IFuncResponseSaveErrorCode } from '@/messages/backendToFrontend';
import type { ErrorCodeFull, Severity, ValidationError } from '@/types';

/** Opened as adaptive window from the catalog; the props are the window's Options. */
const props = defineProps<{
  /** Code to edit; undefined creates a new code. */
  errorCodeId?: string;
}>();

const translate = useTranslate();

interface FormState {
  Code: string;
  Title: string;
  Description: string;
  Instructions: string;
  Group: string;
  DefaultSeverity: Severity;
  Active: boolean;
}

type TextField = 'Code' | 'Title' | 'Description' | 'Instructions' | 'Group';

const isNew = computed(() => props.errorCodeId === undefined || props.errorCodeId === '');

const errorCode = ref<ErrorCodeFull>();
const form = reactive<FormState>({
  Code: '',
  Title: '',
  Description: '',
  Instructions: '',
  Group: '',
  DefaultSeverity: 'Error',
  Active: true,
});

/** True once the user typed something; from then on incoming data no longer overwrites what they entered. */
const dirty = ref(false);
/** Description, instructions and version are not in the table row — before they are loaded, saving would wipe them. */
const fullLoaded = computed(() => isNew.value || errorCode.value !== undefined);
const busy = ref(false);
const validationErrors = ref<ValidationError[]>([]);

/** Any existing code offers delete; the backend refuses codes in use and "Other", shown as an overlay. */
const canDelete = computed(() => !isNew.value);

function fillForm(code: ErrorCodeFull) {
  form.Code = code.Code;
  form.Title = code.Title;
  form.Description = code.Description;
  form.Instructions = code.Instructions;
  form.Group = code.Group ?? '';
  form.DefaultSeverity = code.DefaultSeverity;
  form.Active = code.Active;
}

/**
 * The catalog table row of this code, read straight from the host object store like the safety
 * instruction window does (a getter function does not reliably re-track a changing id).
 */
const row = computed<Record<string, unknown> | undefined>(() => (isNew.value ? undefined : store.state.objectStore?.ObjectDictionary?.[props.errorCodeId as string]));

/** Fills what the table row already has, so the form is not empty while the full code is loading. */
function fillFromRow(value: Record<string, unknown>) {
  form.Code = String(value.Code ?? '');
  form.Title = String(value.Title ?? '');
  form.Group = String(value.Group ?? '');
  form.DefaultSeverity = (value.DefaultSeverity as Severity | undefined) ?? 'Error';
  form.Active = value.Active === true;
}

/**
 * The table row lacks description, instructions and version, so the full code is fetched as well.
 * If the user already edited, only those missing fields are taken over (they are disabled until now).
 */
async function loadCode() {
  if (isNew.value) {
    return;
  }
  const requestedId = props.errorCodeId;
  const response = await sendRequest<IFuncResponseGetErrorCodes>({ ID: MESSAGE_ID.EMT, funcGetErrorCodes: '', RequestId: '' });
  if (requestedId !== props.errorCodeId) {
    return;
  }
  const found = response.Successful === true ? (response.ErrorCodes ?? []).find((code) => code.ErrorCodeId === requestedId) : undefined;
  if (found === undefined) {
    return;
  }
  errorCode.value = found;
  if (dirty.value) {
    form.Description = found.Description;
    form.Instructions = found.Instructions;
  } else {
    fillForm(found);
  }
}

/** Shows the row right away, then loads the full code. */
function open() {
  if (row.value !== undefined) {
    fillFromRow(row.value);
  }
  void loadCode();
}

function close() {
  getEventBus().emit(WEBAPPLICATION_EVENTS.EVENT_CLOSE_ALL_ADAPTIVE_WINDOWS, { Position: 'right' });
}

function fieldError(field: string): string {
  const found = validationErrors.value.find((e) => e.Field === field);
  return found === undefined ? '' : translate(found.MessageKey);
}

const severityOptions = computed(() => SEVERITIES.map((severity) => ({ value: severity, name: translate('EMT_SEVERITY_' + severity) })));

/** Every user edit goes through these setters, so only real edits mark the form dirty (filling it from data does not). */
function setField(field: TextField, value: unknown) {
  form[field] = String(value ?? '');
  dirty.value = true;
}

function setSeverity(value: unknown) {
  form.DefaultSeverity = (value as Severity | null) ?? 'Error';
  dirty.value = true;
}

function setActive(value: boolean) {
  form.Active = value;
  dirty.value = true;
}

async function save() {
  if (busy.value) {
    return;
  }
  validationErrors.value = [];

  const missing: ValidationError[] = [];
  if (form.Code.trim() === '') {
    missing.push({ Field: 'Code', MessageKey: 'EMT_VALIDATION_REQUIRED' });
  }
  if (form.Title.trim() === '') {
    missing.push({ Field: 'Title', MessageKey: 'EMT_VALIDATION_REQUIRED' });
  }
  if (missing.length > 0) {
    validationErrors.value = missing;
    return;
  }

  busy.value = true;
  const response = await sendRequest<IFuncResponseSaveErrorCode>({
    ID: MESSAGE_ID.EMT,
    funcSaveErrorCode: '',
    ErrorCodeId: isNew.value ? null : (props.errorCodeId as string),
    ExpectedVersion: errorCode.value?.Version ?? null,
    Code: form.Code.trim(),
    Title: form.Title.trim(),
    Description: form.Description.trim(),
    Instructions: form.Instructions.trim(),
    Group: form.Group.trim() === '' ? null : form.Group.trim(),
    DefaultSeverity: form.DefaultSeverity,
    Active: form.Active,
  });
  busy.value = false;

  if (response.Successful === true) {
    close();
    return;
  }
  validationErrors.value = response.ValidationErrors ?? [];
}

/** Confirmation and the backend's refusal are shown as overlays; the window closes once the code is gone. */
function remove() {
  if (isNew.value || busy.value) {
    return;
  }
  confirmDeleteErrorCode(props.errorCodeId as string, close);
}

onMounted(open);

/** Another session changed this code: take it over unless the user is editing (its version changed too). */
watch(
  row,
  (value) => {
    if (value === undefined || dirty.value || busy.value) {
      return;
    }
    fillFromRow(value);
    void loadCode();
  },
  { deep: true },
);

/** The window may stay open while another row is picked; then it shows that code instead. */
watch(
  () => props.errorCodeId,
  () => {
    errorCode.value = undefined;
    fillForm({ Code: '', DefaultSeverity: 'Error', Active: true } as ErrorCodeFull);
    validationErrors.value = [];
    dirty.value = false;
    open();
  },
);
</script>

<style scoped>
.emt-editor {
  padding: 0 1rem 1rem;
}
/* FlexCheckbox fills a checked box with --primary-dark-100, which WebApplication does not declare
   (only the demo host and the visualization module do), so the tick rendered white on white.
   Same fix as instructions' ReportAreasFilterWindow: the checkbox's own rules with a fallback. */
.emt-editor :deep(.el-checkbox__input.is-checked .el-checkbox__inner),
.emt-editor :deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner) {
  background-color: var(--primary-dark-100, #343437);
  border-color: var(--primary-dark-100, #343437);
}
.emt-editor :deep(.el-checkbox__input.is-focus .el-checkbox__inner) {
  border-color: var(--primary-dark-100, #343437);
}
.title {
  border-bottom: solid 1px var(--gray-dark);
  margin-bottom: 1rem;
}
.emt-field {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.75rem;
}
.emt-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
