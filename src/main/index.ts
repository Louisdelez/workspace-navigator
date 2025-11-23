/**
 * Electron Main Process
 * Entry point for the Workspace Navigator application
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { WorkspaceDatabase } from '../core/storage/database';
import { WorkspaceEngine } from '../core/workspace/workspace-engine';

let mainWindow: BrowserWindow | null = null;
let db: WorkspaceDatabase;
let engine: WorkspaceEngine;

// Database path
const DB_PATH = join(app.getPath('userData'), 'workspace.db');

/**
 * Create main application window
 */
function createWindow() {
  // Restore window state from session
  const sessionState = engine.restoreSession();
  const windowState = sessionState.windowState || {
    width: 1400,
    height: 900,
    x: undefined,
    y: undefined,
    isMaximized: false
  };

  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false  // Disabled for development
    },
    show: false
  });

  // Load URL based on environment
  const isDev = !app.isPackaged;

  if (isDev) {
    // In development, use Vite dev server
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    if (windowState.isMaximized) {
      mainWindow?.maximize();
    }
    mainWindow?.show();
  });

  // Save window state on resize/move
  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);
  mainWindow.on('maximize', saveWindowState);
  mainWindow.on('unmaximize', saveWindowState);

  // Save session before closing
  mainWindow.on('close', () => {
    saveWindowState();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Save current window state to database
 */
function saveWindowState() {
  if (!mainWindow) return;

  const bounds = mainWindow.getBounds();
  const windowState = {
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    isMaximized: mainWindow.isMaximized()
  };

  engine.saveWindowState(windowState);
}

/**
 * Initialize database and workspace engine
 */
function initializeDatabase() {
  db = new WorkspaceDatabase(DB_PATH);
  engine = new WorkspaceEngine(db);
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
    engine.saveSession(activeWorkspaceId, openTabs, activeTabIndex, aiProvider as any);
  });

  ipcMain.handle('session:restore', () => {
    return engine.restoreSession();
  });
}

// Application lifecycle
app.whenReady().then(() => {
  initializeDatabase();
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Close database connection
    db.close();
    app.quit();
  }
});

app.on('will-quit', () => {
  // Cleanup
  if (db) {
    db.close();
  }
});

// Handle unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});
