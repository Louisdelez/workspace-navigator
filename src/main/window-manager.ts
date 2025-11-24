/**
 * Window Manager
 * Handles main window creation and state management
 *
 * Features:
 * - Window state persistence (bounds, maximized state)
 * - Multi-monitor validation
 * - Automatic state saving on resize/move
 * - Session restoration
 */

import { BrowserWindow, app, screen } from 'electron';
import { join } from 'path';
import type { WorkspaceEngine } from '../core/workspace/workspace-engine';
import type { WindowState } from '../types/entities';

const DEFAULT_WIDTH = 1400;
const DEFAULT_HEIGHT = 900;

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private engine: WorkspaceEngine;
  private saveStateTimer: NodeJS.Timeout | null = null;

  constructor(engine: WorkspaceEngine) {
    this.engine = engine;
  }

  /**
   * Create and show the main application window
   */
  createWindow(): void {
    // Restore window state from previous session
    const savedState = this.restoreWindowState();

    // Validate and adjust window bounds for current display configuration
    const validatedState = this.validateWindowBounds(savedState);

    this.mainWindow = new BrowserWindow({
      width: validatedState.width,
      height: validatedState.height,
      x: validatedState.x,
      y: validatedState.y,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      },
      show: false,
      backgroundColor: '#ffffff',
      title: 'Workspace Navigator'
    });

    // Load application content
    this.loadContent();

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      if (validatedState.isMaximized) {
        this.mainWindow?.maximize();
      }
      this.mainWindow?.show();
    });

    // Setup event listeners for state tracking
    this.setupEventListeners();
  }

  /**
   * Load the application content based on environment
   */
  private loadContent(): void {
    if (!this.mainWindow) return;

    const isDev = !app.isPackaged;

    if (isDev) {
      // Development mode - use Vite dev server
      const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
      this.mainWindow.loadURL(devUrl);
      // Dev tools disabled by default - use Ctrl+Shift+I to open manually
      // this.mainWindow.webContents.openDevTools();
    } else {
      // Production mode - load built files
      this.mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }
  }

  /**
   * Setup event listeners for window state changes
   */
  private setupEventListeners(): void {
    if (!this.mainWindow) return;

    // Debounced state saving for resize/move events
    const debouncedSave = () => {
      if (this.saveStateTimer) {
        clearTimeout(this.saveStateTimer);
      }
      this.saveStateTimer = setTimeout(() => {
        this.saveCurrentWindowState();
      }, 500);
    };

    this.mainWindow.on('resize', debouncedSave);
    this.mainWindow.on('move', debouncedSave);

    // Immediate save for maximize/unmaximize
    this.mainWindow.on('maximize', () => this.saveCurrentWindowState());
    this.mainWindow.on('unmaximize', () => this.saveCurrentWindowState());

    // Save state before closing
    this.mainWindow.on('close', () => {
      if (this.saveStateTimer) {
        clearTimeout(this.saveStateTimer);
      }
      this.saveCurrentWindowState();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  /**
   * Restore window state from session database
   */
  private restoreWindowState(): WindowState {
    try {
      const session = this.engine.restoreSession();

      if (session.windowState) {
        return session.windowState;
      }
    } catch (error) {
      console.error('Failed to restore window state:', error);
    }

    // Return default state if restoration fails
    // Use -1 to indicate no saved position (will be centered by validateWindowBounds)
    return {
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      x: -1,
      y: -1,
      isMaximized: false
    };
  }

  /**
   * Validate window bounds against current display configuration
   * Ensures window is visible on at least one monitor
   */
  private validateWindowBounds(state: WindowState): WindowState {
    const displays = screen.getAllDisplays();

    // If no position saved (-1) or no displays found, center on primary display
    if (state.x < 0 || state.y < 0 || displays.length === 0) {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.workAreaSize;

      return {
        width: state.width || DEFAULT_WIDTH,
        height: state.height || DEFAULT_HEIGHT,
        x: Math.round((width - (state.width || DEFAULT_WIDTH)) / 2),
        y: Math.round((height - (state.height || DEFAULT_HEIGHT)) / 2),
        isMaximized: state.isMaximized
      };
    }

    // Check if saved position is visible on any display
    const isVisible = displays.some(display => {
      const { x, y, width, height } = display.bounds;
      const windowX = state.x!;
      const windowY = state.y!;

      // Check if at least part of the window is visible
      return (
        windowX + state.width > x &&
        windowX < x + width &&
        windowY + state.height > y &&
        windowY < y + height
      );
    });

    if (isVisible) {
      return state;
    }

    // Window is off-screen, reset to primary display
    console.log('Window bounds not visible on any display, resetting to primary');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    return {
      width: state.width || DEFAULT_WIDTH,
      height: state.height || DEFAULT_HEIGHT,
      x: Math.round((width - (state.width || DEFAULT_WIDTH)) / 2),
      y: Math.round((height - (state.height || DEFAULT_HEIGHT)) / 2),
      isMaximized: false // Don't restore maximized state if position was invalid
    };
  }

  /**
   * Save current window state to database
   */
  private saveCurrentWindowState(): void {
    if (!this.mainWindow) return;

    try {
      const bounds = this.mainWindow.getBounds();
      const isMaximized = this.mainWindow.isMaximized();

      const state: WindowState = {
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        isMaximized
      };

      this.engine.saveWindowState(state);
    } catch (error) {
      console.error('Failed to save window state:', error);
    }
  }

  /**
   * Get the main application window
   */
  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  /**
   * Close the main window
   */
  closeWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.close();
    }
  }

  /**
   * Focus the main window
   */
  focusWindow(): void {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.focus();
    }
  }

  /**
   * Check if main window exists
   */
  hasWindow(): boolean {
    return this.mainWindow !== null;
  }
}
