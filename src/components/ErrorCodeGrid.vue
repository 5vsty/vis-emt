<template>
  <div class="emt-grid-wrap">
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
  </div>
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
/*
 * The columns follow the width of the grid itself (container query), not the width of the screen, so the same grid fits the page,
 * the narrow report window next to another screen and a phone: 4 columns from 1400 px, 3 from 900 px, 2 from 520 px, otherwise one row per code.
 */
.emt-grid-wrap {
  container-type: inline-size;
}

.emt-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: minmax(0, 1fr);
}

/* Every tile of a row is as tall as the tallest one (long titles wrap). */
.emt-grid__cell {
  display: flex;
}

.emt-tile {
  flex: 1;
  width: 100%;
  min-height: 4.5rem;
  padding: 0.75rem 1rem;
  border: 0;
  border-radius: 8px;
  background: var(--color-background, #fff);
  color: var(--color-text, #222);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  font: inherit;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.25;
  overflow-wrap: anywhere;
  cursor: pointer;
  /* Title on the left, code and state stacked on the right; none of them breaks in the middle of a word. */
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    'title code'
    'title state';
  align-items: center;
  column-gap: 0.75rem;
  text-align: left;
  /* Touch: no double-tap zoom delay and no grey flash; nothing depends on hover. */
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.emt-tile__title {
  grid-area: title;
}

.emt-tile__code {
  grid-area: code;
  justify-self: end;
  white-space: nowrap;
  font-size: 0.8em;
  font-weight: 400;
  opacity: 0.75;
}

.emt-tile__state {
  grid-area: state;
  justify-self: end;
  white-space: nowrap;
  font-size: 0.8em;
  font-weight: 700;
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

/* Two or more columns: big centred tiles for a finger. */
@container (min-width: 520px) {
  .emt-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .emt-tile {
    min-height: 7rem;
    font-size: 1.25rem;
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'title'
      'code'
      'state';
    justify-items: center;
    text-align: center;
    row-gap: 0.25rem;
  }

  .emt-tile__code,
  .emt-tile__state {
    justify-self: center;
  }
}

@container (min-width: 900px) {
  .emt-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@container (min-width: 1400px) {
  .emt-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
