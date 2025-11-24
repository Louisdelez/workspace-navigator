/**
 * WindowManager tests
 * Tests window creation, state persistence, and multi-monitor validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserWindow, screen } from 'electron';
import type { WindowState } from '../../../src/types/entities';

// Mock Electron modules
vi.mock('electron', () => ({
  BrowserWindow: vi.fn().mockImplementation(() => ({
    loadURL: vi.fn(),
    loadFile: vi.fn(),
    once: vi.fn((event, callback) => callback()),
    on: vi.fn(),
    show: vi.fn(),
    maximize: vi.fn(),
    isMaximized: vi.fn(() => false),
    getBounds: vi.fn(() => ({ width: 1400, height: 900, x: 100, y: 100 })),
    isMinimized: vi.fn(() => false),
    restore: vi.fn(),
    focus: vi.fn(),
    close: vi.fn(),
    webContents: {
      openDevTools: vi.fn()
    }
  })),
  app: {
    isPackaged: false,
    getPath: vi.fn(() => '/tmp')
  },
  screen: {
    getAllDisplays: vi.fn(() => [
      {
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        workAreaSize: { width: 1920, height: 1080 }
      }
    ]),
    getPrimaryDisplay: vi.fn(() => ({
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      workAreaSize: { width: 1920, height: 1080 }
    }))
  }
}));

// Mock WorkspaceEngine
const mockEngine = {
  restoreSession: vi.fn(() => ({
    id: 1,
    activeWorkspaceId: null,
    openTabs: [],
    activeTabIndex: 0,
    aiProvider: 'none',
    windowState: {
      width: 1400,
      height: 900,
      x: 100,
      y: 100,
      isMaximized: false
    },
    updatedAt: Date.now()
  })),
  saveWindowState: vi.fn()
};

describe('WindowManager', () => {
  let WindowManager: any;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Dynamic import to ensure mocks are applied
    const module = await import('../../../src/main/window-manager');
    WindowManager = module.WindowManager;
  });

  describe('Window Creation', () => {
    it('should create a window with restored state', () => {
      const manager = new WindowManager(mockEngine);
      manager.createWindow();

      expect(BrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 1400,
          height: 900,
          x: 100,
          y: 100
        })
      );
    });

    it('should use default dimensions if no saved state', () => {
      const engineWithoutState = {
        ...mockEngine,
        restoreSession: vi.fn(() => ({
          id: 1,
          activeWorkspaceId: null,
          openTabs: [],
          activeTabIndex: 0,
          aiProvider: 'none',
          windowState: null,
          updatedAt: Date.now()
        }))
      };

      const manager = new WindowManager(engineWithoutState);
      manager.createWindow();

      expect(BrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 1400,
          height: 900
        })
      );
    });

    it('should set minimum window dimensions', () => {
      const manager = new WindowManager(mockEngine);
      manager.createWindow();

      expect(BrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          minWidth: 800,
          minHeight: 600
        })
      );
    });

    it('should configure security settings', () => {
      const manager = new WindowManager(mockEngine);
      manager.createWindow();

      expect(BrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          webPreferences: expect.objectContaining({
            contextIsolation: true,
            nodeIntegration: false
          })
        })
      );
    });
  });

  describe('Multi-Monitor Validation', () => {
    it('should center window if position is off-screen', () => {
      // Mock display configuration where saved position is off-screen
      vi.mocked(screen.getAllDisplays).mockReturnValue([
        {
          bounds: { x: 0, y: 0, width: 1920, height: 1080 },
          workAreaSize: { width: 1920, height: 1080 }
        } as any
      ]);

      const engineWithOffscreenState = {
        ...mockEngine,
        restoreSession: vi.fn(() => ({
          id: 1,
          activeWorkspaceId: null,
          openTabs: [],
          activeTabIndex: 0,
          aiProvider: 'none',
          windowState: {
            width: 1400,
            height: 900,
            x: 5000, // Way off-screen
            y: 5000,
            isMaximized: false
          },
          updatedAt: Date.now()
        }))
      };

      const manager = new WindowManager(engineWithOffscreenState);
      manager.createWindow();

      // Should be centered on primary display
      const callArgs = vi.mocked(BrowserWindow).mock.calls[0][0];
      expect(callArgs.x).toBeLessThan(1920);
      expect(callArgs.y).toBeLessThan(1080);
    });

    it('should center window if no position saved', () => {
      const engineWithoutPosition = {
        ...mockEngine,
        restoreSession: vi.fn(() => ({
          id: 1,
          activeWorkspaceId: null,
          openTabs: [],
          activeTabIndex: 0,
          aiProvider: 'none',
          windowState: {
            width: 1400,
            height: 900,
            x: -1, // No saved position
            y: -1,
            isMaximized: false
          },
          updatedAt: Date.now()
        }))
      };

      const manager = new WindowManager(engineWithoutPosition);
      manager.createWindow();

      // Should be centered
      const callArgs = vi.mocked(BrowserWindow).mock.calls[0][0];
      expect(callArgs.x).toBeGreaterThanOrEqual(0);
      expect(callArgs.y).toBeGreaterThanOrEqual(0);
    });
  });

  describe('State Management', () => {
    it('should return the main window instance', () => {
      const manager = new WindowManager(mockEngine);
      manager.createWindow();

      const window = manager.getMainWindow();
      expect(window).toBeDefined();
    });

    it('should report if window exists', () => {
      const manager = new WindowManager(mockEngine);

      expect(manager.hasWindow()).toBe(false);

      manager.createWindow();
      expect(manager.hasWindow()).toBe(true);
    });

    it('should focus window when requested', () => {
      const manager = new WindowManager(mockEngine);
      manager.createWindow();

      const window = manager.getMainWindow();
      manager.focusWindow();

      expect(window?.focus).toHaveBeenCalled();
    });
  });
});
