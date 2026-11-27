<template>
  <span class="emt-status-tag" :style="statusColor(status)">{{ label }}</span>
</template>

<script setup lang="ts">
import { statusColor } from '@/utils/statusTone';

/** A status as a small pill, like the status tags of the UI kit tables; the colours come from the module config (utils/statusTone.ts). */
defineProps<{ status: string; label: string }>();
</script>

<style scoped>
.emt-status-tag {
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 11.4px;
  font-weight: 500;
  line-height: 12px;
  white-space: nowrap;
}
</style>
