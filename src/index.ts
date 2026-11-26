import { initializePlugin, type Initialize, store, moduleConfig, ConfigStore, MainMenuID } from '@fsdev/pluginapi';
import { MESSAGE_ID, handleMessageReceived } from './messageHandler';
import { registerOverlayComponent } from '@fsdev/overlay';
import { objectStore } from './stores/objectStore';
import { ADAPTIVE_WINDOW, COMPONENT, EMT_PERMISSIONS, MENU, STORE_KEY } from './constants';
import { Utilities } from './utils/translations';

import { type ModuleConfig } from './types';
import ReportPage from './components/ReportPage.vue';
import ErrorListPage from './components/ErrorListPage.vue';
import ErrorDetail from './components/ErrorDetail.vue';
import CatalogPage from './components/CatalogPage.vue';
import ErrorCodeEditor from './components/ErrorCodeEditor.vue';

declare module '@fsdev/pluginapi' {
  interface ModuleConfigWrapper {
    [key: string]: ModuleConfig;
  }
}

export const initialize: Initialize = (api) => {
  if (!initializePlugin(api)) {
    return {};
  }

  if (Object.values(moduleConfig)[0].Active !== true) {
    console.warn('[Emt] skip initialization because Active is not set to true and there is no message handling to activate it');
    return {};
  }

  store.registerModule(STORE_KEY, objectStore);

  // Lets showOverlay/failedResponse of @fsdev/overlay open their dialog in the host.
  registerOverlayComponent();

  ConfigStore.addComponent({ id: COMPONENT.REPORT, component: ReportPage });
  ConfigStore.addComponent({ id: COMPONENT.LIST, component: ErrorListPage });
  ConfigStore.addComponent({ id: COMPONENT.ERROR_DETAIL, component: ErrorDetail });
  ConfigStore.addComponent({ id: COMPONENT.CATALOG, component: CatalogPage });
  ConfigStore.addComponent({ id: COMPONENT.CODE_EDITOR, component: ErrorCodeEditor });

  ConfigStore.addAdaptiveWindow({
    availableButtons: {
      back: true,
      close: true,
      fullscreen: true,
    },
    componentId: COMPONENT.CODE_EDITOR,
    id: ADAPTIVE_WINDOW.CODE_EDITOR,
  });

  ConfigStore.addAdaptiveWindow({
    availableButtons: {
      back: true,
      close: true,
      fullscreen: true,
    },
    componentId: COMPONENT.ERROR_DETAIL,
    id: ADAPTIVE_WINDOW.ERROR_DETAIL,
  });

  const mainMenuEntry = {
    name: 'EMT',
    id: MENU.MAIN,
    icon: 'icon icon-warning',
  };

  const menuItems = [
    { id: MENU.REPORT, name: 'EMT_MENU_REPORT', priority: 1, componentId: COMPONENT.REPORT, permissionField: EMT_PERMISSIONS.PERMISSIONS.REPORT_ERRORS },
    { id: MENU.LIST, name: 'EMT_MENU_LIST', priority: 2, componentId: COMPONENT.LIST, permissionField: EMT_PERMISSIONS.PERMISSIONS.MANAGE_ERRORS },
  ];

  for (const item of menuItems) {
    ConfigStore.addMenuEntry({
      mainMenuEntry,
      menuItem: {
        id: item.id,
        name: item.name,
        collapsable: false,
        collapsed: false,
        priority: item.priority,
      },
      componentId: item.componentId,
      access: {
        moduleID: EMT_PERMISSIONS.MODULE_ID,
        scopeID: EMT_PERMISSIONS.SCOPE_ID,
        permissionField: item.permissionField,
      },
    });
  }

  // The error code catalog lives under Settings > EMT, like the other modules' administration screens.
  const moduleName = Object.values(moduleConfig)[0].ModuleInstanceNameTranslationKey || Object.values(moduleConfig)[0].ModuleInstanceName || 'EMT';

  ConfigStore.addMenuEntry({
    mainMenuEntry: MainMenuID.Settings,
    menuItem: {
      name: moduleName,
      id: MENU.SETTINGS,
      collapsable: false,
      collapsed: false,
    },
    subMenuItem: {
      name: 'EMT_MENU_CATALOG',
      id: MENU.CATALOG,
    },
    componentId: COMPONENT.CATALOG,
    access: {
      moduleID: EMT_PERMISSIONS.MODULE_ID,
      scopeID: EMT_PERMISSIONS.SCOPE_ID,
      permissionField: EMT_PERMISSIONS.PERMISSIONS.MANAGE_CATALOG,
    },
  });

  Utilities.sendCustomTranslations();

  return {
    messageHandler: {
      genericObjectHandlerIgnoreIDList: Object.values(MESSAGE_ID),
      messageHandler: handleMessageReceived,
    },
  };
};
