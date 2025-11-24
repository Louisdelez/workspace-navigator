/**
 * IPC Handlers
 * Central registry for all IPC communication handlers
 *
 * TODO (T013-T014): Consolidate and organize IPC handlers
 */

import { ipcMain } from 'electron';
import type { WorkspaceEngine } from '../core/workspace/workspace-engine';

/**
 * Setup all IPC handlers for communication with renderer
 * TODO (T013): Refactor to use this centralized setup
 */
export function setupIpcHandlers(engine: WorkspaceEngine): void {
  // Workspace operations
  ipcMain.handle('workspace:getAll', () => {
    return engine.getAllWorkspaces();
  });

  ipcMain.handle('workspace:create', (_, name: string) => {
    return engine.createWorkspace(name);
  });

  ipcMain.handle('workspace:get', (_, id: string) => {
    return engine.getWorkspace(id);
  });

  ipcMain.handle('workspace:update', (_, id: string, updates: any) => {
    engine.updateWorkspace(id, updates);
  });

  ipcMain.handle('workspace:delete', (_, id: string) => {
    engine.deleteWorkspace(id);
  });

  // Folder operations
  ipcMain.handle('folder:create', (_, workspaceId: string, name: string, parentId?: string) => {
    return engine.createFolder(workspaceId, name, parentId);
  });

  ipcMain.handle('folder:getTree', (_, workspaceId: string) => {
    return engine.getFolderTree(workspaceId);
  });

  ipcMain.handle('folder:move', (_, folderId: string, newParentId: string | null) => {
    engine.moveFolder(folderId, newParentId);
  });

  ipcMain.handle('folder:delete', (_, folderId: string) => {
    engine.deleteFolder(folderId);
  });

  // Item operations
  ipcMain.handle('item:createWeb', (_, workspaceId: string, url: string, title: string, options?: any) => {
    return engine.createWebItem(workspaceId, url, title, options);
  });

  ipcMain.handle('item:createNote', (_, workspaceId: string, title: string, content?: string, options?: any) => {
    return engine.createNoteItem(workspaceId, title, content, options);
  });

  ipcMain.handle('item:get', (_, itemId: string) => {
    return engine.getItem(itemId);
  });

  ipcMain.handle('item:update', (_, itemId: string, updates: any) => {
    engine.updateItem(itemId, updates);
  });

  ipcMain.handle('item:move', (_, itemId: string, newFolderId: string | null) => {
    engine.moveItem(itemId, newFolderId);
  });

  ipcMain.handle('item:delete', (_, itemId: string) => {
    engine.deleteItem(itemId);
  });

  ipcMain.handle('item:getInFolder', (_, folderId: string | null, workspaceId?: string) => {
    return engine.getItemsInFolder(folderId, workspaceId);
  });

  // Session operations
  ipcMain.handle('session:save', (_, activeWorkspaceId: string | null, openTabs: string[], activeTabIndex: number, aiProvider: string) => {
    engine.saveSession(activeWorkspaceId, openTabs, activeTabIndex, aiProvider as any);
  });

  ipcMain.handle('session:restore', () => {
    return engine.restoreSession();
  });

  // TODO (T028): Add BrowserView IPC handlers
}
