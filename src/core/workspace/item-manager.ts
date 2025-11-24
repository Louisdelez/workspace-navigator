/**
 * Item Manager
 * Handles item (web pages and markdown notes) operations
 *
 * TODO (T016-T020): Implement item CRUD operations
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import type { Item, WebItem, NoteItem } from '../types/entities';
import type { WorkspaceDatabase } from '../storage/database';

export class ItemManager {
  constructor(private _db: WorkspaceDatabase) {}

  /**
   * Create a new web item
   * TODO (T016): Implement
   */
  createWebItem(_workspaceId: string, _url: string, _title: string, _options?: any): WebItem {
    throw new Error('ItemManager.createWebItem not implemented');
  }

  /**
   * Create a new markdown note item
   * TODO (T017): Implement
   */
  createNoteItem(_workspaceId: string, _title: string, _content?: string, _options?: any): NoteItem {
    throw new Error('ItemManager.createNoteItem not implemented');
  }

  /**
   * Get an item by ID
   * TODO (T018): Implement
   */
  getItem(_itemId: string): Item | null {
    throw new Error('ItemManager.getItem not implemented');
  }

  /**
   * Update an item
   * TODO (T019): Implement
   */
  updateItem(_itemId: string, _updates: Partial<Item>): void {
    throw new Error('ItemManager.updateItem not implemented');
  }

  /**
   * Delete an item
   * TODO (T020): Implement
   */
  deleteItem(_itemId: string): void {
    throw new Error('ItemManager.deleteItem not implemented');
  }

  /**
   * Get all items in a folder
   * TODO (T021): Implement
   */
  getItemsInFolder(_folderId: string | null, _workspaceId?: string): Item[] {
    throw new Error('ItemManager.getItemsInFolder not implemented');
  }

  /**
   * Move an item to a different folder
   * TODO (T022): Implement
   */
  moveItem(_itemId: string, _newFolderId: string | null): void {
    throw new Error('ItemManager.moveItem not implemented');
  }
}
