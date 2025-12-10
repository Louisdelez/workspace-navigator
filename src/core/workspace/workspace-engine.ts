/**
 * Workspace Engine - Core business logic for workspace management
 * Implements FR-002a (duplication detection) and FR-005 (auto date folders)
 */

import { v4 as uuidv4 } from 'uuid';
import type { WorkspaceDatabase } from '../storage/database';
import type {
  Workspace,
  Folder,
  Item,
  WebItem,
  NoteItem,
  WorkspaceSettings
} from '../../types/entities';
import { generateDateFolderName } from '../../types/entities';

export class WorkspaceEngine {
  constructor(private db: WorkspaceDatabase) {}

  // ==================== WORKSPACE OPERATIONS ====================

  /**
   * Create a new workspace
   */
  createWorkspace(name: string, settings?: Partial<WorkspaceSettings>): Workspace {
    const now = Date.now();
    const workspace: Workspace = {
      id: uuidv4(),
      name,
      createdAt: now,
      updatedAt: now,
      settings: {
        theme: 'light',
        defaultAIProvider: 'none',
        autoDateFolders: true,
        tabSoftLimit: 20,
        autosaveDebounceMs: 500,
        ...settings
      },
      isDeleted: false
    };

    this.db.createWorkspace(workspace);
    return workspace;
  }

  /**
   * Get all workspaces
   */
  getAllWorkspaces(): Workspace[] {
    return this.db.getAllWorkspaces();
  }

  /**
   * Get workspace by ID
   */
  getWorkspace(id: string): Workspace | null {
    return this.db.getWorkspaceById(id);
  }

  /**
   * Update workspace
   */
  updateWorkspace(id: string, updates: Partial<Workspace>): void {
    this.db.updateWorkspace(id, updates);
  }

  /**
   * Delete workspace
   */
  deleteWorkspace(id: string): void {
    this.db.deleteWorkspace(id, false);
  }

  // ==================== FOLDER OPERATIONS ====================

  /**
   * Create a user-defined folder
   */
  createFolder(workspaceId: string, name: string, parentId?: string): Folder {
    const now = Date.now();
    const folder: Folder = {
      id: uuidv4(),
      workspaceId,
      parentId: parentId || null,
      name,
      folderType: 'user',
      createdAt: now,
      updatedAt: now,
      isDeleted: false
    };

    this.db.createFolder(folder);
    return folder;
  }

  /**
   * Get folder hierarchy for a workspace
   */
  getFolderTree(workspaceId: string): FolderNode[] {
    const rootFolders = this.db.getRootFolders(workspaceId);
    return rootFolders.map(folder => this.buildFolderNode(folder));
  }

  private buildFolderNode(folder: Folder): FolderNode {
    const children = this.db.getChildFolders(folder.id);
    const childNodes = children.map(child => this.buildFolderNode(child));
    const items = this.db.getItemsInFolder(folder.id);

    // Calculate total item count (direct items + all nested items)
    const childItemCount = childNodes.reduce((sum, node) => sum + node.itemCount, 0);

    return {
      folder,
      children: childNodes,
      items,
      itemCount: items.length + childItemCount
    };
  }

  /**
   * Move folder to new parent
   */
  moveFolder(folderId: string, newParentId: string | null): void {
    // Check for circular reference
    if (newParentId && this.wouldCreateCircularReference(folderId, newParentId)) {
      throw new Error('Cannot move folder: would create circular reference');
    }

    this.db.updateFolder(folderId, { parentId: newParentId });
  }

  private wouldCreateCircularReference(folderId: string, targetParentId: string): boolean {
    let currentId: string | null = targetParentId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === folderId) return true;
      if (visited.has(currentId)) return true; // Already circular
      visited.add(currentId);

      const folder = this.db.getFolderById(currentId);
      currentId = folder?.parentId || null;
    }

    return false;
  }

  /**
   * Delete folder
   */
  deleteFolder(folderId: string): void {
    this.db.deleteFolder(folderId);
  }

  // ==================== ITEM OPERATIONS ====================

  /**
   * Create a web item with automatic duplication detection and date folder assignment
   * Implements FR-002a and FR-005
   */
  createWebItem(
    workspaceId: string,
    url: string,
    title: string,
    options?: {
      favicon?: string;
      folderId?: string;
      skipDuplicateCheck?: boolean;
      skipAutoDateFolder?: boolean;
    }
  ): WebItem | { duplicate: true; existing: WebItem } {
    const folderId = options?.folderId || null;

    // FR-005: Auto date folder assignment (do this BEFORE duplicate check)
    let targetFolderId = folderId;
    if (!folderId && !options?.skipAutoDateFolder) {
      const workspace = this.db.getWorkspaceById(workspaceId);
      if (workspace?.settings.autoDateFolders !== false) {
        const dateFolderName = generateDateFolderName();
        const dateFolder = this.db.getOrCreateDateFolder(workspaceId, dateFolderName);
        targetFolderId = dateFolder.id;
      }
    }

    // FR-002a: Check for duplicates (use target folder after auto date assignment)
    if (!options?.skipDuplicateCheck) {
      const duplicate = this.db.findDuplicateWebItem(workspaceId, url, targetFolderId);
      if (duplicate) {
        return { duplicate: true, existing: duplicate };
      }
    }

    // Create web item
    const now = Date.now();
    const item: WebItem = {
      id: uuidv4(),
      workspaceId,
      folderId: targetFolderId,
      itemType: 'web',
      title,
      url,
      favicon: options?.favicon || null,
      createdAt: now,
      updatedAt: now,
      metadata: {
        lastAccessedAt: now,
        openCount: 0
      },
      isDeleted: false
    };

    this.db.createItem(item as any);
    return item;
  }

  /**
   * Create a note item with automatic date folder assignment
   */
  createNoteItem(
    workspaceId: string,
    title: string,
    content: string = '',
    options?: {
      folderId?: string;
      skipAutoDateFolder?: boolean;
    }
  ): NoteItem {
    const folderId = options?.folderId || null;

    // FR-005: Auto date folder assignment
    let targetFolderId = folderId;
    if (!folderId && !options?.skipAutoDateFolder) {
      const workspace = this.db.getWorkspaceById(workspaceId);
      if (workspace?.settings.autoDateFolders !== false) {
        const dateFolderName = generateDateFolderName();
        const dateFolder = this.db.getOrCreateDateFolder(workspaceId, dateFolderName);
        targetFolderId = dateFolder.id;
      }
    }

    // Create note item
    const now = Date.now();
    const item: NoteItem = {
      id: uuidv4(),
      workspaceId,
      folderId: targetFolderId,
      itemType: 'note',
      title,
      content,
      createdAt: now,
      updatedAt: now,
      metadata: {
        lastAccessedAt: now,
        openCount: 0
      },
      isDeleted: false
    };

    this.db.createItem(item as any);
    return item;
  }

  /**
   * Get item by ID
   */
  getItem(itemId: string): Item | null {
    return this.db.getItemById(itemId);
  }

  /**
   * Update item
   */
  updateItem(itemId: string, updates: Partial<Item>): void {
    this.db.updateItem(itemId, updates);
  }

  /**
   * Move item to different folder
   */
  moveItem(itemId: string, newFolderId: string | null): void {
    this.db.updateItem(itemId, { folderId: newFolderId });
  }

  /**
   * Delete item
   */
  deleteItem(itemId: string): void {
    this.db.deleteItem(itemId);
  }

  /**
   * Get all items in a folder or at workspace root
   */
  getItemsInFolder(folderId: string | null, workspaceId?: string): Item[] {
    return this.db.getItemsInFolder(folderId, workspaceId);
  }

  // ==================== SESSION MANAGEMENT ====================

  /**
   * Save current session state
   */
  saveSession(
    activeWorkspaceId: string | null,
    openTabs: string[],
    activeTabIndex: number,
    aiProvider: 'chatgpt' | 'claude' | 'gemini' | 'none'
  ): void {
    this.db.updateSessionState({
      activeWorkspaceId,
      openTabs,
      activeTabIndex,
      aiProvider
    });
  }

  /**
   * Restore session state
   */
  restoreSession() {
    return this.db.getSessionState();
  }

  /**
   * Save window state
   */
  saveWindowState(windowState: any): void {
    this.db.updateSessionState({ windowState });
  }

  // ==================== SEARCH (T046) ====================

  /**
   * Search items by title, URL, or content
   * @param workspaceId - Workspace to search in
   * @param query - Search query
   * @param limit - Maximum number of results
   * @returns Array of matching items
   */
  searchItems(workspaceId: string, query: string, limit?: number): Item[] {
    return this.db.searchItems(workspaceId, query, limit);
  }

  // ==================== TAGS (T047) ====================

  /**
   * Get all tags for a workspace
   */
  getAllTags(workspaceId: string) {
    return this.db.getAllTags(workspaceId);
  }

  /**
   * Create a new tag
   */
  createTag(workspaceId: string, name: string, color?: string) {
    return this.db.createTag(workspaceId, name, color);
  }

  /**
   * Get tags for an item
   */
  getItemTags(itemId: string) {
    return this.db.getItemTags(itemId);
  }

  /**
   * Add tags to an item
   */
  addItemTags(itemId: string, tagIds: string[]): void {
    this.db.addItemTags(itemId, tagIds);
  }

  /**
   * Remove tags from an item
   */
  removeItemTags(itemId: string, tagIds: string[]): void {
    this.db.removeItemTags(itemId, tagIds);
  }

  /**
   * Get items by tag
   */
  getItemsByTag(workspaceId: string, tagId: string) {
    return this.db.getItemsByTag(workspaceId, tagId);
  }

  /**
   * Delete a tag
   */
  deleteTag(tagId: string): void {
    this.db.deleteTag(tagId);
  }
}

/**
 * Folder tree node with children and items
 */
export interface FolderNode {
  folder: Folder;
  children: FolderNode[];
  items: Item[];
  itemCount: number; // Total items including nested
}
