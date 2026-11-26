import { computed, type ComputedRef } from 'vue';
import { mapGetters } from '@/stores/storeLib';
import { EMT_PERMISSIONS } from '@/constants';
import type { HasAccessFn } from '@/types';

/** Reactive permission check against the EMT module and scope. */
export function useHasPermission(permission: string) {
  const { hasAccess } = mapGetters<{ hasAccess: ComputedRef<HasAccessFn> }>('accessControl');
  return computed(() => hasAccess.value('customizable', EMT_PERMISSIONS.MODULE_ID, EMT_PERMISSIONS.SCOPE_ID, permission));
}
