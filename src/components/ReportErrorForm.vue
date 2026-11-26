<template>
  <div class="emt-modal-backdrop">
    <div class="emt-modal" role="dialog" aria-modal="true" :aria-label="$translate('EMT_REPORT_ERROR')">
      <h5 class="title pb-05">{{ $translate('EMT_REPORT_ERROR') }}</h5>

      <form v-if="!loading && !loadFailed" @submit.prevent="submit">
        <div v-if="locationEnabled" class="emt-field">
          <label for="emt-location">{{ $translate('EMT_COL_LOCATION') }} *</label>
          <select id="emt-location" v-model="locationId" :aria-invalid="fieldError('LocationId') !== ''" required>
            <option value="" disabled>{{ $translate('EMT_SELECT_PLACEHOLDER') }}</option>
            <option v-for="location in locations" :key="location.LocationId" :value="location.LocationId">{{ location.Path }}</option>
          </select>
          <span v-if="fieldError('LocationId') !== ''" class="emt-error">{{ fieldError('LocationId') }}</span>
        </div>

        <div class="emt-field">
          <label for="emt-code">{{ $translate('EMT_COL_ERROR_CODE') }} *</label>
          <select id="emt-code" v-model="errorCodeId" :aria-invalid="fieldError('ErrorCodeId') !== ''" required>
            <option value="" disabled>{{ $translate('EMT_SELECT_PLACEHOLDER') }}</option>
            <option v-for="code in errorCodes" :key="code.ErrorCodeId" :value="code.ErrorCodeId">{{ code.Code }} - {{ code.Title }}</option>
          </select>
          <span v-if="fieldError('ErrorCodeId') !== ''" class="emt-error">{{ fieldError('ErrorCodeId') }}</span>
        </div>

        <div class="emt-field">
          <label for="emt-description">{{ $translate('EMT_DESCRIPTION') }}</label>
          <textarea id="emt-description" v-model="description" :maxlength="MAX_DESCRIPTION_LENGTH" rows="4"></textarea>
          <span class="emt-hint">{{ description.length }} / {{ MAX_DESCRIPTION_LENGTH }}</span>
        </div>

        <div class="emt-actions">
          <FlexButton type="Primary" size="M" :text="$translate('EMT_SUBMIT')" :state="submitting ? 'Disabled' : 'Default'" :handle-click="submit" />
          <FlexButton type="Secondary" size="M" :text="confirmingClose ? $translate('EMT_DISCARD') : $translate('EMT_CANCEL')" :handle-click="requestClose" />
        </div>
      </form>

      <div v-if="loading || loadFailed" class="emt-actions">
        <FlexButton type="Secondary" size="M" :text="$translate('EMT_CLOSE')" :handle-click="() => emit('close')" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { FlexButton } from '@fsdev/button';
import { MAX_DESCRIPTION_LENGTH, MESSAGE_ID } from '@/constants';
import { sendRequest } from '@/utils/requests';
import { useTranslate } from '@/utils/format';
import type { IFuncResponseGetReportFormData, IFuncResponseSubmitError } from '@/messages/backendToFrontend';
import type { ErrorCodeOption, LocationOption, ValidationError } from '@/types';

const emit = defineEmits<{
  (event: 'close'): void;
  (event: 'submitted', response: IFuncResponseSubmitError): void;
}>();

const translate = useTranslate();

const loading = ref(true);
const loadFailed = ref(false);
const errorCodes = ref<ErrorCodeOption[]>([]);
const locations = ref<LocationOption[]>([]);
const locationEnabled = ref(true);

const locationId = ref('');
const errorCodeId = ref('');
const description = ref('');
const submitting = ref(false);
const validationErrors = ref<ValidationError[]>([]);
const confirmingClose = ref(false);

/** Created once per form so that a repeated submit after a lost response is recognised as a duplicate. */
const clientRequestId = uuidv4();

const isDirty = computed(() => locationId.value !== '' || errorCodeId.value !== '' || description.value !== '');

function fieldError(field: string): string {
  const found = validationErrors.value.find((e) => e.Field === field);
  return found === undefined ? '' : translate(found.MessageKey);
}

async function loadFormData() {
  loading.value = true;
  loadFailed.value = false;
  const response = await sendRequest<IFuncResponseGetReportFormData>({ ID: MESSAGE_ID.EMT, funcGetReportFormData: '', RequestId: '' });
  if (response.Successful !== true) {
    loadFailed.value = true;
  } else {
    errorCodes.value = response.ErrorCodes ?? [];
    locations.value = response.Locations ?? [];
    locationEnabled.value = response.LocationEnabled !== false;
  }
  loading.value = false;
}

async function submit() {
  if (submitting.value) {
    return;
  }
  validationErrors.value = [];

  const locationMissing = locationEnabled.value && locationId.value === '';
  if (locationMissing || errorCodeId.value === '') {
    validationErrors.value = [...(locationMissing ? [{ Field: 'LocationId', MessageKey: 'EMT_VALIDATION_REQUIRED' }] : []), ...(errorCodeId.value === '' ? [{ Field: 'ErrorCodeId', MessageKey: 'EMT_VALIDATION_REQUIRED' }] : [])];
    return;
  }

  submitting.value = true;
  const trimmed = description.value.trim();
  const response = await sendRequest<IFuncResponseSubmitError>({
    ID: MESSAGE_ID.EMT,
    funcSubmitError: '',
    ClientRequestId: clientRequestId,
    ...(locationEnabled.value ? { LocationId: locationId.value } : {}),
    ErrorCodeId: errorCodeId.value,
    ...(trimmed !== '' ? { Description: trimmed } : {}),
  });
  submitting.value = false;

  if (response.Successful === true) {
    emit('submitted', response);
    return;
  }

  validationErrors.value = response.ValidationErrors ?? [];
  if (response.Reason === 'ErrorCodeInactive') {
    errorCodeId.value = '';
    await loadFormData();
  }
}

function requestClose() {
  if (isDirty.value && !confirmingClose.value) {
    confirmingClose.value = true;
    return;
  }
  emit('close');
}

onMounted(loadFormData);
</script>

<style scoped>
.emt-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.emt-modal {
  background: var(--color-background, #fff);
  color: var(--color-text, inherit);
  padding: 1.5rem;
  width: min(32rem, 95vw);
  max-height: 90vh;
  overflow: auto;
  border-radius: 4px;
}
.emt-field {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}
.emt-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
.emt-hint {
  opacity: 0.6;
  font-size: 0.8em;
}
.emt-error {
  color: var(--color-error, #c62828);
}
</style>
