/**
 * Preload script - Exposes safe API to renderer process
 * Runs in isolated context with access to both Node.js and DOM APIs
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { Workspace, Folder, Item, WebItem, NoteItem, SessionState } from '../types/entities';

// Define the API that will be exposed to the renderer
const api = {
  // Workspace operations
  workspace: {
    getAll: (): Promise<Workspace[]> => ipcRenderer.invoke('workspace:getAll'),
    create: (name: string): Promise<Workspace> => ipcRenderer.invoke('workspace:create', name),
    get: (id: string): Promise<Workspace | null> => ipcRenderer.invoke('workspace:get', id),
    update: (id: string, updates: Partial<Workspace>): Promise<void> => ipcRenderer.invoke('workspace:update', id, updates),
    delete: (id: string): Promise<void> => ipcRenderer.invoke('workspace:delete', id)
  },

  // Folder operations
  folder: {
    create: (workspaceId: string, name: string, parentId?: string): Promise<Folder> =>
      ipcRenderer.invoke('folder:create', workspaceId, name, parentId),
    getTree: (workspaceId: string): Promise<any[]> => ipcRenderer.invoke('folder:getTree', workspaceId),
    move: (folderId: string, newParentId: string | null): Promise<void> =>
      ipcRenderer.invoke('folder:move', folderId, newParentId),
    delete: (folderId: string): Promise<void> => ipcRenderer.invoke('folder:delete', folderId)
  },

  // Item operations
  item: {
    createWeb: (workspaceId: string, url: string, title: string, options?: any): Promise<WebItem | { duplicate: true; existing: WebItem }> =>
      ipcRenderer.invoke('item:createWeb', workspaceId, url, title, options),
    createNote: (workspaceId: string, title: string, content?: string, options?: any): Promise<NoteItem> =>
      ipcRenderer.invoke('item:createNote', workspaceId, title, content, options),
    get: (itemId: string): Promise<Item | null> => ipcRenderer.invoke('item:get', itemId),
    update: (itemId: string, updates: Partial<Item>): Promise<void> =>
      ipcRenderer.invoke('item:update', itemId, updates),
    move: (itemId: string, newFolderId: string | null): Promise<void> =>
      ipcRenderer.invoke('item:move', itemId, newFolderId),
    delete: (itemId: string): Promise<void> => ipcRenderer.invoke('item:delete', itemId),
    getInFolder: (folderId: string | null, workspaceId?: string): Promise<Item[]> =>
      ipcRenderer.invoke('item:getInFolder', folderId, workspaceId)
  },

  // Session operations
  session: {
    save: (activeWorkspaceId: string | null, openTabs: string[], activeTabIndex: number, aiProvider: string): Promise<void> =>
      ipcRenderer.invoke('session:save', activeWorkspaceId, openTabs, activeTabIndex, aiProvider),
    restore: (): Promise<SessionState> => ipcRenderer.invoke('session:restore')
  }
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', api);

// Type declaration for TypeScript (will be in a separate .d.ts file)
export type ElectronAPI = typeof api;
