/**
 * WorkspacePanel component tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { WorkspacePanel } from '../../../src/renderer/components/WorkspacePanel';
import type { Workspace, Item } from '../../../src/types/entities';

// Mock window.electronAPI
const mockElectronAPI = {
  workspace: {
    getAll: vi.fn(),
    create: vi.fn(),
    delete: vi.fn()
  },
  folder: {
    getTree: vi.fn(),
    create: vi.fn(),
    move: vi.fn()
  },
  item: {
    get: vi.fn(),
    createWeb: vi.fn(),
    createNote: vi.fn(),
    move: vi.fn()
  }
};

describe('WorkspacePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup mock electronAPI
    (window as any).electronAPI = mockElectronAPI;
    // Default: return empty arrays
    mockElectronAPI.workspace.getAll.mockResolvedValue([]);
    mockElectronAPI.folder.getTree.mockResolvedValue([]);
  });

  afterEach(() => {
    delete (window as any).electronAPI;
  });

  it('should show empty state when no workspace selected', async () => {
    await act(async () => {
      render(
        <WorkspacePanel
          activeWorkspace={null}
          onWorkspaceChange={() => {}}
          onOpenItem={() => {}}
        />
      );
    });

    // Wait for async effects to complete
    await waitFor(() => {
      expect(screen.getByText('Select or create a workspace to begin.')).toBeInTheDocument();
    });
  });

  it('should handle undefined electronAPI gracefully', async () => {
    // Remove electronAPI to simulate unavailable IPC
    delete (window as any).electronAPI;

    await act(async () => {
      render(
        <WorkspacePanel
          activeWorkspace={null}
          onWorkspaceChange={() => {}}
          onOpenItem={() => {}}
        />
      );
    });

    // Should not crash and should show empty state
    await waitFor(() => {
      expect(screen.getByText('Select or create a workspace to begin.')).toBeInTheDocument();
    });
  });

  it('should show workspace header', async () => {
    await act(async () => {
      render(
        <WorkspacePanel
          activeWorkspace={null}
          onWorkspaceChange={() => {}}
          onOpenItem={() => {}}
        />
      );
    });

    expect(screen.getByText('Workspace')).toBeInTheDocument();
    expect(screen.getByText('Select workspace...')).toBeInTheDocument();
  });

  it('should show empty folders message when workspace selected but empty', async () => {
    const mockWorkspace: Workspace = {
      id: 'test-ws-1',
      name: 'Test Workspace',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: { autoDateFolders: true },
      isDeleted: false
    };

    mockElectronAPI.folder.getTree.mockResolvedValue([]);

    await act(async () => {
      render(
        <WorkspacePanel
          activeWorkspace={mockWorkspace}
          onWorkspaceChange={() => {}}
          onOpenItem={() => {}}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('No folders yet. Create one to get started!')).toBeInTheDocument();
    });
  });

  it('should normalize non-array responses from getAll', async () => {
    // Simulate malformed response
    mockElectronAPI.workspace.getAll.mockResolvedValue(undefined);

    await act(async () => {
      render(
        <WorkspacePanel
          activeWorkspace={null}
          onWorkspaceChange={() => {}}
          onOpenItem={() => {}}
        />
      );
    });

    // Should not crash
    await waitFor(() => {
      expect(screen.getByText('Select or create a workspace to begin.')).toBeInTheDocument();
    });
  });

  it('should normalize non-array responses from getTree', async () => {
    const mockWorkspace: Workspace = {
      id: 'test-ws-1',
      name: 'Test Workspace',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: { autoDateFolders: true },
      isDeleted: false
    };

    // Simulate malformed response
    mockElectronAPI.folder.getTree.mockResolvedValue(null);

    await act(async () => {
      render(
        <WorkspacePanel
          activeWorkspace={mockWorkspace}
          onWorkspaceChange={() => {}}
          onOpenItem={() => {}}
        />
      );
    });

    // Should not crash and should show empty state
    await waitFor(() => {
      expect(screen.getByText('No folders yet. Create one to get started!')).toBeInTheDocument();
    });
  });
});
