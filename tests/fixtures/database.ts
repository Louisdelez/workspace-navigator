/**
 * Database test fixtures
 */

import type { Workspace, Folder, Item } from '../../src/types/entities';

export const mockWorkspace: Workspace = {
  id: 'workspace-1',
  name: 'Test Workspace',
  createdAt: Date.now(),
  lastActiveAt: Date.now()
};

export const mockFolder: Folder = {
  id: 'folder-1',
  workspaceId: 'workspace-1',
  parentId: null,
  name: 'Test Folder',
  displayOrder: 0
};

export const mockWebItem: Item = {
  id: 'item-1',
  workspaceId: 'workspace-1',
  folderId: 'folder-1',
  type: 'web',
  url: 'https://example.com',
  title: 'Example Website',
  favicon: null,
  createdAt: Date.now()
};

export const mockNoteItem: Item = {
  id: 'item-2',
  workspaceId: 'workspace-1',
  folderId: 'folder-1',
  type: 'note',
  content: '# Test Note\n\nThis is a test note.',
  title: 'Test Note',
  favicon: null,
  createdAt: Date.now()
};

/**
 * Create a temporary in-memory database for testing
 */
export function createTestDatabase() {
  // TODO: Implement in-memory SQLite database for testing
  // Will use better-sqlite3 with :memory: database
  return null;
}
