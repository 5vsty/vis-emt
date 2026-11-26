import { getCurrentInstance } from 'vue';

/** UTC epoch milliseconds to local date and time; 0 or missing gives a dash. */
export function formatDateTime(epochMs: number | undefined | null): string {
  if (epochMs === undefined || epochMs === null || epochMs === 0) {
    return '-';
  }
  return new Date(epochMs).toLocaleString('en-GB').replace(/\//g, '.').slice(0, -3);
}

/** The global `$translate` of the shell, for use in `<script setup>`. */
export function useTranslate(): (key: string, fallback?: string) => string {
  const instance = getCurrentInstance();
  return (key: string, fallback?: string) => {
    const translate = instance?.appContext.config.globalProperties.$translate as ((k: string, f?: string) => string) | undefined;
    return typeof translate === 'function' ? translate(key, fallback) : (fallback ?? key);
  };
}
