/**
 * BrowserView Manager
 * Manages Electron BrowserView instances for web content rendering
 * Implements view pooling and lifecycle management
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

export class BrowserViewManager extends EventEmitter {
  private views: Map<string, BrowserView> = new Map();
  private viewToTabId: WeakMap<BrowserView, string> = new WeakMap();
  private availablePool: BrowserView[] = [];
  private maxPoolSize = 5; // Keep a small pool of reusable views
  private currentVisibleTabId: string | null = null;

  // AI Panel support (T042)
  private aiView: BrowserView | null = null;
  private currentAIProvider: { id: string; url: string } | null = null;

  constructor(private mainWindow: BrowserWindow) {
    super();
    logger.info('BrowserViewManager initialized');
  }

  /**
   * Create a new BrowserView for a tab
   */
  createView(tabId: string, url: string): BrowserView {
    logger.debug(`Creating view for tab ${tabId}`, { url });

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

    if (this.currentVisibleTabId === tabId) {
      this.currentVisibleTabId = null;
    }

    // Return to pool if under limit
    if (this.availablePool.length < this.maxPoolSize) {
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
   * Cleanup all views and pool
   */
  destroy(): void {
    logger.info('Destroying BrowserViewManager');

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
