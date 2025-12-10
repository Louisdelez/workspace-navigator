/**
 * Preload API Contract for Workspace Navigator
 *
 * This file defines the API exposed to the renderer process via contextBridge.
 * The actual implementation lives in src/preload/api.ts
 *
 * Feature Branch: 003-workspace-navigator
 * Date: 2025-12-09
 */

import type {
  Workspace,
  Folder,
  FolderTreeNode,
  Item,
  Tab,
  TabWithItem,
  SearchResult,
  AIProviderInfo,
  AppSettings,
  NavigationState,
} from './ipc-api';

// ============================================================================
// API Interface exposed via window.api
// ============================================================================

export interface PreloadAPI {
  // -------------------------------------------------------------------------
  // Workspace
  // -------------------------------------------------------------------------
  workspace: {
    list(): Promise<Workspace[]>;
    getCurrent(): Promise<Workspace>;
    create(name: string): Promise<Workspace>;
    rename(id: string, name: string): Promise<Workspace>;
    switchTo(id: string): Promise<Workspace>;
    delete(id: string): Promise<boolean>;
  };

  // -------------------------------------------------------------------------
  // Folder
  // -------------------------------------------------------------------------
  folder: {
    getTree(workspaceId: string): Promise<FolderTreeNode[]>;
    create(workspaceId: string, parentId: string | null, name: string): Promise<Folder>;
    getOrCreateDateFolder(workspaceId: string, date: string): Promise<Folder>;
    rename(id: string, name: string): Promise<Folder>;
    move(id: string, newParentId: string | null, newPosition: number): Promise<Folder>;
    delete(id: string): Promise<boolean>;
    setExpanded(id: string, expanded: boolean): Promise<void>;
  };

  // -------------------------------------------------------------------------
  // Item
  // -------------------------------------------------------------------------
  item: {
    get(id: string): Promise<Item>;
    listByFolder(folderId: string): Promise<Item[]>;
    createWeb(folderId: string, url: string, title?: string, favicon?: string): Promise<Item>;
    createNote(folderId: string, title: string, content?: string): Promise<Item>;
    update(id: string, data: { title?: string; url?: string; favicon?: string }): Promise<Item>;
    updateContent(id: string, content: string): Promise<Item>;
    move(id: string, newFolderId: string, newPosition: number): Promise<Item>;
    delete(id: string): Promise<boolean>;
    findByUrl(url: string, workspaceId?: string): Promise<Item | null>;
    touch(id: string): Promise<void>;
  };

  // -------------------------------------------------------------------------
  // Tab
  // -------------------------------------------------------------------------
  tab: {
    list(): Promise<TabWithItem[]>;
    getActive(): Promise<TabWithItem | null>;
    open(itemId: string): Promise<TabWithItem>;
    openUrl(url: string): Promise<TabWithItem>;
    setActive(id: string): Promise<TabWithItem>;
    close(id: string): Promise<boolean>;
    reorder(tabIds: string[]): Promise<Tab[]>;
    updateNavigation(
      id: string,
      url: string,
      title: string | undefined,
      canGoBack: boolean,
      canGoForward: boolean
    ): Promise<Tab>;
    updateScroll(id: string, scrollPosition: number): Promise<void>;
    count(): Promise<{ count: number; softLimit: number; isOverLimit: boolean }>;
  };

  // -------------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------------
  search: {
    query(
      query: string,
      options?: { workspaceId?: string; type?: 'web' | 'note'; limit?: number }
    ): Promise<SearchResult[]>;
    quick(query: string, limit?: number): Promise<SearchResult[]>;
  };

  // -------------------------------------------------------------------------
  // AI Panel
  // -------------------------------------------------------------------------
  ai: {
    listProviders(): Promise<AIProviderInfo[]>;
    getCurrentProvider(): Promise<AIProviderInfo | null>;
    switchProvider(providerId: 'chatgpt' | 'claude' | 'gemini'): Promise<AIProviderInfo>;
    toggleProvider(providerId: 'chatgpt' | 'claude' | 'gemini', enabled: boolean): Promise<AIProviderInfo>;
  };

  // -------------------------------------------------------------------------
  // Session
  // -------------------------------------------------------------------------
  session: {
    save(): Promise<boolean>;
    restore(): Promise<{
      tabs: TabWithItem[];
      activeTabId: string | null;
      panelSizes: { sidebar: number; aiPanel: number };
      aiProvider: 'chatgpt' | 'claude' | 'gemini' | null;
    }>;
    clear(): Promise<boolean>;
  };

  // -------------------------------------------------------------------------
  // Settings
  // -------------------------------------------------------------------------
  settings: {
    get(): Promise<AppSettings>;
    update(settings: Partial<AppSettings>): Promise<AppSettings>;
    reset(): Promise<AppSettings>;
  };

  // -------------------------------------------------------------------------
  // Window Controls
  // -------------------------------------------------------------------------
  window: {
    minimize(): Promise<void>;
    maximize(): Promise<{ isMaximized: boolean }>;
    close(): Promise<void>;
    getState(): Promise<{
      isMaximized: boolean;
      isFullScreen: boolean;
      bounds: { x: number; y: number; width: number; height: number };
    }>;
  };

  // -------------------------------------------------------------------------
  // Event Subscriptions
  // -------------------------------------------------------------------------
  on: {
    // Tab events
    tabOpened(callback: (tab: TabWithItem) => void): () => void;
    tabClosed(callback: (data: { tabId: string }) => void): () => void;
    tabActivated(callback: (data: { tabId: string }) => void): () => void;
    tabUpdated(callback: (tab: Tab) => void): () => void;

    // Item events
    itemCreated(callback: (item: Item) => void): () => void;
    itemUpdated(callback: (item: Item) => void): () => void;
    itemDeleted(callback: (data: { itemId: string }) => void): () => void;

    // Folder events
    folderCreated(callback: (folder: Folder) => void): () => void;
    folderUpdated(callback: (folder: Folder) => void): () => void;
    folderDeleted(callback: (data: { folderId: string }) => void): () => void;

    // Navigation events
    navigationStarted(callback: (data: { tabId: string; url: string }) => void): () => void;
    navigationCompleted(
      callback: (data: { tabId: string; url: string; title: string; favicon: string | null }) => void
    ): () => void;
    navigationFailed(
      callback: (data: { tabId: string; url: string; errorCode: number; errorDescription: string }) => void
    ): () => void;

    // WebView events
    webviewReady(callback: (data: { tabId: string }) => void): () => void;
    webviewTitleUpdated(callback: (data: { tabId: string; title: string }) => void): () => void;
    webviewFaviconUpdated(callback: (data: { tabId: string; favicon: string }) => void): () => void;

    // Session events
    sessionRestoring(callback: () => void): () => void;
    sessionRestored(callback: () => void): () => void;
    sessionSaved(callback: () => void): () => void;

    // Tab limit warning
    tabsLimitWarning(callback: (data: { count: number; limit: number }) => void): () => void;
  };

  // -------------------------------------------------------------------------
  // Navigation Commands (for active webview)
  // -------------------------------------------------------------------------
  navigation: {
    goBack(tabId: string): Promise<void>;
    goForward(tabId: string): Promise<void>;
    reload(tabId: string): Promise<void>;
    stop(tabId: string): Promise<void>;
    navigateTo(tabId: string, url: string): Promise<void>;
  };
}

// ============================================================================
// Global Type Declaration
// ============================================================================

declare global {
  interface Window {
    api: PreloadAPI;
  }
}

export {};
