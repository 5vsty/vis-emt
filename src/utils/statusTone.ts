import { moduleConfig } from '@fsdev/pluginapi';

/**
 * The colour of a status. The default follows the status tags of the UI kit tables (gallery: logistik-tabelle, statusTones.js): finished = success,
 * running = info, a problem = error, not started or no longer followed = neutral. A designer changes it in the module config (emtConfig.json,
 * section StatusColors) without a new build: per status either the name of a tone
 *
 *   "NEW": "error"                                  neutral | info | success | warning | error
 *
 * or own colours
 *
 *   "NEW": { "Background": "#fde7e7", "Text": "#b40a0f" }
 *
 * A status without an entry (or with an unusable one) keeps its default.
 */
export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

export type StatusColor = {
  background: string;
  color: string;
};

/** The colours of the tones: the tokens of the host, with the values measured in the gallery as fallback. */
const TONE_COLORS: Record<StatusTone, StatusColor> = {
  neutral: { background: 'var(--fx-color-tag-neutral-bg, #dadada)', color: 'var(--text-body, #343437)' },
  info: { background: 'var(--fx-color-info-bg, #e9f3ff)', color: 'var(--fx-color-info-fg, #005eb4)' },
  success: { background: 'var(--success-bg, #ddf1bc)', color: 'var(--fx-color-success-fg, #4c7011)' },
  warning: { background: 'var(--warning-bg, #fff1cc)', color: 'var(--fx-color-warning-fg, #7a5200)' },
  error: { background: 'var(--error-bg, #f2dede)', color: 'var(--error-color, #b40a0f)' },
};

/**
 * NEW is a problem nobody has looked at yet; acknowledged is seen but not started (the only status that asks for attention again); in progress
 * is running; resolved and closed are finished; rejected and cancelled are neutral.
 */
export const DEFAULT_STATUS_TONES: Record<string, StatusTone> = {
  NEW: 'error',
  ACKNOWLEDGED: 'warning',
  IN_PROGRESS: 'info',
  RESOLVED: 'success',
  CLOSED: 'success',
  REJECTED: 'neutral',
  CANCELLED: 'neutral',
};

/** A colour value of the config: hex, rgb(a)/hsl(a), a named colour or a CSS variable; nothing that could carry more than a colour. */
const SAFE_COLOR = /^(#[0-9a-fA-F]{3,8}|(rgb|rgba|hsl|hsla)\([0-9a-zA-Z.,%\s/-]+\)|var\(--[a-zA-Z0-9-]+(,\s*[#a-zA-Z0-9(),.%\s-]+)?\)|[a-zA-Z]{3,30})$/;

function readConfig(): Record<string, unknown> {
  const config = Object.values(moduleConfig)[0] as { StatusColors?: unknown } | undefined;
  const colors = config?.StatusColors;
  return colors !== null && typeof colors === 'object' ? (colors as Record<string, unknown>) : {};
}

function safeColor(value: unknown): string | undefined {
  return typeof value === 'string' && SAFE_COLOR.test(value.trim()) ? value.trim() : undefined;
}

/** The colours of a configured entry: a tone name or own colours; undefined when it cannot be used. */
export function parseStatusColor(entry: unknown): StatusColor | undefined {
  if (typeof entry === 'string') {
    return TONE_COLORS[entry.trim().toLowerCase() as StatusTone];
  }
  if (entry !== null && typeof entry === 'object') {
    const { Background, Text } = entry as { Background?: unknown; Text?: unknown };
    const background = safeColor(Background);
    return background === undefined ? undefined : { background, color: safeColor(Text) ?? TONE_COLORS.neutral.color };
  }
  return undefined;
}

export function statusColor(status: string): StatusColor {
  return parseStatusColor(readConfig()[status]) ?? TONE_COLORS[DEFAULT_STATUS_TONES[status] ?? 'neutral'];
}
