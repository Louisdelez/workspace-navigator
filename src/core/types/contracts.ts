/**
 * IPC Contracts
 * Type definitions for inter-process communication between main and renderer processes
 *
 * These contracts define the API surface exposed from the main process to the renderer
 * via Electron's IPC (Inter-Process Communication) mechanism.
 *
 * @module contracts
 */

import type { Workspace, Folder, Item, WebItem, NoteItem, SessionState } from './entities';

// ==================== API Contracts ====================

/**
 * Workspace API
 *
 * Provides workspace management operations.
 * All methods are async and return Promises.
 *
 * @example
 * ```typescript
 * const workspace = await window.electronAPI.workspace.create('My Workspace');
 * const allWorkspaces = await window.electronAPI.workspace.getAll();
 * ```
 */
export interface WorkspaceAPI {
  /**
   * Get all workspaces
   * @returns Promise resolving to array of workspaces
   */
  getAll(): Promise<Workspace[]>;

  /**
   * Create a new workspace
   * @param name - Workspace name (1-100 characters)
   * @returns Promise resolving to the created workspace
   */
  create(name: string): Promise<Workspace>;

  /**
   * Get a workspace by ID
   * @param id - Workspace UUID
   * @returns Promise resolving to workspace or null if not found
   */
  get(id: string): Promise<Workspace | null>;

  /**
   * Update a workspace
   * @param id - Workspace UUID
   * @param updates - Partial workspace object with fields to update
   * @returns Promise resolving when update is complete
   */
  update(id: string, updates: Partial<Workspace>): Promise<void>;

  /**
   * Delete a workspace (soft delete)
   * @param id - Workspace UUID
   * @returns Promise resolving when deletion is complete
   */
  delete(id: string): Promise<void>;
}

/**
 * Folder API
 *
 * Provides folder management operations.
 * Folders support hierarchical nesting via parent_id relationships.
 */
export interface FolderAPI {
  /**
   * Create a new folder
   * @param workspaceId - Parent workspace UUID
   * @param name - Folder name (1-100 characters)
   * @param parentId - Optional parent folder UUID for nesting
   * @returns Promise resolving to the created folder
   */
  create(workspaceId: string, name: string, parentId?: string): Promise<Folder>;

  /**
   * Get folder tree for a workspace
   * @param workspaceId - Workspace UUID
   * @returns Promise resolving to array of folder tree nodes
   */
  getTree(workspaceId: string): Promise<FolderTreeNode[]>;

  /**
   * Move a folder to a new parent
   * @param folderId - Folder UUID to move
   * @param newParentId - New parent folder UUID (null for root)
   * @returns Promise resolving when move is complete
   */
  move(folderId: string, newParentId: string | null): Promise<void>;

  /**
   * Delete a folder and optionally its contents
   * @param folderId - Folder UUID
   * @returns Promise resolving when deletion is complete
   */
  delete(folderId: string): Promise<void>;
}

/**
 * Item API
 *
 * Provides operations for workspace items (web pages and markdown notes).
 * Includes duplicate detection for web items.
 */
export interface ItemAPI {
  /**
   * Create a new web item
   * Includes duplicate detection - if same URL exists in same folder on same day,
   * returns the existing item instead of creating a duplicate.
   *
   * @param workspaceId - Workspace UUID
   * @param url - Web page URL
   * @param title - Page title
   * @param options - Optional metadata (folderId, favicon, etc.)
   * @returns Promise resolving to created item or duplicate info
   */
  createWeb(
    workspaceId: string,
    url: string,
    title: string,
    options?: CreateWebItemOptions
  ): Promise<WebItem | { duplicate: true; existing: WebItem }>;

  /**
   * Create a new markdown note
   * @param workspaceId - Workspace UUID
   * @param title - Note title
   * @param content - Optional initial markdown content
   * @param options - Optional metadata (folderId, etc.)
   * @returns Promise resolving to the created note
   */
  createNote(
    workspaceId: string,
    title: string,
    content?: string,
    options?: CreateNoteItemOptions
  ): Promise<NoteItem>;

  /**
   * Get an item by ID
   * @param itemId - Item UUID
   * @returns Promise resolving to item or null if not found
   */
  get(itemId: string): Promise<Item | null>;

  /**
   * Update an item
   * @param itemId - Item UUID
   * @param updates - Partial item object with fields to update
   * @returns Promise resolving when update is complete
   */
  update(itemId: string, updates: Partial<Item>): Promise<void>;

  /**
   * Move an item to a different folder
   * @param itemId - Item UUID
   * @param newFolderId - Target folder UUID (null for root)
   * @returns Promise resolving when move is complete
   */
  move(itemId: string, newFolderId: string | null): Promise<void>;

  /**
   * Delete an item (soft delete)
   * @param itemId - Item UUID
   * @returns Promise resolving when deletion is complete
   */
  delete(itemId: string): Promise<void>;

  /**
   * Get all items in a folder
   * @param folderId - Folder UUID (null for root items)
   * @param workspaceId - Optional workspace UUID for filtering
   * @returns Promise resolving to array of items
   */
  getInFolder(folderId: string | null, workspaceId?: string): Promise<Item[]>;
}

/**
 * Session API
 *
 * Provides session persistence for crash recovery and state restoration.
 * Session includes active workspace, open tabs, and window state.
 */
export interface SessionAPI {
  /**
   * Save current session state
   * @param activeWorkspaceId - Currently active workspace UUID
   * @param openTabs - Array of open item UUIDs
   * @param activeTabIndex - Index of currently active tab
   * @param aiProvider - Selected AI provider
   * @returns Promise resolving when session is saved
   */
  save(
    activeWorkspaceId: string | null,
    openTabs: string[],
    activeTabIndex: number,
    aiProvider: string
  ): Promise<void>;

  /**
   * Restore session state
   * @returns Promise resolving to the restored session state
   */
  restore(): Promise<SessionState>;
}

/**
 * BrowserView API
 *
 * Provides operations for managing BrowserView instances for web content.
 * Will be implemented in Phase 4 (T027-T031).
 */
export interface BrowserViewAPI {
  /**
   * Create a new BrowserView for a URL
   * @param url - URL to load
   * @returns Promise resolving to BrowserView ID
   */
  create(url: string): Promise<string>;

  /**
   * Navigate to a different URL
   * @param viewId - BrowserView ID
   * @param url - Target URL
   * @returns Promise resolving when navigation starts
   */
  navigate(viewId: string, url: string): Promise<void>;

  /**
   * Go back in history
   * @param viewId - BrowserView ID
   * @returns Promise resolving when navigation completes
   */
  goBack(viewId: string): Promise<void>;

  /**
   * Go forward in history
   * @param viewId - BrowserView ID
   * @returns Promise resolving when navigation completes
   */
  goForward(viewId: string): Promise<void>;

  /**
   * Reload current page
   * @param viewId - BrowserView ID
   * @returns Promise resolving when reload starts
   */
  reload(viewId: string): Promise<void>;

  /**
   * Close and destroy a BrowserView
   * @param viewId - BrowserView ID
   * @returns Promise resolving when view is destroyed
   */
  close(viewId: string): Promise<void>;
}

// ==================== Event Types ====================

/**
 * Base event type with common fields
 */
interface BaseEvent {
  /** Event timestamp (Unix milliseconds) */
  timestamp: number;
}

/**
 * Workspace-related events
 */
export type WorkspaceEvent =
  | (BaseEvent & { type: 'workspace:created'; workspace: Workspace })
  | (BaseEvent & { type: 'workspace:updated'; workspace: Workspace })
  | (BaseEvent & { type: 'workspace:deleted'; workspaceId: string })
  | (BaseEvent & { type: 'workspace:activated'; workspaceId: string });

/**
 * Folder-related events
 */
export type FolderEvent =
  | (BaseEvent & { type: 'folder:created'; folder: Folder })
  | (BaseEvent & { type: 'folder:updated'; folder: Folder })
  | (BaseEvent & { type: 'folder:deleted'; folderId: string })
  | (BaseEvent & { type: 'folder:moved'; folderId: string; newParentId: string | null });

/**
 * Item-related events
 */
export type ItemEvent =
  | (BaseEvent & { type: 'item:created'; item: Item })
  | (BaseEvent & { type: 'item:updated'; item: Item })
  | (BaseEvent & { type: 'item:deleted'; itemId: string })
  | (BaseEvent & { type: 'item:moved'; itemId: string; newFolderId: string | null })
  | (BaseEvent & { type: 'item:opened'; itemId: string });

/**
 * BrowserView-related events
 */
export type BrowserViewEvent =
  | (BaseEvent & { type: 'browserview:created'; viewId: string; url: string })
  | (BaseEvent & { type: 'browserview:navigated'; viewId: string; url: string })
  | (BaseEvent & { type: 'browserview:closed'; viewId: string });

/**
 * Union of all event types
 */
export type AppEvent = WorkspaceEvent | FolderEvent | ItemEvent | BrowserViewEvent;

// ==================== Helper Types ====================

/**
 * Folder tree node for hierarchical display
 */
export interface FolderTreeNode {
  folder: Folder;
  children: FolderTreeNode[];
  items: Item[];
}

/**
 * Options for creating a web item
 */
export interface CreateWebItemOptions {
  /** Target folder UUID */
  folderId?: string;
  /** Favicon URL or data URI */
  favicon?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Options for creating a note item
 */
export interface CreateNoteItemOptions {
  /** Target folder UUID */
  folderId?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

// ==================== Complete API Surface ====================

/**
 * Complete Electron API surface exposed to renderer process
 *
 * This interface is made available via contextBridge.exposeInMainWorld()
 * and accessible in the renderer as window.electronAPI
 */
export interface ElectronAPI {
  workspace: WorkspaceAPI;
  folder: FolderAPI;
  item: ItemAPI;
  session: SessionAPI;
  browserView: BrowserViewAPI;

  /**
   * Subscribe to application events
   * @param callback - Event handler function
   * @returns Unsubscribe function
   */
  onEvent(callback: (event: AppEvent) => void): () => void;
}
