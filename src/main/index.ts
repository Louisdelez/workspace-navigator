/**
 * Electron Main Process
 * Entry point for the Workspace Navigator application
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { WorkspaceDatabase } from '../core/storage/database';
import { WorkspaceEngine } from '../core/workspace/workspace-engine';
import { AutosaveManager } from '../core/workspace/autosave-manager';
import { WindowManager } from './window-manager';
import { SessionManager } from './session-manager';
import { BrowserViewManager } from './browser-view-manager';
import { TabManager } from './tab-manager';
import { logger } from '../core/logging/logger';
import { initializeErrorHandler, handleDatabaseError } from '../core/logging/error-handler';
import { CSPManager } from '../core/security/csp';
import { SecurityAuditor } from '../core/security/security-audit';
import { CrashManager } from '../core/crash/crash-manager';
import { CrashReporter } from '../core/crash/crash-reporter';

// Initialize error handler first
initializeErrorHandler();

let db: WorkspaceDatabase;
let engine: WorkspaceEngine;
let autosaveManager: AutosaveManager;
let windowManager: WindowManager;
let sessionManager: SessionManager;
let browserViewManager: BrowserViewManager;
let tabManager: TabManager;
let crashManager: CrashManager;

// Database path
const DB_PATH = join(app.getPath('userData'), 'workspace.db');

/**
 * Initialize database and workspace engine
 */
function initializeDatabase() {
  try {
    logger.info('Initializing database', { path: DB_PATH });
    db = new WorkspaceDatabase(DB_PATH);
    engine = new WorkspaceEngine(db);
    autosaveManager = new AutosaveManager(engine);
    windowManager = new WindowManager(engine);
    sessionManager = new SessionManager(engine);
    logger.info('Database initialized successfully');
  } catch (error) {
    handleDatabaseError(error as Error, 'initialization', false);
    throw error; // Re-throw to prevent app from continuing
  }
}

/**
 * Initialize tab manager after window is created
 */
function initializeTabManager(mainWindow: BrowserWindow) {
  try {
    logger.info('Initializing TabManager');
    browserViewManager = new BrowserViewManager(mainWindow);
    tabManager = new TabManager(browserViewManager, engine, db);

    // Forward tab events to renderer
    tabManager.on('tab-event', (event) => {
      mainWindow.webContents.send('tab:event', event);
    });

    // Handle window resize
    mainWindow.on('resize', () => {
      if (tabManager) {
        tabManager.updateContentBounds();
      }
    });

    logger.info('TabManager initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize TabManager', error as Error);
    throw error;
  }
}

/**
 * Setup IPC handlers for communication with renderer
 */
function setupIpcHandlers() {
  // Workspace operations
  ipcMain.handle('workspace:getAll', () => {
    return engine.getAllWorkspaces();
  });

  ipcMain.handle('workspace:create', (_, name: string) => {
    return engine.createWorkspace(name);
  });

  ipcMain.handle('workspace:get', (_, id: string) => {
    return engine.getWorkspace(id);
  });

  ipcMain.handle('workspace:update', (_, id: string, updates: any) => {
    engine.updateWorkspace(id, updates);
  });

  ipcMain.handle('workspace:delete', (_, id: string) => {
    engine.deleteWorkspace(id);
  });

  ipcMain.handle('workspace:search', (_, workspaceId: string, query: string) => {
    return engine.searchItems(workspaceId, query, 100);
  });

  // Tag operations (T047)
  ipcMain.handle('tag:getAll', (_, workspaceId: string) => {
    return engine.getAllTags(workspaceId);
  });

  ipcMain.handle('tag:create', (_, workspaceId: string, name: string, color?: string) => {
    return engine.createTag(workspaceId, name, color);
  });

  ipcMain.handle('tag:getForItem', (_, itemId: string) => {
    return engine.getItemTags(itemId);
  });

  ipcMain.handle('tag:addToItem', (_, itemId: string, tagIds: string[]) => {
    engine.addItemTags(itemId, tagIds);
  });

  ipcMain.handle('tag:removeFromItem', (_, itemId: string, tagIds: string[]) => {
    engine.removeItemTags(itemId, tagIds);
  });

  ipcMain.handle('tag:getItems', (_, workspaceId: string, tagId: string) => {
    return engine.getItemsByTag(workspaceId, tagId);
  });

  ipcMain.handle('tag:delete', (_, tagId: string) => {
    engine.deleteTag(tagId);
  });

  // Folder operations
  ipcMain.handle('folder:create', (_, workspaceId: string, name: string, parentId?: string) => {
    return engine.createFolder(workspaceId, name, parentId);
  });

  ipcMain.handle('folder:getTree', (_, workspaceId: string) => {
    return engine.getFolderTree(workspaceId);
  });

  ipcMain.handle('folder:move', (_, folderId: string, newParentId: string | null) => {
    engine.moveFolder(folderId, newParentId);
  });

  ipcMain.handle('folder:delete', (_, folderId: string) => {
    engine.deleteFolder(folderId);
  });

  // Item operations
  ipcMain.handle('item:createWeb', (_, workspaceId: string, url: string, title: string, options?: any) => {
    return engine.createWebItem(workspaceId, url, title, options);
  });

  ipcMain.handle('item:createNote', (_, workspaceId: string, title: string, content?: string, options?: any) => {
    return engine.createNoteItem(workspaceId, title, content, options);
  });

  ipcMain.handle('item:get', (_, itemId: string) => {
    return engine.getItem(itemId);
  });

  ipcMain.handle('item:update', (_, itemId: string, updates: any) => {
    engine.updateItem(itemId, updates);
  });

  ipcMain.handle('item:move', (_, itemId: string, newFolderId: string | null) => {
    engine.moveItem(itemId, newFolderId);
  });

  ipcMain.handle('item:delete', (_, itemId: string) => {
    engine.deleteItem(itemId);
  });

  ipcMain.handle('item:getInFolder', (_, folderId: string | null, workspaceId?: string) => {
    return engine.getItemsInFolder(folderId, workspaceId);
  });

  // Session operations
  ipcMain.handle('session:save', (_, activeWorkspaceId: string | null, openTabs: string[], activeTabIndex: number, aiProvider: string) => {
    sessionManager.saveSession({
      activeWorkspaceId,
      openTabs,
      activeTabIndex,
      aiProvider: aiProvider as 'chatgpt' | 'claude' | 'gemini' | 'none'
    });
  });

  ipcMain.handle('session:restore', () => {
    return sessionManager.restoreSession();
  });

  // Tab operations (T028-T032)
  ipcMain.handle('tab:setWorkspace', (_, workspaceId: string | null) => {
    if (!tabManager) throw new Error('TabManager not initialized');
    tabManager.setWorkspace(workspaceId);
  });

  ipcMain.handle('tab:setContextFolder', (_, folderId: string | null) => {
    if (!tabManager) throw new Error('TabManager not initialized');
    tabManager.setContextFolder(folderId);
  });

  ipcMain.handle('tab:open', async (_, itemId: string) => {
    if (!tabManager) throw new Error('TabManager not initialized');
    return await tabManager.openTab(itemId);
  });

  ipcMain.handle('tab:close', (_, tabId: string) => {
    if (!tabManager) throw new Error('TabManager not initialized');
    tabManager.closeTab(tabId);
  });

  ipcMain.handle('tab:switch', (_, tabId: string) => {
    if (!tabManager) throw new Error('TabManager not initialized');
    tabManager.switchTab(tabId);
  });

  ipcMain.handle('tab:getAll', () => {
    if (!tabManager) throw new Error('TabManager not initialized');
    return tabManager.getAllTabs();
  });

  ipcMain.handle('tab:getActive', () => {
    if (!tabManager) throw new Error('TabManager not initialized');
    return tabManager.getActiveTab();
  });

  // Navigation operations
  ipcMain.handle('tab:navigate', async (_, url: string) => {
    if (!tabManager) throw new Error('TabManager not initialized');
    await tabManager.navigate(url);
  });

  ipcMain.handle('tab:goBack', () => {
    if (!tabManager) throw new Error('TabManager not initialized');
    tabManager.goBack();
  });

  ipcMain.handle('tab:goForward', () => {
    if (!tabManager) throw new Error('TabManager not initialized');
    tabManager.goForward();
  });

  ipcMain.handle('tab:reload', () => {
    if (!tabManager) throw new Error('TabManager not initialized');
    tabManager.reload();
  });

  ipcMain.handle('tab:canGoBack', () => {
    if (!tabManager) throw new Error('TabManager not initialized');
    return tabManager.canGoBack();
  });

  ipcMain.handle('tab:canGoForward', () => {
    if (!tabManager) throw new Error('TabManager not initialized');
    return tabManager.canGoForward();
  });

  // Autosave operations (T037-T038)
  ipcMain.handle('autosave:schedule', (_, itemId: string, content: string) => {
    if (!autosaveManager) throw new Error('AutosaveManager not initialized');
    autosaveManager.scheduleSave(itemId, content);
  });

  ipcMain.handle('autosave:flush', async (_, itemId: string) => {
    if (!autosaveManager) throw new Error('AutosaveManager not initialized');
    await autosaveManager.flushSave(itemId);
  });

  ipcMain.handle('autosave:getPendingCount', () => {
    if (!autosaveManager) throw new Error('AutosaveManager not initialized');
    return autosaveManager.getPendingCount();
  });

  // AI Panel operations (T042-T043)
  ipcMain.handle('ai:switchProvider', (_, providerId: string, url: string) => {
    if (!tabManager) throw new Error('TabManager not initialized');
    const browserViewManager = (tabManager as any).browserViewManager;
    if (!browserViewManager) throw new Error('BrowserViewManager not available');

    // Handle 'none' provider (destroy AI view)
    if (providerId === 'none' || !url) {
      browserViewManager.destroyAIView();
      return;
    }

    browserViewManager.switchAIProvider(providerId, url);
  });

  ipcMain.handle('ai:getCurrentProvider', () => {
    if (!tabManager) throw new Error('TabManager not initialized');
    const browserViewManager = (tabManager as any).browserViewManager;
    if (!browserViewManager) throw new Error('BrowserViewManager not available');

    return browserViewManager.getCurrentAIProvider();
  });

  // Crash operations (T056)
  ipcMain.handle('crash:getStatistics', () => {
    if (!crashManager) throw new Error('CrashManager not initialized');
    return crashManager.getStatistics();
  });

  ipcMain.handle('crash:getRecentCrashes', (_, limit?: number) => {
    if (!crashManager) throw new Error('CrashManager not initialized');
    return crashManager.getRecentCrashes(limit);
  });
}

/**
 * Restore tabs from session
 * T053: Optimized to parallelize tab restoration for faster startup
 */
async function restoreTabs() {
  try {
    logger.info('Restoring tabs from session');

    // Get session state
    const session = sessionManager.restoreSession();

    if (!session.activeWorkspaceId) {
      logger.debug('No active workspace in session, skipping tab restoration');
      return;
    }

    // Set workspace context
    if (tabManager) {
      tabManager.setWorkspace(session.activeWorkspaceId);
    }

    // T053: Restore tabs in parallel for faster startup
    const startTime = Date.now();
    let restoredCount = 0;
    let skippedCount = 0;

    // Validate all items exist first (fast database queries)
    const validItems = session.openTabs.filter(itemId => {
      try {
        const item = engine.getItem(itemId);
        if (!item) {
          logger.warn(`Skipping deleted item ${itemId} during tab restoration`);
          return false;
        }
        return true;
      } catch (error) {
        logger.error(`Error checking item ${itemId}`, error as Error);
        return false;
      }
    });

    // Open tabs in parallel (up to 3 at a time to avoid overwhelming the system)
    const BATCH_SIZE = 3;
    for (let i = 0; i < validItems.length; i += BATCH_SIZE) {
      const batch = validItems.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(itemId => tabManager ? tabManager.openTab(itemId) : Promise.reject('No tab manager'))
      );

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          restoredCount++;
        } else {
          logger.error(`Failed to restore tab for item ${batch[index]}`, result.reason);
          skippedCount++;
        }
      });
    }

    const duration = Date.now() - startTime;
    logger.info(`Tab restoration complete in ${duration}ms: ${restoredCount} restored, ${skippedCount} skipped`);
  } catch (error) {
    logger.error('Failed to restore tabs from session', error as Error);
  }
}

// Application lifecycle
app.whenReady().then(async () => {
  logger.info('Application ready, starting initialization');

  // T055: Initialize security first (after app is ready)
  logger.info('Initializing security (T055)');
  CSPManager.initialize();

  // T055: Run security audit
  const auditor = new SecurityAuditor();
  const auditResult = auditor.audit();

  if (!auditResult.passed) {
    const error = new Error('Security audit failed - application may be vulnerable');
    logger.error('Security audit failed', error, {
      criticalIssues: auditResult.criticalIssues,
      warnings: auditResult.warnings
    });
    // Log full report
    console.error(SecurityAuditor.formatReport(auditResult));
  } else {
    logger.info('Security audit passed successfully');
  }

  // T056: Initialize crash detection and recovery
  logger.info('Initializing crash detection (T056)');
  CrashReporter.initialize();
  crashManager = new CrashManager({
    autoRecover: true,
    maxRecoveryAttempts: 3,
    recoveryDelay: 2000,
    notifyUser: true
  });

  initializeDatabase();
  setupIpcHandlers();

  logger.info('Workspace Navigator starting...');

  windowManager.createWindow();

  // Initialize TabManager after window is created
  const mainWindow = windowManager.getMainWindow();
  if (mainWindow) {
    initializeTabManager(mainWindow);

    // T056: Set main window for crash manager
    crashManager.setMainWindow(mainWindow);

    // Restore tabs from session
    await restoreTabs();
  }

  app.on('activate', () => {
    logger.debug('App activated');
    if (!windowManager.hasWindow()) {
      windowManager.createWindow();
    }
  });
}).catch((error) => {
  logger.error('Failed to start application', error as Error);
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    logger.info('All windows closed, quitting application');
    // Close database connection
    if (db) {
      db.close();
    }
    app.quit();
  }
});

// T038: Flush all pending autosaves before quit
let isQuitting = false;
app.on('before-quit', async (event) => {
  if (isQuitting) {
    // Already handled, allow quit
    return;
  }

  // Prevent default quit
  event.preventDefault();
  isQuitting = true;

  logger.info('Before quit: flushing pending autosaves...');

  try {
    if (autosaveManager) {
      const pendingCount = autosaveManager.getPendingCount();

      if (pendingCount > 0) {
        logger.info(`Flushing ${pendingCount} pending autosaves...`);

        // Flush all with 3-second timeout
        await autosaveManager.flushAll(3000);

        logger.info('All autosaves flushed successfully');
      } else {
        logger.debug('No pending autosaves to flush');
      }
    }
  } catch (error) {
    logger.error('Error flushing autosaves during quit', error as Error);
    // Continue with quit even if flush fails to prevent app hang
  }

  // Now allow the app to quit
  app.quit();
});

app.on('will-quit', async () => {
  // Cleanup resources before quitting
  logger.info('Application shutting down...');

  try {
    // Destroy autosave manager
    if (autosaveManager) {
      autosaveManager.destroy();
    }

    // Destroy tab manager
    if (tabManager) {
      tabManager.destroy();
    }

    // Destroy browser view manager
    if (browserViewManager) {
      browserViewManager.destroy();
    }

    // Shutdown session manager (flush any pending saves)
    if (sessionManager) {
      sessionManager.shutdown();
    }

    // Close database connection
    if (db) {
      db.close();
    }

    // Close logger and flush all logs
    await logger.close();
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
});

// T056: Global error handlers for crash detection
process.on('uncaughtException', (error: Error) => {
  CrashManager.handleUncaughtException(error);
});

process.on('unhandledRejection', (reason: any) => {
  CrashManager.handleUnhandledRejection(reason);
});
