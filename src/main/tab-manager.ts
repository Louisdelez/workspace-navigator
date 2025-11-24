/**
 * Tab Manager
 * Manages tab lifecycle, switching, and synchronization with workspace items
 * Implements T028-T034 requirements
 */

import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { BrowserViewManager, ViewEvent } from './browser-view-manager';
import { WorkspaceEngine } from '../core/workspace/workspace-engine';
import { DuplicationDetector } from '../core/workspace/duplication-detector';
import { WorkspaceDatabase } from '../core/storage/database';
import { logger } from '../core/logging/logger';
import type { Item, WebItem } from '../types/entities';

export interface Tab {
  id: string;
  itemId: string;
  type: 'web' | 'note';
  url?: string;
  title: string;
  favicon?: string | null;
  isLoading: boolean;
}

export interface TabEvent {
  type: 'opened' | 'closed' | 'switched' | 'updated' | 'limit-warning';
  tab?: Tab;
  tabs?: Tab[];
  activeTabId?: string;
}

export class TabManager extends EventEmitter {
  private tabs: Tab[] = [];
  private activeTabId: string | null = null;
  private softLimit = 20; // Soft limit for open tabs
  private duplicationDetector: DuplicationDetector;
  private currentWorkspaceId: string | null = null;
  private contextFolderId: string | null = null; // Track context folder for auto-creation

  constructor(
    private browserViewManager: BrowserViewManager,
    private workspaceEngine: WorkspaceEngine,
    database: WorkspaceDatabase
  ) {
    super();

    // Initialize duplication detector
    this.duplicationDetector = new DuplicationDetector(database);

    // Subscribe to browser view events
    this.browserViewManager.on('view-event', this.handleViewEvent.bind(this));

    logger.info('TabManager initialized');
  }

  /**
   * Set current workspace for auto-creation context
   */
  setWorkspace(workspaceId: string | null): void {
    this.currentWorkspaceId = workspaceId;
    logger.debug(`Set current workspace to ${workspaceId}`);
  }

  /**
   * Set context folder for auto-creation
   */
  setContextFolder(folderId: string | null): void {
    this.contextFolderId = folderId;
    logger.debug(`Set context folder to ${folderId}`);
  }

  /**
   * Open a new tab for an item
   */
  async openTab(itemId: string): Promise<Tab> {
    logger.debug(`Opening tab for item ${itemId}`);

    // Check soft limit
    if (this.tabs.length >= this.softLimit) {
      this.emit('tab-event', {
        type: 'limit-warning'
      } as TabEvent);
      logger.warn(`Tab soft limit reached (${this.softLimit} tabs)`);
    }

    // Get item from workspace engine
    const item = this.workspaceEngine.getItem(itemId);
    if (!item) {
      throw new Error(`Item ${itemId} not found`);
    }

    // Track workspace and folder context
    this.currentWorkspaceId = item.workspaceId;
    if (item.folderId) {
      this.contextFolderId = item.folderId;
    }

    // Check if tab already open for this item
    const existingTab = this.tabs.find(t => t.itemId === itemId);
    if (existingTab) {
      logger.debug(`Tab already open for item ${itemId}, switching to it`);
      this.switchTab(existingTab.id);
      return existingTab;
    }

    // Create new tab
    const tabId = uuidv4();
    const tab: Tab = {
      id: tabId,
      itemId: item.id,
      type: item.itemType,
      url: item.itemType === 'web' ? (item as WebItem).url : undefined,
      title: item.title,
      favicon: item.itemType === 'web' ? (item as WebItem).favicon : null,
      isLoading: false
    };

    // Create BrowserView for web items
    if (item.itemType === 'web') {
      const webItem = item as WebItem;
      this.browserViewManager.createView(tabId, webItem.url);
      tab.isLoading = true;
    }

    // Add tab and set as active
    this.tabs.push(tab);
    this.activeTabId = tabId;

    // Show the view
    if (item.itemType === 'web') {
      this.browserViewManager.showView(tabId);
    }

    // Emit event
    this.emit('tab-event', {
      type: 'opened',
      tab,
      tabs: this.tabs,
      activeTabId: this.activeTabId
    } as TabEvent);

    logger.info(`Opened tab ${tabId} for item ${itemId}`, { title: tab.title });
    return tab;
  }

  /**
   * Close a tab
   */
  closeTab(tabId: string): void {
    logger.debug(`Closing tab ${tabId}`);

    const tabIndex = this.tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) {
      logger.warn(`Attempted to close non-existent tab ${tabId}`);
      return;
    }

    const tab = this.tabs[tabIndex];
    if (!tab) return;

    // Destroy BrowserView if web tab
    if (tab.type === 'web') {
      this.browserViewManager.destroyView(tabId);
    }

    // Remove tab
    this.tabs.splice(tabIndex, 1);

    // Handle active tab change
    if (this.activeTabId === tabId) {
      if (this.tabs.length > 0) {
        // Switch to adjacent tab (prefer next, fallback to previous)
        const newIndex = Math.min(tabIndex, this.tabs.length - 1);
        const newActiveTab = this.tabs[newIndex];
        if (newActiveTab) {
          this.switchTab(newActiveTab.id);
        }
      } else {
        this.activeTabId = null;
      }
    }

    // Emit event
    this.emit('tab-event', {
      type: 'closed',
      tab,
      tabs: this.tabs,
      activeTabId: this.activeTabId
    } as TabEvent);

    logger.info(`Closed tab ${tabId}`, { title: tab.title });
  }

  /**
   * Switch to a different tab
   */
  switchTab(tabId: string): void {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab) {
      logger.warn(`Attempted to switch to non-existent tab ${tabId}`);
      return;
    }

    logger.debug(`Switching to tab ${tabId}`);

    // Hide current active view
    if (this.activeTabId && this.activeTabId !== tabId) {
      const currentTab = this.tabs.find(t => t.id === this.activeTabId);
      if (currentTab && currentTab.type === 'web') {
        this.browserViewManager.hideView(this.activeTabId);
      }
    }

    // Show new active view
    if (tab && tab.type === 'web') {
      this.browserViewManager.showView(tabId);
    }

    // Update active tab
    this.activeTabId = tabId;

    // Emit event
    this.emit('tab-event', {
      type: 'switched',
      tab,
      tabs: this.tabs,
      activeTabId: this.activeTabId
    } as TabEvent);

    logger.debug(`Switched to tab ${tabId}`, { title: tab.title });
  }

  /**
   * Navigate active tab to a new URL
   */
  async navigate(url: string): Promise<void> {
    if (!this.activeTabId) {
      logger.warn('No active tab to navigate');
      return;
    }

    const tab = this.tabs.find(t => t.id === this.activeTabId);
    if (!tab || tab.type !== 'web') {
      logger.warn('Active tab is not a web tab');
      return;
    }

    logger.info(`Navigating active tab to ${url}`);
    this.browserViewManager.navigateView(this.activeTabId, url);
  }

  /**
   * Navigation: Go back in active tab
   */
  goBack(): void {
    if (this.activeTabId) {
      this.browserViewManager.goBack(this.activeTabId);
    }
  }

  /**
   * Navigation: Go forward in active tab
   */
  goForward(): void {
    if (this.activeTabId) {
      this.browserViewManager.goForward(this.activeTabId);
    }
  }

  /**
   * Navigation: Reload active tab
   */
  reload(): void {
    if (this.activeTabId) {
      this.browserViewManager.reload(this.activeTabId);
    }
  }

  /**
   * Check if active tab can go back
   */
  canGoBack(): boolean {
    return this.activeTabId ? this.browserViewManager.canGoBack(this.activeTabId) : false;
  }

  /**
   * Check if active tab can go forward
   */
  canGoForward(): boolean {
    return this.activeTabId ? this.browserViewManager.canGoForward(this.activeTabId) : false;
  }

  /**
   * Get active tab
   */
  getActiveTab(): Tab | null {
    return this.activeTabId ? this.tabs.find(t => t.id === this.activeTabId) || null : null;
  }

  /**
   * Get all tabs
   */
  getAllTabs(): Tab[] {
    return [...this.tabs];
  }

  /**
   * Get tab by ID
   */
  getTab(tabId: string): Tab | undefined {
    return this.tabs.find(t => t.id === tabId);
  }

  /**
   * Handle browser view events
   */
  private handleViewEvent(event: ViewEvent): void {
    const tab = this.tabs.find(t => t.id === event.tabId);
    if (!tab) return;

    let updated = false;

    switch (event.type) {
      case 'navigate':
        if (event.url && tab.url !== event.url) {
          tab.url = event.url;
          updated = true;
          logger.debug(`Tab ${tab.id} navigated to ${event.url}`);

          // Handle automatic item creation for new URLs
          this.handleNavigation(tab, event.url);
        }
        break;

      case 'title-updated':
        if (event.title && tab.title !== event.title) {
          tab.title = event.title;
          updated = true;
          logger.debug(`Tab ${tab.id} title updated to ${event.title}`);

          // Update item title in database
          this.workspaceEngine.updateItem(tab.itemId, { title: event.title });
        }
        break;

      case 'favicon-updated':
        if (event.favicon && tab.favicon !== event.favicon) {
          tab.favicon = event.favicon;
          updated = true;
          logger.debug(`Tab ${tab.id} favicon updated`);

          // Update item favicon in database (only for web items)
          if (tab.type === 'web') {
            this.workspaceEngine.updateItem(tab.itemId, { favicon: event.favicon } as any);
          }
        }
        break;

      case 'loading-start':
        tab.isLoading = true;
        updated = true;
        break;

      case 'loading-stop':
        tab.isLoading = false;
        updated = true;
        break;

      case 'load-failed':
        tab.isLoading = false;
        updated = true;
        logger.error(`Tab ${tab.id} failed to load`, undefined, {
          url: event.url,
          error: event.error
        });
        break;
    }

    // Emit update event if tab changed
    if (updated) {
      this.emit('tab-event', {
        type: 'updated',
        tab,
        tabs: this.tabs,
        activeTabId: this.activeTabId
      } as TabEvent);
    }
  }

  /**
   * Handle navigation to a new URL - check for duplicates and auto-create items
   */
  private handleNavigation(tab: Tab, url: string): void {
    // Skip if no workspace context
    if (!this.currentWorkspaceId) {
      logger.debug('No workspace context, skipping auto-creation');
      return;
    }

    // Skip internal URLs and data URIs
    if (url.startsWith('about:') || url.startsWith('data:') || url.startsWith('file:')) {
      logger.debug('Skipping internal URL', { url });
      return;
    }

    // Get the original item to check if URL changed
    const originalItem = this.workspaceEngine.getItem(tab.itemId);
    if (!originalItem || originalItem.itemType !== 'web') {
      return;
    }

    const originalWebItem = originalItem as WebItem;

    // Skip if navigated to same URL as original item
    if (originalWebItem.url === url) {
      logger.debug('Navigated to original item URL, no action needed');
      return;
    }

    // Check for duplicate
    const duplicate = this.duplicationDetector.checkDuplicate(
      this.currentWorkspaceId,
      url,
      this.contextFolderId
    );

    if (duplicate) {
      logger.info('Duplicate item found for navigation', { url, duplicateId: duplicate.id });

      // Check if there's already a tab open for this item
      const existingTab = this.tabs.find(t => t.itemId === duplicate.id);
      if (existingTab) {
        logger.debug('Switching to existing tab for duplicate item');
        this.switchTab(existingTab.id);
        // Close the current tab since we're switching to the duplicate
        this.closeTab(tab.id);
      } else {
        // Update current tab to link to the duplicate item
        logger.debug('Linking current tab to duplicate item');
        tab.itemId = duplicate.id;
        tab.title = duplicate.title;
        if (duplicate.itemType === 'web') {
          tab.favicon = (duplicate as WebItem).favicon;
        }

        this.emit('tab-event', {
          type: 'updated',
          tab,
          tabs: this.tabs,
          activeTabId: this.activeTabId
        } as TabEvent);
      }
    } else {
      // No duplicate - create new web item
      logger.info('No duplicate found, creating new web item', { url });

      try {
        const newItem = this.workspaceEngine.createWebItem(
          this.currentWorkspaceId!,
          url,
          tab.title || url, // Use tab title if available, otherwise URL
          {
            folderId: this.contextFolderId || undefined,
            favicon: tab.favicon || undefined
          }
        );

        // Handle potential duplicate result from WorkspaceEngine
        if ('duplicate' in newItem && newItem.duplicate) {
          logger.debug('WorkspaceEngine detected duplicate', { existingId: newItem.existing.id });
          // Link tab to existing item
          tab.itemId = newItem.existing.id;
          tab.title = newItem.existing.title;
          if (newItem.existing.itemType === 'web') {
            tab.favicon = (newItem.existing as WebItem).favicon || null;
          }
        } else {
          // Link tab to new item (newItem is WebItem)
          const webItem = newItem as WebItem;
          logger.info('Created new web item for navigation', { itemId: webItem.id, url });
          tab.itemId = webItem.id;
          tab.title = webItem.title;
          tab.favicon = webItem.favicon || null;
        }

        this.emit('tab-event', {
          type: 'updated',
          tab,
          tabs: this.tabs,
          activeTabId: this.activeTabId
        } as TabEvent);
      } catch (error) {
        logger.error('Failed to create web item for navigation', error as Error, { url });
      }
    }
  }

  /**
   * Update content bounds (called on window resize)
   */
  updateContentBounds(): void {
    this.browserViewManager.updateContentBounds();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    logger.info('Destroying TabManager');

    // Close all tabs
    const tabIds = this.tabs.map(t => t.id);
    for (const tabId of tabIds) {
      this.closeTab(tabId);
    }

    this.removeAllListeners();
  }
}
