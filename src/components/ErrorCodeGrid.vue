<template>
  <ul class="emt-grid">
    <li v-for="code in codes" :key="code.ErrorCodeId" class="emt-grid__cell">
      <button
        type="button"
        class="emt-tile"
        :class="[statusByCode.has(code.ErrorCodeId) ? `emt-tile--${(statusByCode.get(code.ErrorCodeId) ?? '').toLowerCase()}` : '', { 'emt-tile--busy': busyCodeId === code.ErrorCodeId }]"
        :disabled="busyCodeId !== null"
        :aria-busy="busyCodeId === code.ErrorCodeId"
        @click="emit('select', code)"
      >
        <span class="emt-tile__title">{{ code.Title }}</span>
        <span class="emt-tile__code">{{ code.Code }}</span>
        <span v-if="busyCodeId === code.ErrorCodeId" class="emt-tile__state">{{ busyLabel }}</span>
        <span v-else-if="statusByCode.has(code.ErrorCodeId)" class="emt-tile__state">{{ statusLabels[statusByCode.get(code.ErrorCodeId) ?? ''] ?? '' }}</span>
      </button>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { ErrorCodeOption } from '@/types';

defineProps<{
  codes: ErrorCodeOption[];
  /** Status of the newest error per code; the tile of such a code shows the status and its colour. */
  statusByCode: ReadonlyMap<string, string>;
  /** Translated text per status. */
  statusLabels: Record<string, string>;
  /** The code that is being sent; all tiles are locked meanwhile so that a double tap sends once. */
  busyCodeId: string | null;
  busyLabel: string;
}>();

const emit = defineEmits<{
  (event: 'select', code: ErrorCodeOption): void;
}>();
</script>

<style scoped>
/* Desktop and tablet landscape: 3 columns (4 on wide screens), tablet portrait: 2, phone: 1 row per code. */
.emt-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

/* Every tile of a row is as tall as the tallest one (long titles wrap). */
.emt-grid__cell {
  display: flex;
}

.emt-tile {
  flex: 1;
  width: 100%;
  min-height: 7rem;
  padding: 0.75rem 1rem;
  border: 0;
  border-radius: 8px;
  background: var(--color-background, #fff);
  color: var(--color-text, #222);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  font: inherit;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.25;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  overflow-wrap: anywhere;
  cursor: pointer;
  /* Touch: no double-tap zoom delay and no grey flash; nothing depends on hover. */
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.emt-tile:active:not(:disabled) {
  transform: scale(0.98);
}

.emt-tile:focus-visible {
  outline: 3px solid var(--color-primary, #1a73e8);
  outline-offset: 2px;
}

.emt-tile:disabled {
  cursor: default;
}

.emt-tile__code {
  font-size: 0.8em;
  font-weight: 400;
  opacity: 0.75;
}

.emt-tile__state {
  font-size: 0.8em;
  font-weight: 700;
}

/* One colour per step of the handling; dark text on every colour keeps the contrast above 4.5:1. */
.emt-tile--new {
  background: #ffd166;
  color: #1a1a1a;
}

.emt-tile--acknowledged {
  background: #8ecbff;
  color: #1a1a1a;
}

.emt-tile--in_progress {
  background: var(--color-success, #83bb26);
  color: #1a1a1a;
}

.emt-tile--resolved {
  background: #d9d9d9;
  color: #1a1a1a;
}

.emt-tile--busy {
  opacity: 0.6;
}

@media (min-width: 1400px) {
  .emt-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 899px) {
  .emt-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 519px) {
  .emt-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.5rem;
  }

  /* Title on the left, code and state stacked on the right; none of them breaks in the middle of a word. */
  .emt-tile {
    min-height: 4.5rem;
    font-size: 1.05rem;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'title code'
      'title state';
    align-items: center;
    column-gap: 0.75rem;
    text-align: left;
  }

  .emt-tile__title {
    grid-area: title;
  }

  .emt-tile__code {
    grid-area: code;
    justify-self: end;
    white-space: nowrap;
  }

  .emt-tile__state {
    grid-area: state;
    justify-self: end;
    white-space: nowrap;
  }
}
</style>
