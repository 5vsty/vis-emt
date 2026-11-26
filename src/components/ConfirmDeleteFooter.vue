<template>
  <div class="emt-confirm-footer">
    <FlexButton type="Error" size="M" icon-type="icon-trash" :text="$translate('EMT_DELETE')" :handle-click="onConfirm" />
    <FlexButton type="Secondary" size="M" icon-type="icon-cross" :text="$translate('EMT_CANCEL')" :handle-click="closeOverlay" />
  </div>
</template>

<script setup lang="ts">
import { FlexButton } from '@fsdev/button';

/**
 * Footer for delete confirmations shown with showOverlay of @fsdev/overlay — the package only ships a
 * single "Understood" footer. FlexOverlay passes footerProps plus its own closeOverlay.
 */
const props = defineProps<{
  confirm: () => void;
  closeOverlay: () => void;
}>();

function onConfirm() {
  props.confirm();
  props.closeOverlay();
}
</script>

<style scoped>
.emt-confirm-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
</style>
