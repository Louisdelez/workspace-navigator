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
    delete: (id: string): Promise<void> => ipcRenderer.invoke('workspace:delete', id),
    search: (workspaceId: string, query: string): Promise<Item[]> => ipcRenderer.invoke('workspace:search', workspaceId, query)
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
  },

  // Tab operations
  tab: {
    setWorkspace: (workspaceId: string | null): Promise<void> =>
      ipcRenderer.invoke('tab:setWorkspace', workspaceId),
    setContextFolder: (folderId: string | null): Promise<void> =>
      ipcRenderer.invoke('tab:setContextFolder', folderId),
    open: (itemId: string): Promise<any> => ipcRenderer.invoke('tab:open', itemId),
    close: (tabId: string): Promise<void> => ipcRenderer.invoke('tab:close', tabId),
    switch: (tabId: string): Promise<void> => ipcRenderer.invoke('tab:switch', tabId),
    getAll: (): Promise<any[]> => ipcRenderer.invoke('tab:getAll'),
    getActive: (): Promise<any | null> => ipcRenderer.invoke('tab:getActive'),
    navigate: (url: string): Promise<void> => ipcRenderer.invoke('tab:navigate', url),
    goBack: (): Promise<void> => ipcRenderer.invoke('tab:goBack'),
    goForward: (): Promise<void> => ipcRenderer.invoke('tab:goForward'),
    reload: (): Promise<void> => ipcRenderer.invoke('tab:reload'),
    canGoBack: (): Promise<boolean> => ipcRenderer.invoke('tab:canGoBack'),
    canGoForward: (): Promise<boolean> => ipcRenderer.invoke('tab:canGoForward'),
    onEvent: (callback: (event: any) => void) => {
      ipcRenderer.on('tab:event', (_, event) => callback(event));
    }
  },

  // Autosave operations (T037-T038)
  autosave: {
    schedule: (itemId: string, content: string): Promise<void> =>
      ipcRenderer.invoke('autosave:schedule', itemId, content),
    flush: (itemId: string): Promise<void> =>
      ipcRenderer.invoke('autosave:flush', itemId),
    getPendingCount: (): Promise<number> =>
      ipcRenderer.invoke('autosave:getPendingCount')
  },

  // AI Panel operations (T041-T043)
  ai: {
    switchProvider: (providerId: string, url: string): Promise<void> =>
      ipcRenderer.invoke('ai:switchProvider', providerId, url),
    getCurrentProvider: (): Promise<{ id: string; url: string } | null> =>
      ipcRenderer.invoke('ai:getCurrentProvider')
  },

  // Tag operations (T047)
  tag: {
    getAll: (workspaceId: string): Promise<any[]> =>
      ipcRenderer.invoke('tag:getAll', workspaceId),
    create: (workspaceId: string, name: string, color?: string): Promise<any> =>
      ipcRenderer.invoke('tag:create', workspaceId, name, color),
    getForItem: (itemId: string): Promise<any[]> =>
      ipcRenderer.invoke('tag:getForItem', itemId),
    addToItem: (itemId: string, tagIds: string[]): Promise<void> =>
      ipcRenderer.invoke('tag:addToItem', itemId, tagIds),
    removeFromItem: (itemId: string, tagIds: string[]): Promise<void> =>
      ipcRenderer.invoke('tag:removeFromItem', itemId, tagIds),
    getItems: (workspaceId: string, tagId: string): Promise<any[]> =>
      ipcRenderer.invoke('tag:getItems', workspaceId, tagId),
    delete: (tagId: string): Promise<void> =>
      ipcRenderer.invoke('tag:delete', tagId)
  },

  // Crash operations (T056)
  crash: {
    getStatistics: (): Promise<{ total: number; byType: Record<string, number>; lastCrash?: number }> =>
      ipcRenderer.invoke('crash:getStatistics'),
    getRecentCrashes: (limit?: number): Promise<any[]> =>
      ipcRenderer.invoke('crash:getRecentCrashes', limit),
    onUnresponsive: (callback: () => void) => {
      ipcRenderer.on('app:unresponsive', callback);
    },
    onResponsive: (callback: () => void) => {
      ipcRenderer.on('app:responsive', callback);
    }
  },

  // Markdown asset operations (T014)
  markdown: {
    /**
     * Copy an image to the workspace assets folder
     */
    copyAsset: (request: {
      sourcePath: string;
      workspaceId: string;
      description?: string;
    }): Promise<{
      success: true;
      assetPath: string;
      markdownLink: string;
    } | {
      success: false;
      error: 'FILE_NOT_FOUND' | 'INVALID_FORMAT' | 'FILE_TOO_LARGE' | 'COPY_FAILED';
      message: string;
    }> => ipcRenderer.invoke('markdown:copyAsset', request),

    /**
     * Get the assets directory path for a workspace
     */
    getAssetPath: (workspaceId: string): Promise<string> =>
      ipcRenderer.invoke('markdown:getAssetPath', workspaceId),

    /**
     * Open file selection dialog for images
     */
    selectImage: (): Promise<{ cancelled: true } | { cancelled: false; filePath: string }> =>
      ipcRenderer.invoke('markdown:selectImage'),

    /**
     * Delete an asset from the workspace
     */
    deleteAsset: (request: {
      assetPath: string;
      workspaceId: string;
    }): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('markdown:deleteAsset', request)
  }
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', api);

// Type declaration for TypeScript (will be in a separate .d.ts file)
export type ElectronAPI = typeof api;
