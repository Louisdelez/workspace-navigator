/**
 * BrowserView Manager
 * Manages Electron BrowserView instances for web content rendering
 * Implements view pooling and lifecycle management
 * T054: Enhanced with memory management and monitoring
 */

import { BrowserView, BrowserWindow } from 'electron';
import { EventEmitter } from 'events';
import { logger } from '../core/logging/logger';

export interface ViewBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewEvent {
  type: 'navigate' | 'title-updated' | 'favicon-updated' | 'loading-start' | 'loading-stop' | 'load-failed';
  tabId: string;
  url?: string;
  title?: string;
  favicon?: string;
  error?: { code: number; description: string };
}

// T054: Memory management configuration
interface MemoryConfig {
  maxPoolSize: number;           // Maximum views to keep in pool
  maxActiveViews: number;         // Maximum concurrent active views
  memoryCheckInterval: number;    // Memory check interval (ms)
  memoryThresholdMB: number;      // Memory threshold for cleanup (MB)
}

// T054: Memory statistics
export interface MemoryStats {
  activeViews: number;
  pooledViews: number;
  totalMemoryMB: number;
  processMemoryMB: number;
  heapUsedMB: number;
  timestamp: number;
}

export class BrowserViewManager extends EventEmitter {
  private views: Map<string, BrowserView> = new Map();
  private viewToTabId: WeakMap<BrowserView, string> = new WeakMap();
  private availablePool: BrowserView[] = [];
  private currentVisibleTabId: string | null = null;

  // T054: Track last access time for LRU eviction
  private viewAccessTimes: Map<string, number> = new Map();

  // AI Panel support (T042)
  private aiView: BrowserView | null = null;
  private currentAIProvider: { id: string; url: string } | null = null;

  // T054: Memory management
  private config: MemoryConfig = {
    maxPoolSize: 3,                  // Reduced from 5 for better memory
    maxActiveViews: 10,              // Limit concurrent active tabs
    memoryCheckInterval: 30000,      // Check every 30 seconds
    memoryThresholdMB: 500           // Cleanup if process > 500MB
  };
  private memoryCheckTimer: NodeJS.Timeout | null = null;
  private lastMemoryStats: MemoryStats | null = null;

  constructor(private mainWindow: BrowserWindow) {
    super();
    logger.info('BrowserViewManager initialized with memory management (T054)');

    // T054: Start memory monitoring
    this.startMemoryMonitoring();
  }

  /**
   * Create a new BrowserView for a tab
   * T054: Enhanced with LRU tracking and view limit enforcement
   */
  createView(tabId: string, url: string): BrowserView {
    logger.debug(`Creating view for tab ${tabId}`, { url });

    // T054: Check if we need to evict views due to limit
    if (this.views.size >= this.config.maxActiveViews) {
      logger.warn(`Maximum active views (${this.config.maxActiveViews}) reached, evicting LRU view`);
      this.evictLRUView();
    }

    // Try to reuse from pool
    let view = this.availablePool.pop();

    if (!view) {
      // Create new BrowserView
      view = new BrowserView({
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
          webSecurity: true,
          allowRunningInsecureContent: false
        }
      });

      logger.debug('Created new BrowserView instance');
    } else {
      logger.debug('Reused BrowserView from pool');
    }

    // Track view
    this.views.set(tabId, view);
    this.viewToTabId.set(view, tabId);

    // T054: Track access time for LRU
    this.viewAccessTimes.set(tabId, Date.now());

    // Attach to main window
    this.mainWindow.addBrowserView(view);

    // Set up event listeners
    this.setupEventListeners(view, tabId);

    // Set initial bounds (hidden off-screen initially)
    view.setBounds({ x: 0, y: 0, width: 0, height: 0 });

    // Load URL
    view.webContents.loadURL(url).catch(err => {
      logger.error(`Failed to load URL in view for tab ${tabId}`, err, { url });
    });

    return view;
  }

  /**
   * Show a view and hide others
   * T054: Updates access time for LRU tracking
   */
  showView(tabId: string): void {
    const view = this.views.get(tabId);
    if (!view) {
      logger.warn(`Attempted to show non-existent view for tab ${tabId}`);
      return;
    }

    // Hide currently visible view
    if (this.currentVisibleTabId && this.currentVisibleTabId !== tabId) {
      this.hideView(this.currentVisibleTabId);
    }

    // Calculate bounds for center content area
    const bounds = this.calculateContentBounds();
    view.setBounds(bounds);

    // T054: Update access time for LRU
    this.viewAccessTimes.set(tabId, Date.now());

    this.currentVisibleTabId = tabId;
    logger.debug(`Showed view for tab ${tabId}`, { bounds });
  }

  /**
   * Hide a view by setting it off-screen
   */
  hideView(tabId: string): void {
    const view = this.views.get(tabId);
    if (!view) return;

    // Set bounds to zero to hide
    view.setBounds({ x: 0, y: 0, width: 0, height: 0 });

    if (this.currentVisibleTabId === tabId) {
      this.currentVisibleTabId = null;
    }

    logger.debug(`Hid view for tab ${tabId}`);
  }

  /**
   * Destroy a view and optionally return it to pool
   * T054: Enhanced with access time cleanup
   */
  destroyView(tabId: string): void {
    const view = this.views.get(tabId);
    if (!view) return;

    logger.debug(`Destroying view for tab ${tabId}`);

    // Remove from window
    this.mainWindow.removeBrowserView(view);

    // Remove tracking
    this.views.delete(tabId);
    this.viewToTabId.delete(view);
    this.viewAccessTimes.delete(tabId); // T054: Clean up access time

    if (this.currentVisibleTabId === tabId) {
      this.currentVisibleTabId = null;
    }

    // Return to pool if under limit
    if (this.availablePool.length < this.config.maxPoolSize) {
      // Clear history and reset state
      view.webContents.clearHistory();
      this.availablePool.push(view);
      logger.debug('Returned view to pool');
    } else {
      // Destroy the view
      try {
        (view.webContents as any).destroy();
      } catch (err) {
        logger.warn('Error destroying webContents', err as Error);
      }
      logger.debug('Destroyed view (pool full)');
    }
  }

  /**
   * Navigate a view to a new URL
   */
  navigateView(tabId: string, url: string): void {
    const view = this.views.get(tabId);
    if (!view) {
      logger.warn(`Attempted to navigate non-existent view for tab ${tabId}`);
      return;
    }

    logger.debug(`Navigating view for tab ${tabId}`, { url });
    view.webContents.loadURL(url).catch(err => {
      logger.error(`Failed to navigate to URL for tab ${tabId}`, err, { url });
    });
  }

  /**
   * Navigation: Go back
   */
  goBack(tabId: string): void {
    const view = this.views.get(tabId);
    if (view && view.webContents.canGoBack()) {
      view.webContents.goBack();
      logger.debug(`Went back for tab ${tabId}`);
    }
  }

  /**
   * Navigation: Go forward
   */
  goForward(tabId: string): void {
    const view = this.views.get(tabId);
    if (view && view.webContents.canGoForward()) {
      view.webContents.goForward();
      logger.debug(`Went forward for tab ${tabId}`);
    }
  }

  /**
   * Navigation: Reload
   */
  reload(tabId: string): void {
    const view = this.views.get(tabId);
    if (view) {
      view.webContents.reload();
      logger.debug(`Reloaded tab ${tabId}`);
    }
  }

  /**
   * Check if can go back
   */
  canGoBack(tabId: string): boolean {
    const view = this.views.get(tabId);
    return view ? view.webContents.canGoBack() : false;
  }

  /**
   * Check if can go forward
   */
  canGoForward(tabId: string): boolean {
    const view = this.views.get(tabId);
    return view ? view.webContents.canGoForward() : false;
  }

  /**
   * Get current URL of a view
   */
  getCurrentURL(tabId: string): string | null {
    const view = this.views.get(tabId);
    return view ? view.webContents.getURL() : null;
  }

  /**
   * Get view for a tab
   */
  getView(tabId: string): BrowserView | undefined {
    return this.views.get(tabId);
  }

  /**
   * Update content bounds for all views (called on window resize)
   */
  updateContentBounds(): void {
    if (this.currentVisibleTabId) {
      const bounds = this.calculateContentBounds();
      const view = this.views.get(this.currentVisibleTabId);
      if (view) {
        view.setBounds(bounds);
        logger.debug('Updated content bounds', { bounds });
      }
    }

    // Also update AI panel bounds if active
    this.updateAIBounds();
  }

  /**
   * Calculate bounds for the center content area
   * Accounts for workspace panel, tab bar, and AI panel
   */
  private calculateContentBounds(): ViewBounds {
    const windowBounds = this.mainWindow.getBounds();

    // Layout constants (should match renderer layout)
    const WORKSPACE_PANEL_WIDTH = 280;
    const TAB_BAR_HEIGHT = 40;
    const NAV_BAR_HEIGHT = 50;
    const AI_PANEL_WIDTH = this.aiView ? 400 : 0; // AI panel width when active

    return {
      x: WORKSPACE_PANEL_WIDTH,
      y: TAB_BAR_HEIGHT + NAV_BAR_HEIGHT,
      width: windowBounds.width - WORKSPACE_PANEL_WIDTH - AI_PANEL_WIDTH,
      height: windowBounds.height - TAB_BAR_HEIGHT - NAV_BAR_HEIGHT
    };
  }

  /**
   * Calculate bounds for the AI panel (right sidebar)
   */
  private calculateAIPanelBounds(): ViewBounds {
    const windowBounds = this.mainWindow.getBounds();

    const WORKSPACE_PANEL_WIDTH = 280;
    const AI_PANEL_WIDTH = 400;
    const AI_PANEL_HEADER_HEIGHT = 100; // Space for provider selector

    return {
      x: windowBounds.width - AI_PANEL_WIDTH,
      y: AI_PANEL_HEADER_HEIGHT,
      width: AI_PANEL_WIDTH,
      height: windowBounds.height - AI_PANEL_HEADER_HEIGHT
    };
  }

  /**
   * Set up event listeners for a BrowserView
   */
  private setupEventListeners(view: BrowserView, tabId: string): void {
    const webContents = view.webContents;

    // Navigation events
    webContents.on('did-navigate', (event, url) => {
      this.emit('view-event', {
        type: 'navigate',
        tabId,
        url
      } as ViewEvent);
    });

    webContents.on('did-navigate-in-page', (event, url) => {
      this.emit('view-event', {
        type: 'navigate',
        tabId,
        url
      } as ViewEvent);
    });

    // Title updates
    webContents.on('page-title-updated', (event, title) => {
      this.emit('view-event', {
        type: 'title-updated',
        tabId,
        title
      } as ViewEvent);
    });

    // Favicon updates
    webContents.on('page-favicon-updated', (event, favicons) => {
      if (favicons && favicons.length > 0) {
        this.emit('view-event', {
          type: 'favicon-updated',
          tabId,
          favicon: favicons[0] // Use first favicon
        } as ViewEvent);
      }
    });

    // Loading events
    webContents.on('did-start-loading', () => {
      this.emit('view-event', {
        type: 'loading-start',
        tabId
      } as ViewEvent);
    });

    webContents.on('did-stop-loading', () => {
      this.emit('view-event', {
        type: 'loading-stop',
        tabId
      } as ViewEvent);
    });

    // Load failures
    webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      // Ignore aborted loads (user navigated away)
      if (errorCode === -3) return; // ERR_ABORTED

      if (isMainFrame) {
        this.emit('view-event', {
          type: 'load-failed',
          tabId,
          url: validatedURL,
          error: {
            code: errorCode,
            description: errorDescription
          }
        } as ViewEvent);
      }
    });
  }

  /**
   * Create or switch AI BrowserView (T042)
   * Each provider gets its own persistent session
   */
  createAIView(providerId: string, url: string): void {
    logger.info(`Creating AI view for provider: ${providerId}`, { url });

    // Destroy existing AI view if switching providers
    if (this.aiView) {
      logger.debug('Destroying existing AI view before creating new one');
      this.mainWindow.removeBrowserView(this.aiView);
      try {
        (this.aiView.webContents as any).destroy();
      } catch (err) {
        logger.warn('Error destroying existing AI view', err as Error);
      }
      this.aiView = null;
    }

    // Create new AI BrowserView with persistent session
    this.aiView = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        partition: `persist:ai-${providerId}`, // Separate persistent session per provider (T043)
        allowRunningInsecureContent: false
      }
    });

    this.currentAIProvider = { id: providerId, url };

    // Attach to window
    this.mainWindow.addBrowserView(this.aiView);

    // Set bounds
    const bounds = this.calculateAIPanelBounds();
    this.aiView.setBounds(bounds);

    // Update content area bounds (AI panel now takes space)
    if (this.currentVisibleTabId) {
      const contentBounds = this.calculateContentBounds();
      const view = this.views.get(this.currentVisibleTabId);
      if (view) {
        view.setBounds(contentBounds);
      }
    }

    // Load URL
    this.aiView.webContents.loadURL(url).catch(err => {
      logger.error(`Failed to load AI provider URL`, err, { providerId, url });
    });

    logger.info(`AI view created successfully for ${providerId}`);
  }

  /**
   * Switch AI provider (convenience method)
   */
  switchAIProvider(providerId: string, url: string): void {
    this.createAIView(providerId, url);
  }

  /**
   * Destroy AI view (when user selects 'none')
   */
  destroyAIView(): void {
    if (!this.aiView) return;

    logger.info('Destroying AI view');

    this.mainWindow.removeBrowserView(this.aiView);
    try {
      (this.aiView.webContents as any).destroy();
    } catch (err) {
      logger.warn('Error destroying AI view', err as Error);
    }

    this.aiView = null;
    this.currentAIProvider = null;

    // Recalculate content area bounds (AI panel no longer takes space)
    if (this.currentVisibleTabId) {
      const contentBounds = this.calculateContentBounds();
      const view = this.views.get(this.currentVisibleTabId);
      if (view) {
        view.setBounds(contentBounds);
      }
    }

    logger.info('AI view destroyed');
  }

  /**
   * Get current AI provider info
   */
  getCurrentAIProvider(): { id: string; url: string } | null {
    return this.currentAIProvider;
  }

  /**
   * Update AI view bounds (called on window resize)
   */
  updateAIBounds(): void {
    if (this.aiView) {
      const bounds = this.calculateAIPanelBounds();
      this.aiView.setBounds(bounds);
      logger.debug('Updated AI panel bounds', { bounds });
    }
  }

  /**
   * T054: Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    if (this.memoryCheckTimer) {
      return; // Already monitoring
    }

    logger.info('Starting memory monitoring', {
      interval: this.config.memoryCheckInterval,
      threshold: this.config.memoryThresholdMB
    });

    this.memoryCheckTimer = setInterval(() => {
      this.checkMemoryPressure();
    }, this.config.memoryCheckInterval);

    // Initial check
    this.checkMemoryPressure();
  }

  /**
   * T054: Stop memory monitoring
   */
  private stopMemoryMonitoring(): void {
    if (this.memoryCheckTimer) {
      clearInterval(this.memoryCheckTimer);
      this.memoryCheckTimer = null;
      logger.info('Stopped memory monitoring');
    }
  }

  /**
   * T054: Get current memory statistics
   */
  getMemoryStats(): MemoryStats {
    const processMemory = process.memoryUsage();

    const stats: MemoryStats = {
      activeViews: this.views.size,
      pooledViews: this.availablePool.length,
      totalMemoryMB: Math.round((processMemory.rss) / 1024 / 1024),
      processMemoryMB: Math.round((processMemory.external + processMemory.heapUsed) / 1024 / 1024),
      heapUsedMB: Math.round(processMemory.heapUsed / 1024 / 1024),
      timestamp: Date.now()
    };

    this.lastMemoryStats = stats;
    return stats;
  }

  /**
   * T054: Check for memory pressure and cleanup if needed
   */
  private checkMemoryPressure(): void {
    const stats = this.getMemoryStats();

    logger.debug('Memory stats', stats);

    // Check if we're above threshold
    if (stats.totalMemoryMB > this.config.memoryThresholdMB) {
      logger.warn(`Memory pressure detected: ${stats.totalMemoryMB}MB > ${this.config.memoryThresholdMB}MB threshold`);
      this.cleanupMemory();
    }

    // Always clear pool if we have too many pooled views
    if (this.availablePool.length > this.config.maxPoolSize) {
      const excess = this.availablePool.length - this.config.maxPoolSize;
      logger.debug(`Clearing ${excess} excess pooled views`);

      for (let i = 0; i < excess; i++) {
        const view = this.availablePool.pop();
        if (view) {
          try {
            (view.webContents as any).destroy();
          } catch (err) {
            logger.warn('Error destroying excess pooled view', err as Error);
          }
        }
      }
    }
  }

  /**
   * T054: Evict the least recently used view (excluding currently visible)
   */
  private evictLRUView(): void {
    // Find LRU view (oldest access time, excluding current visible)
    let lruTabId: string | null = null;
    let oldestTime = Infinity;

    for (const [tabId, accessTime] of this.viewAccessTimes.entries()) {
      if (tabId !== this.currentVisibleTabId && accessTime < oldestTime) {
        oldestTime = accessTime;
        lruTabId = tabId;
      }
    }

    if (lruTabId) {
      logger.info(`Evicting LRU view for tab ${lruTabId} (last accessed: ${new Date(oldestTime).toISOString()})`);
      this.destroyView(lruTabId);

      // Emit event so TabManager can update tab state
      this.emit('view-evicted', { tabId: lruTabId });
    }
  }

  /**
   * T054: Aggressive memory cleanup
   */
  private cleanupMemory(): void {
    logger.info('Starting aggressive memory cleanup');

    const beforeStats = this.getMemoryStats();

    // 1. Clear all pooled views
    while (this.availablePool.length > 0) {
      const view = this.availablePool.pop();
      if (view) {
        try {
          (view.webContents as any).destroy();
        } catch (err) {
          logger.warn('Error destroying pooled view during cleanup', err as Error);
        }
      }
    }

    // 2. Clear cache and history for hidden views
    for (const [tabId, view] of this.views.entries()) {
      if (tabId !== this.currentVisibleTabId) {
        try {
          view.webContents.session.clearCache();
          view.webContents.clearHistory();
        } catch (err) {
          logger.warn(`Error clearing cache for tab ${tabId}`, err as Error);
        }
      }
    }

    // 3. Force garbage collection if available
    if (global.gc) {
      logger.debug('Forcing garbage collection');
      global.gc();
    }

    const afterStats = this.getMemoryStats();
    const saved = beforeStats.totalMemoryMB - afterStats.totalMemoryMB;

    logger.info(`Memory cleanup complete. Freed ${saved}MB`, {
      before: beforeStats.totalMemoryMB,
      after: afterStats.totalMemoryMB
    });
  }

  /**
   * Cleanup all views and pool
   */
  destroy(): void {
    logger.info('Destroying BrowserViewManager');

    // T054: Stop memory monitoring
    this.stopMemoryMonitoring();

    // Destroy AI view first
    if (this.aiView) {
      this.mainWindow.removeBrowserView(this.aiView);
      try {
        (this.aiView.webContents as any).destroy();
      } catch (err) {
        logger.warn('Error destroying AI view', err as Error);
      }
      this.aiView = null;
      this.currentAIProvider = null;
    }

    // Destroy all active views
    for (const [tabId, view] of this.views.entries()) {
      this.mainWindow.removeBrowserView(view);
      try {
        (view.webContents as any).destroy();
      } catch (err) {
        logger.warn(`Error destroying view for tab ${tabId}`, err as Error);
      }
    }

    // Destroy pool views
    for (const view of this.availablePool) {
      try {
        (view.webContents as any).destroy();
      } catch (err) {
        logger.warn('Error destroying pooled view', err as Error);
      }
    }

    this.views.clear();
    this.availablePool = [];
    this.removeAllListeners();
  }
}
