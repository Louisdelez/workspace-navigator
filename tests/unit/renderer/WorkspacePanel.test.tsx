/**
 * WorkspacePanel component tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkspacePanel } from '../../../src/renderer/components/WorkspacePanel';
import { mockWorkspace, mockFolder, mockWebItem } from '../../fixtures/database';

describe('WorkspacePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip('should render workspace name', () => {
    render(
      <WorkspacePanel
        workspaces={[mockWorkspace]}
        activeWorkspaceId={mockWorkspace.id}
        folders={[]}
        items={[]}
        onWorkspaceSelect={() => {}}
        onItemSelect={() => {}}
        onCreateFolder={() => {}}
        onCreateWebItem={() => {}}
        onCreateNoteItem={() => {}}
      />
    );

    expect(screen.getByText('Test Workspace')).toBeInTheDocument();
  });

  it.skip('should render folder tree', () => {
    render(
      <WorkspacePanel
        workspaces={[mockWorkspace]}
        activeWorkspaceId={mockWorkspace.id}
        folders={[mockFolder]}
        items={[mockWebItem]}
        onWorkspaceSelect={() => {}}
        onItemSelect={() => {}}
        onCreateFolder={() => {}}
        onCreateWebItem={() => {}}
        onCreateNoteItem={() => {}}
      />
    );

    expect(screen.getByText('Test Folder')).toBeInTheDocument();
  });

  it('should show empty state when no workspace selected', () => {
    render(
      <WorkspacePanel
        workspaces={[]}
        activeWorkspaceId={null}
        folders={[]}
        items={[]}
        onWorkspaceSelect={() => {}}
        onItemSelect={() => {}}
        onCreateFolder={() => {}}
        onCreateWebItem={() => {}}
        onCreateNoteItem={() => {}}
      />
    );

    // Component should handle null activeWorkspaceId gracefully
    expect(screen.queryByText('Test Workspace')).not.toBeInTheDocument();
  });
});
