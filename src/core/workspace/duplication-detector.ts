/**
 * Duplication Detector
 * Checks for duplicate web items based on URL, workspace, folder, and date
 * Used for automatic item creation during navigation
 */

import type { WorkspaceDatabase } from '../storage/database';
import type { Item } from '../../types/entities';
import { logger } from '../logging/logger';

export class DuplicationDetector {
  constructor(private database: WorkspaceDatabase) {
    logger.info('DuplicationDetector initialized');
  }

  /**
   * Check if a URL already exists as an item in the workspace
   * Duplicate criteria:
   * - Same workspace
   * - Same URL
   * - Same folder (or both null)
   * - Same day (created_at)
   */
  checkDuplicate(
    workspaceId: string,
    url: string,
    contextFolderId: string | null = null
  ): Item | null {
    try {
      // Get today's date boundaries (start and end of day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todayEnd = tomorrow.toISOString();

      // Query for duplicate item
      let query: string;
      let params: any[];

      if (contextFolderId === null) {
        // Check for items in workspace root
        query = `
          SELECT * FROM items
          WHERE workspace_id = ?
            AND url = ?
            AND folder_id IS NULL
            AND created_at >= ?
            AND created_at < ?
            AND is_deleted = 0
          LIMIT 1
        `;
        params = [workspaceId, url, todayStart, todayEnd];
      } else {
        // Check for items in specific folder
        query = `
          SELECT * FROM items
          WHERE workspace_id = ?
            AND url = ?
            AND folder_id = ?
            AND created_at >= ?
            AND created_at < ?
            AND is_deleted = 0
          LIMIT 1
        `;
        params = [workspaceId, url, contextFolderId, todayStart, todayEnd];
      }

      const row = this.database.prepare(query).get(...params) as any;

      if (row) {
        logger.debug('Duplicate item found', { url, folderId: contextFolderId });
        return this.rowToItem(row);
      }

      logger.debug('No duplicate found', { url, folderId: contextFolderId });
      return null;
    } catch (error) {
      logger.error('Error checking for duplicate', error as Error, { url, workspaceId });
      return null;
    }
  }

  /**
   * Convert database row to Item object
   */
  private rowToItem(row: any): Item {
    const baseItem = {
      id: row.id,
      workspaceId: row.workspace_id,
      folderId: row.folder_id,
      itemType: row.item_type as 'web' | 'note',
      title: row.title,
      isDeleted: row.deleted_at !== null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    };

    if (row.item_type === 'web') {
      return {
        ...baseItem,
        itemType: 'web' as const,
        url: row.url,
        favicon: row.favicon
      } as Item;
    } else {
      return {
        ...baseItem,
        itemType: 'note' as const,
        content: row.content
      } as Item;
    }
  }
}
