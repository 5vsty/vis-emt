import { getEventBus } from '@fsdev/eventbus/eventBus.js';
import { WEBAPPLICATION_EVENTS } from '@/constants';

export type WindowSize = 'small' | 'large' | 'full';

/** Opens one of the plugin's adaptive windows; `options` become the props of its component. */
export function openWindow(id: string, options: Record<string, unknown> = {}, size: WindowSize = 'small') {
  getEventBus().emit(WEBAPPLICATION_EVENTS.EVENT_ADAPTIVE_WINDOW, {
    PageType: 'adaptive',
    Id: id,
    Options: options,
    Position: 'right',
    Size: size,
  });
}

/** Trigger string for a system tray entry that opens an adaptive window. */
export function openWindowTrigger(id: string, size: WindowSize = 'small'): string {
  return JSON.stringify([{ Type: 'PageSwitch', Value: { PageType: 'adaptive', OnClick: 'open', Id: id, Position: 'right', Size: size } }]);
}
