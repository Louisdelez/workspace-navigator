/**
 * SessionManager tests
 * Tests session save/restore, validation, and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SessionState, Workspace, Item } from '../../../src/types/entities';

// Mock WorkspaceEngine
const createMockEngine = (customMocks: any = {}) => ({
  saveSession: vi.fn(),
  restoreSession: vi.fn(() => ({
    id: 1,
    activeWorkspaceId: 'ws-1',
    openTabs: ['item-1', 'item-2'],
    activeTabIndex: 0,
    aiProvider: 'claude',
    windowState: {
      width: 1400,
      height: 900,
      x: 100,
      y: 100,
      isMaximized: false
    },
    updatedAt: Date.now()
  })),
  getWorkspace: vi.fn((id: string) => {
    if (id === 'ws-1') {
      return { id: 'ws-1', name: 'Test Workspace' } as Workspace;
    }
    return null;
  }),
  getItem: vi.fn((id: string) => {
    if (id === 'item-1' || id === 'item-2') {
      return { id, title: `Item ${id}` } as Item;
    }
    return null;
  }),
  ...customMocks
});

describe('SessionManager', () => {
  let SessionManager: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('../../../src/main/session-manager');
    SessionManager = module.SessionManager;
  });

  describe('Session Save', () => {
    it('should save session state', () => {
      const mockEngine = createMockEngine();
      const manager = new SessionManager(mockEngine);

      manager.saveSessionImmediate({
        activeWorkspaceId: 'ws-1',
        openTabs: ['item-1'],
        activeTabIndex: 0,
        aiProvider: 'claude'
      });

      expect(mockEngine.saveSession).toHaveBeenCalledWith('ws-1', ['item-1'], 0, 'claude');
    });

    it('should debounce multiple saves', async () => {
      const mockEngine = createMockEngine();
      const manager = new SessionManager(mockEngine);

      // Trigger multiple saves quickly
      manager.saveSession({
        activeWorkspaceId: 'ws-1',
        openTabs: ['item-1'],
        activeTabIndex: 0,
        aiProvider: 'claude'
      });

      manager.saveSession({
        activeWorkspaceId: 'ws-2',
        openTabs: ['item-2'],
        activeTabIndex: 0,
        aiProvider: 'chatgpt'
      });

      // Should not have saved yet (debounced)
      expect(mockEngine.saveSession).not.toHaveBeenCalled();

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 600));

      // Should save only the last state
      expect(mockEngine.saveSession).toHaveBeenCalledTimes(1);
      expect(mockEngine.saveSession).toHaveBeenCalledWith('ws-2', ['item-2'], 0, 'chatgpt');
    });

    it('should skip save if state unchanged', () => {
      const mockEngine = createMockEngine();
      const manager = new SessionManager(mockEngine);

      const state = {
        activeWorkspaceId: 'ws-1',
        openTabs: ['item-1'],
        activeTabIndex: 0,
        aiProvider: 'claude' as const
      };

      manager.saveSessionImmediate(state);
      expect(mockEngine.saveSession).toHaveBeenCalledTimes(1);

      // Save again with same state
      manager.saveSessionImmediate(state);
      expect(mockEngine.saveSession).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should handle save errors gracefully', () => {
      const mockEngine = createMockEngine({
        saveSession: vi.fn(() => {
          throw new Error('Database error');
        })
      });

      const manager = new SessionManager(mockEngine);

      // Should not throw
      expect(() => {
        manager.saveSessionImmediate({
          activeWorkspaceId: 'ws-1',
          openTabs: [],
          activeTabIndex: 0,
          aiProvider: 'none'
        });
      }).not.toThrow();
    });
  });

  describe('Session Restore', () => {
    it('should restore session state', () => {
      const mockEngine = createMockEngine();
      const manager = new SessionManager(mockEngine);

      const session = manager.restoreSession();

      expect(session.activeWorkspaceId).toBe('ws-1');
      expect(session.openTabs).toEqual(['item-1', 'item-2']);
      expect(session.activeTabIndex).toBe(0);
      expect(session.aiProvider).toBe('claude');
    });

    it('should return default session on restore error', () => {
      const mockEngine = createMockEngine({
        restoreSession: vi.fn(() => {
          throw new Error('Database error');
        })
      });

      const manager = new SessionManager(mockEngine);
      const session = manager.restoreSession();

      expect(session.activeWorkspaceId).toBeNull();
      expect(session.openTabs).toEqual([]);
      expect(session.activeTabIndex).toBe(0);
      expect(session.aiProvider).toBe('none');
    });
  });

  describe('Session Validation', () => {
    it('should clear missing workspace', () => {
      const mockEngine = createMockEngine({
        restoreSession: vi.fn(() => ({
          id: 1,
          activeWorkspaceId: 'ws-missing',
          openTabs: ['item-1'],
          activeTabIndex: 0,
          aiProvider: 'claude',
          windowState: {
            width: 1400,
            height: 900,
            x: 100,
            y: 100,
            isMaximized: false
          },
          updatedAt: Date.now()
        })),
        getWorkspace: vi.fn(() => null),
        getItem: vi.fn((id: string) => ({ id, title: 'Item' } as Item))
      });

      const manager = new SessionManager(mockEngine);
      const session = manager.restoreSession();

      expect(session.activeWorkspaceId).toBeNull();
    });

    it('should remove invalid tabs', () => {
      const mockEngine = createMockEngine({
        restoreSession: vi.fn(() => ({
          id: 1,
          activeWorkspaceId: 'ws-1',
          openTabs: ['item-1', 'item-missing', 'item-2'],
          activeTabIndex: 1,
          aiProvider: 'claude',
          windowState: {
            width: 1400,
            height: 900,
            x: 100,
            y: 100,
            isMaximized: false
          },
          updatedAt: Date.now()
        })),
        getItem: vi.fn((id: string) => {
          if (id === 'item-1' || id === 'item-2') {
            return { id, title: 'Item' } as Item;
          }
          return null;
        })
      });

      const manager = new SessionManager(mockEngine);
      const session = manager.restoreSession();

      expect(session.openTabs).toEqual(['item-1', 'item-2']);
      expect(session.openTabs).not.toContain('item-missing');
    });

    it('should fix invalid activeTabIndex', () => {
      const mockEngine = createMockEngine({
        restoreSession: vi.fn(() => ({
          id: 1,
          activeWorkspaceId: 'ws-1',
          openTabs: ['item-1', 'item-2'],
          activeTabIndex: 10, // Out of bounds
          aiProvider: 'claude',
          windowState: {
            width: 1400,
            height: 900,
            x: 100,
            y: 100,
            isMaximized: false
          },
          updatedAt: Date.now()
        }))
      });

      const manager = new SessionManager(mockEngine);
      const session = manager.restoreSession();

      expect(session.activeTabIndex).toBe(1); // Last valid index
    });

    it('should fix negative activeTabIndex', () => {
      const mockEngine = createMockEngine({
        restoreSession: vi.fn(() => ({
          id: 1,
          activeWorkspaceId: 'ws-1',
          openTabs: ['item-1'],
          activeTabIndex: -1,
          aiProvider: 'claude',
          windowState: {
            width: 1400,
            height: 900,
            x: 100,
            y: 100,
            isMaximized: false
          },
          updatedAt: Date.now()
        }))
      });

      const manager = new SessionManager(mockEngine);
      const session = manager.restoreSession();

      expect(session.activeTabIndex).toBe(0);
    });

    it('should reset invalid AI provider', () => {
      const mockEngine = createMockEngine({
        restoreSession: vi.fn(() => ({
          id: 1,
          activeWorkspaceId: 'ws-1',
          openTabs: ['item-1'],
          activeTabIndex: 0,
          aiProvider: 'invalid-provider' as any,
          windowState: {
            width: 1400,
            height: 900,
            x: 100,
            y: 100,
            isMaximized: false
          },
          updatedAt: Date.now()
        }))
      });

      const manager = new SessionManager(mockEngine);
      const session = manager.restoreSession();

      expect(session.aiProvider).toBe('none');
    });

    it('should save cleaned session if modified', () => {
      const mockEngine = createMockEngine({
        restoreSession: vi.fn(() => ({
          id: 1,
          activeWorkspaceId: 'ws-missing',
          openTabs: ['item-1', 'item-missing'],
          activeTabIndex: 5,
          aiProvider: 'claude',
          windowState: {
            width: 1400,
            height: 900,
            x: 100,
            y: 100,
            isMaximized: false
          },
          updatedAt: Date.now()
        })),
        getWorkspace: vi.fn(() => null),
        getItem: vi.fn((id: string) => {
          if (id === 'item-1') return { id, title: 'Item' } as Item;
          return null;
        })
      });

      const manager = new SessionManager(mockEngine);
      manager.restoreSession();

      // Should save the cleaned version
      expect(mockEngine.saveSession).toHaveBeenCalledWith(null, ['item-1'], 0, 'claude');
    });
  });

  describe('Session Clear', () => {
    it('should clear all session state', () => {
      const mockEngine = createMockEngine();
      const manager = new SessionManager(mockEngine);

      manager.clearSession();

      expect(mockEngine.saveSession).toHaveBeenCalledWith(null, [], 0, 'none');
    });

    it('should handle clear errors gracefully', () => {
      const mockEngine = createMockEngine({
        saveSession: vi.fn(() => {
          throw new Error('Database error');
        })
      });

      const manager = new SessionManager(mockEngine);

      expect(() => {
        manager.clearSession();
      }).not.toThrow();
    });
  });

  describe('Shutdown', () => {
    it('should cancel pending saves on shutdown', async () => {
      const mockEngine = createMockEngine();
      const manager = new SessionManager(mockEngine);

      // Trigger debounced save
      manager.saveSession({
        activeWorkspaceId: 'ws-1',
        openTabs: [],
        activeTabIndex: 0,
        aiProvider: 'none'
      });

      // Shutdown before debounce completes
      manager.shutdown();

      // Wait longer than debounce
      await new Promise(resolve => setTimeout(resolve, 600));

      // Should not have saved
      expect(mockEngine.saveSession).not.toHaveBeenCalled();
    });
  });
});
