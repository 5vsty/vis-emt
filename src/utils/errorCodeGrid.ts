import { OPEN_STATUSES } from '@/constants';
import type { ErrorCodeOption, ErrorSummary } from '@/types';

const STORED_LOCATION_KEY = 'emt.report.locationId';

/**
 * The codes the tablet grid shows. The MVP has no "Other" code and no free text (designer 2.2), so it is left out;
 * the order is by code (numbers inside a code compare as numbers) so that the tiles do not move between visits.
 */
export function gridCodes(codes: readonly ErrorCodeOption[]): ErrorCodeOption[] {
  return codes.filter((code) => !code.IsOther).sort((a, b) => a.Code.localeCompare(b.Code, undefined, { numeric: true, sensitivity: 'base' }));
}

/** Statuses a tile shows. RESOLVED is shown (waiting for the reporter) but it is not "open": tapping the tile again reports a new error. */
export const TILE_STATUSES = ['NEW', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED'] as const;

/** The status of the newest shown error per error code (own errors), so that a tile can change its colour with every step of the handling. */
export function latestStatusByCode(errors: readonly ErrorSummary[], locationId: string | null): Map<string, string> {
  const newest = new Map<string, ErrorSummary>();
  for (const error of errors) {
    if (!(TILE_STATUSES as readonly string[]).includes(error.Status) || (locationId !== null && error.LocationId !== locationId)) {
      continue;
    }
    const existing = newest.get(error.ErrorCodeId);
    if (existing === undefined || error.Number > existing.Number) {
      newest.set(error.ErrorCodeId, error);
    }
  }
  return new Map([...newest].map(([codeId, error]) => [codeId, error.Status]));
}

export function isOpenStatus(status: string): boolean {
  return (OPEN_STATUSES as readonly string[]).includes(status);
}

/**
 * The newest not finished error per error code (own errors). With a location only the errors of that location count.
 * A tile of such a code is highlighted and a second tap does not report the same problem again.
 */
export function openErrorsByCode(errors: readonly ErrorSummary[], locationId: string | null): Map<string, ErrorSummary> {
  const result = new Map<string, ErrorSummary>();
  for (const error of errors) {
    if (!isOpenStatus(error.Status) || (locationId !== null && error.LocationId !== locationId)) {
      continue;
    }
    const existing = result.get(error.ErrorCodeId);
    if (existing === undefined || error.Number > existing.Number) {
      result.set(error.ErrorCodeId, error);
    }
  }
  return result;
}

/** Replaces %Name% placeholders of a translated text. */
export function fillPlaceholders(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((text, [name, value]) => text.split(`%${name}%`).join(value), template);
}

/** The location chosen last time on this device; empty if there is none or the storage is not available. */
export function loadStoredLocation(): string {
  try {
    return localStorage.getItem(STORED_LOCATION_KEY) ?? '';
  } catch {
    return '';
  }
}

export function storeLocation(locationId: string): void {
  try {
    localStorage.setItem(STORED_LOCATION_KEY, locationId);
  } catch {
    // The storage can be blocked (private mode); the choice is then only kept until the page closes.
  }
}
