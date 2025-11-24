/**
 * Application Menu
 * Defines the native application menu structure
 *
 * TODO (T015): Implement application menu with shortcuts
 */

import { Menu, MenuItemConstructorOptions } from 'electron';

/**
 * Create and set the application menu
 * TODO (T015): Implement
 */
export function createMenu(): Menu {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' }
      ]
    }
  ];

  return Menu.buildFromTemplate(template);
}
