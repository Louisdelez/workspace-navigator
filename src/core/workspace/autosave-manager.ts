/**
 * Autosave Manager (T037)
 * Manages debounced autosave for Markdown notes with 500ms debounce
 * Implements FR-015: Autosave with "Saved at HH:MM:SS" indicator
 */

import { WorkspaceEngine } from './workspace-engine';
import { logger } from '../logging/logger';
import type { EventEmitter } from 'events';

interface PendingSave {
  itemId: string;
  content: string;
  timer: NodeJS.Timeout;
}

export class AutosaveManager {
  private pendingSaves: Map<string, PendingSave> = new Map();
  private readonly debounceMs: number = 500;

  constructor(
    private workspaceEngine: WorkspaceEngine,
    private eventEmitter?: EventEmitter
  ) {
    logger.info('AutosaveManager initialized');
  }

  /**
   * Schedule a save for an item with 500ms debounce
   * @param itemId - ID of the note item
   * @param content - Markdown content to save
   */
  scheduleSave(itemId: string, content: string): void {
    // Clear existing timer if present
    const existing = this.pendingSaves.get(itemId);
    if (existing) {
      clearTimeout(existing.timer);
    }

    // Create new debounced save timer
    const timer = setTimeout(async () => {
      await this.executeSave(itemId, content);
    }, this.debounceMs);

    this.pendingSaves.set(itemId, {
      itemId,
      content,
      timer
    });

    logger.debug(`Scheduled autosave for item ${itemId}`);
  }

  /**
   * Immediately flush a pending save for a specific item
   * @param itemId - ID of the item to flush
   */
  async flushSave(itemId: string): Promise<void> {
    const pending = this.pendingSaves.get(itemId);
    if (!pending) {
      logger.debug(`No pending save for item ${itemId}`);
      return;
    }

    // Cancel the timer
    clearTimeout(pending.timer);

    // Execute save immediately
    await this.executeSave(pending.itemId, pending.content);
  }

  /**
   * Flush all pending saves (called on app shutdown)
   * @param timeoutMs - Maximum time to wait for all saves (default: 3000ms)
   */
  async flushAll(timeoutMs: number = 3000): Promise<void> {
    const itemIds = Array.from(this.pendingSaves.keys());

    if (itemIds.length === 0) {
      logger.debug('No pending saves to flush');
      return;
    }

    logger.info(`Flushing ${itemIds.length} pending saves...`);

    // Create save promises for all pending saves
    const savePromises = itemIds.map(itemId => {
      const pending = this.pendingSaves.get(itemId);
      if (!pending) return Promise.resolve();

      // Cancel the timer
      clearTimeout(pending.timer);

      // Execute save
      return this.executeSave(pending.itemId, pending.content);
    });

    // Race between all saves completing and timeout
    try {
      await Promise.race([
        Promise.all(savePromises),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Flush timeout')), timeoutMs)
        )
      ]);

      logger.info(`Successfully flushed all ${itemIds.length} pending saves`);
    } catch (error) {
      if (error instanceof Error && error.message === 'Flush timeout') {
        logger.warn(`Flush timeout after ${timeoutMs}ms - some saves may be incomplete`);
      } else {
        logger.error('Error during flush all', error as Error);
      }
    }
  }

  /**
   * Execute the actual save operation
   * @param itemId - ID of the item
   * @param content - Content to save
   */
  private async executeSave(itemId: string, content: string): Promise<void> {
    try {
      // Update item content via WorkspaceEngine (content is NoteItem-specific)
      this.workspaceEngine.updateItem(itemId, { content } as any);

      // Remove from pending saves
      this.pendingSaves.delete(itemId);

      // Emit save event with timestamp
      const timestamp = this.getFormattedTimestamp();

      if (this.eventEmitter) {
        this.eventEmitter.emit('note:saved', {
          itemId,
          timestamp
        });
      }

      logger.debug(`Autosaved note ${itemId} at ${timestamp}`);
    } catch (error) {
      logger.error(`Failed to autosave note ${itemId}`, error as Error);

      // Keep in pending saves for retry
      // Note: In production, implement exponential backoff retry logic

      if (this.eventEmitter) {
        this.eventEmitter.emit('note:save-failed', {
          itemId,
          error: (error as Error).message
        });
      }

      // Rethrow to allow caller to handle
      throw error;
    }
  }

  /**
   * Get formatted timestamp for "Saved at HH:MM:SS" indicator
   */
  private getFormattedTimestamp(): string {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  /**
   * Get count of pending saves (useful for diagnostics)
   */
  getPendingCount(): number {
    return this.pendingSaves.size;
  }

  /**
   * Check if a specific item has a pending save
   */
  hasPendingSave(itemId: string): boolean {
    return this.pendingSaves.has(itemId);
  }

  /**
   * Cancel all pending saves without executing them (emergency use only)
   */
  cancelAll(): void {
    logger.warn('Cancelling all pending saves');

    for (const pending of this.pendingSaves.values()) {
      clearTimeout(pending.timer);
    }

    this.pendingSaves.clear();
  }

  /**
   * Cleanup (destroy timers)
   */
  destroy(): void {
    logger.info('Destroying AutosaveManager');
    this.cancelAll();
  }
}
