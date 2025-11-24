/**
 * WorkspaceEngine tests
 * Tests workspace management, folder hierarchy, and item operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkspaceEngine, FolderNode } from '../../../src/core/workspace/workspace-engine';
import { WorkspaceDatabase } from '../../../src/core/storage/database';
import { v4 as uuidv4 } from 'uuid';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { Workspace, Folder, WebItem, NoteItem } from '../../../src/types/entities';

describe('WorkspaceEngine', () => {
  let db: WorkspaceDatabase;
  let engine: WorkspaceEngine;
  let dbPath: string;

  beforeEach(() => {
    // Create temporary database for each test
    dbPath = join(tmpdir(), `test-engine-${uuidv4()}.db`);
    db = new WorkspaceDatabase(dbPath);
    engine = new WorkspaceEngine(db);
  });

  afterEach(() => {
    // Cleanup
    if (db) {
      db.close();
    }
    if (existsSync(dbPath)) {
      unlinkSync(dbPath);
    }
    const walPath = `${dbPath}-wal`;
    const shmPath = `${dbPath}-shm`;
    if (existsSync(walPath)) unlinkSync(walPath);
    if (existsSync(shmPath)) unlinkSync(shmPath);
  });

  describe('Workspace Operations (T018)', () => {
    describe('createWorkspace', () => {
      it('should create a workspace with valid name', () => {
        const workspace = engine.createWorkspace('Test Workspace');

        expect(workspace.id).toBeDefined();
        expect(workspace.name).toBe('Test Workspace');
        expect(workspace.isDeleted).toBe(false);
        expect(workspace.settings).toBeDefined();
        expect(workspace.settings.autoDateFolders).toBe(true);
      });

      it('should create workspace with custom settings', () => {
        const workspace = engine.createWorkspace('Custom Workspace', {
          theme: 'dark',
          autoDateFolders: false
        });

        expect(workspace.settings.theme).toBe('dark');
        expect(workspace.settings.autoDateFolders).toBe(false);
      });

      it('should set default settings', () => {
        const workspace = engine.createWorkspace('Default Workspace');

        expect(workspace.settings.theme).toBe('light');
        expect(workspace.settings.defaultAIProvider).toBe('none');
        expect(workspace.settings.tabSoftLimit).toBe(20);
        expect(workspace.settings.autosaveDebounceMs).toBe(500);
      });

      it('should generate unique IDs for each workspace', () => {
        const ws1 = engine.createWorkspace('Workspace 1');
        const ws2 = engine.createWorkspace('Workspace 2');

        expect(ws1.id).not.toBe(ws2.id);
      });
    });

    describe('getWorkspace', () => {
      it('should retrieve workspace by ID', () => {
        const created = engine.createWorkspace('Test Workspace');
        const retrieved = engine.getWorkspace(created.id);

        expect(retrieved).not.toBeNull();
        expect(retrieved?.id).toBe(created.id);
        expect(retrieved?.name).toBe('Test Workspace');
      });

      it('should return null for non-existent workspace', () => {
        const retrieved = engine.getWorkspace('non-existent-id');
        expect(retrieved).toBeNull();
      });
    });

    describe('getAllWorkspaces', () => {
      it('should return all workspaces', () => {
        engine.createWorkspace('Workspace 1');
        engine.createWorkspace('Workspace 2');
        engine.createWorkspace('Workspace 3');

        const workspaces = engine.getAllWorkspaces();
        expect(workspaces).toHaveLength(3);
      });

      it('should return empty array when no workspaces exist', () => {
        const workspaces = engine.getAllWorkspaces();
        expect(workspaces).toHaveLength(0);
      });

      it('should not return deleted workspaces', () => {
        const ws1 = engine.createWorkspace('Workspace 1');
        engine.createWorkspace('Workspace 2');

        engine.deleteWorkspace(ws1.id);

        const workspaces = engine.getAllWorkspaces();
        expect(workspaces).toHaveLength(1);
        expect(workspaces[0].name).toBe('Workspace 2');
      });
    });

    describe('updateWorkspace', () => {
      it('should update workspace name', () => {
        const workspace = engine.createWorkspace('Original Name');

        engine.updateWorkspace(workspace.id, { name: 'Updated Name' });

        const updated = engine.getWorkspace(workspace.id);
        expect(updated?.name).toBe('Updated Name');
      });

      it('should update workspace settings', () => {
        const workspace = engine.createWorkspace('Test Workspace');

        engine.updateWorkspace(workspace.id, {
          settings: { ...workspace.settings, theme: 'dark' }
        });

        const updated = engine.getWorkspace(workspace.id);
        expect(updated?.settings.theme).toBe('dark');
      });
    });

    describe('deleteWorkspace', () => {
      it('should soft delete workspace', () => {
        const workspace = engine.createWorkspace('Test Workspace');

        engine.deleteWorkspace(workspace.id);

        const retrieved = engine.getWorkspace(workspace.id);
        expect(retrieved).toBeNull();
      });

      it('should remove workspace from getAllWorkspaces', () => {
        const ws1 = engine.createWorkspace('Workspace 1');
        const ws2 = engine.createWorkspace('Workspace 2');

        engine.deleteWorkspace(ws1.id);

        const workspaces = engine.getAllWorkspaces();
        expect(workspaces).toHaveLength(1);
        expect(workspaces[0].id).toBe(ws2.id);
      });
    });
  });

  describe('Folder Management (T019)', () => {
    let workspaceId: string;

    beforeEach(() => {
      const workspace = engine.createWorkspace('Test Workspace');
      workspaceId = workspace.id;
    });

    describe('createFolder', () => {
      it('should create a root folder', () => {
        const folder = engine.createFolder(workspaceId, 'Root Folder');

        expect(folder.id).toBeDefined();
        expect(folder.name).toBe('Root Folder');
        expect(folder.workspaceId).toBe(workspaceId);
        expect(folder.parentId).toBeNull();
        expect(folder.folderType).toBe('user');
      });

      it('should create nested folder', () => {
        const parent = engine.createFolder(workspaceId, 'Parent');
        const child = engine.createFolder(workspaceId, 'Child', parent.id);

        expect(child.parentId).toBe(parent.id);
      });

      it('should create multiple levels of nesting', () => {
        const level1 = engine.createFolder(workspaceId, 'Level 1');
        const level2 = engine.createFolder(workspaceId, 'Level 2', level1.id);
        const level3 = engine.createFolder(workspaceId, 'Level 3', level2.id);

        expect(level3.parentId).toBe(level2.id);
        expect(level2.parentId).toBe(level1.id);
        expect(level1.parentId).toBeNull();
      });
    });

    describe('getFolderTree', () => {
      it('should return empty array for workspace with no folders', () => {
        const tree = engine.getFolderTree(workspaceId);
        expect(tree).toHaveLength(0);
      });

      it('should return root folders', () => {
        engine.createFolder(workspaceId, 'Folder 1');
        engine.createFolder(workspaceId, 'Folder 2');

        const tree = engine.getFolderTree(workspaceId);
        expect(tree).toHaveLength(2);
      });

      it('should build hierarchical tree structure', () => {
        const parent = engine.createFolder(workspaceId, 'Parent');
        const child1 = engine.createFolder(workspaceId, 'Child 1', parent.id);
        const child2 = engine.createFolder(workspaceId, 'Child 2', parent.id);

        const tree = engine.getFolderTree(workspaceId);

        expect(tree).toHaveLength(1);
        expect(tree[0].folder.name).toBe('Parent');
        expect(tree[0].children).toHaveLength(2);
        expect(tree[0].children.map(c => c.folder.name)).toContain('Child 1');
        expect(tree[0].children.map(c => c.folder.name)).toContain('Child 2');
      });

      it('should include items in folder nodes', () => {
        const folder = engine.createFolder(workspaceId, 'Test Folder');
        engine.createWebItem(workspaceId, 'https://example.com', 'Test Item', {
          folderId: folder.id,
          skipAutoDateFolder: true
        });

        const tree = engine.getFolderTree(workspaceId);

        expect(tree[0].items).toHaveLength(1);
        expect(tree[0].items[0].title).toBe('Test Item');
      });
    });

    describe('moveFolder', () => {
      it('should move folder to new parent', () => {
        const folder1 = engine.createFolder(workspaceId, 'Folder 1');
        const folder2 = engine.createFolder(workspaceId, 'Folder 2');

        engine.moveFolder(folder2.id, folder1.id);

        const tree = engine.getFolderTree(workspaceId);
        expect(tree).toHaveLength(1);
        expect(tree[0].children).toHaveLength(1);
        expect(tree[0].children[0].folder.id).toBe(folder2.id);
      });

      it('should move folder to root', () => {
        const parent = engine.createFolder(workspaceId, 'Parent');
        const child = engine.createFolder(workspaceId, 'Child', parent.id);

        engine.moveFolder(child.id, null);

        const tree = engine.getFolderTree(workspaceId);
        expect(tree).toHaveLength(2);
      });

      it('should prevent circular references', () => {
        const parent = engine.createFolder(workspaceId, 'Parent');
        const child = engine.createFolder(workspaceId, 'Child', parent.id);

        expect(() => {
          engine.moveFolder(parent.id, child.id);
        }).toThrow('circular reference');
      });

      it('should prevent moving folder to itself', () => {
        const folder = engine.createFolder(workspaceId, 'Folder');

        expect(() => {
          engine.moveFolder(folder.id, folder.id);
        }).toThrow('circular reference');
      });
    });

    describe('deleteFolder', () => {
      it('should delete folder', () => {
        const folder = engine.createFolder(workspaceId, 'Test Folder');

        engine.deleteFolder(folder.id);

        const tree = engine.getFolderTree(workspaceId);
        expect(tree).toHaveLength(0);
      });

      it('should soft delete folder', () => {
        const folder = engine.createFolder(workspaceId, 'Test Folder');
        const folderId = folder.id;

        engine.deleteFolder(folderId);

        // Should not appear in tree
        const tree = engine.getFolderTree(workspaceId);
        expect(tree).toHaveLength(0);

        // Direct query should return null
        const retrieved = db.getFolderById(folderId);
        expect(retrieved).toBeNull();
      });
    });
  });

  describe('Auto Date Folders (T020)', () => {
    let workspaceId: string;

    beforeEach(() => {
      const workspace = engine.createWorkspace('Test Workspace');
      workspaceId = workspace.id;
    });

    describe('Web Items', () => {
      it('should auto-create date folder for web items at root', () => {
        const item = engine.createWebItem(
          workspaceId,
          'https://example.com',
          'Test Item'
        ) as WebItem;

        expect(item.folderId).not.toBeNull();

        const tree = engine.getFolderTree(workspaceId);
        expect(tree).toHaveLength(1);
        expect(tree[0].folder.folderType).toBe('date');
        expect(tree[0].folder.name).toMatch(/^\d{2}\.\d{2}\.\d{4}$/); // DD.MM.YYYY
      });

      it('should reuse existing date folder for same day', () => {
        const item1 = engine.createWebItem(
          workspaceId,
          'https://example1.com',
          'Item 1'
        ) as WebItem;

        const item2 = engine.createWebItem(
          workspaceId,
          'https://example2.com',
          'Item 2'
        ) as WebItem;

        expect(item1.folderId).toBe(item2.folderId);

        const tree = engine.getFolderTree(workspaceId);
        expect(tree).toHaveLength(1); // Only one date folder
      });

      it('should skip auto-folder when folderId provided', () => {
        const customFolder = engine.createFolder(workspaceId, 'Custom');

        const item = engine.createWebItem(
          workspaceId,
          'https://example.com',
          'Test Item',
          { folderId: customFolder.id }
        ) as WebItem;

        expect(item.folderId).toBe(customFolder.id);

        const tree = engine.getFolderTree(workspaceId);
        expect(tree).toHaveLength(1);
        expect(tree[0].folder.folderType).toBe('user');
      });

      it('should respect autoDateFolders setting', () => {
        // Create workspace with autoDateFolders disabled
        const ws = engine.createWorkspace('No Auto Folders', {
          autoDateFolders: false
        });

        const item = engine.createWebItem(
          ws.id,
          'https://example.com',
          'Test Item'
        ) as WebItem;

        expect(item.folderId).toBeNull();
      });

      it('should skip auto-folder when skipAutoDateFolder option is true', () => {
        const item = engine.createWebItem(
          workspaceId,
          'https://example.com',
          'Test Item',
          { skipAutoDateFolder: true }
        ) as WebItem;

        expect(item.folderId).toBeNull();
      });
    });

    describe('Note Items', () => {
      it('should auto-create date folder for note items at root', () => {
        const item = engine.createNoteItem(
          workspaceId,
          'Test Note',
          'Note content'
        );

        expect(item.folderId).not.toBeNull();

        const tree = engine.getFolderTree(workspaceId);
        expect(tree).toHaveLength(1);
        expect(tree[0].folder.folderType).toBe('date');
      });

      it('should share date folder with web items', () => {
        const webItem = engine.createWebItem(
          workspaceId,
          'https://example.com',
          'Web Item'
        ) as WebItem;

        const noteItem = engine.createNoteItem(
          workspaceId,
          'Note Item',
          'Content'
        );

        expect(noteItem.folderId).toBe(webItem.folderId);

        const tree = engine.getFolderTree(workspaceId);
        expect(tree).toHaveLength(1); // Only one date folder
        expect(tree[0].items).toHaveLength(2);
      });
    });
  });

  describe('Web Item Management (T021)', () => {
    let workspaceId: string;

    beforeEach(() => {
      const workspace = engine.createWorkspace('Test Workspace');
      workspaceId = workspace.id;
    });

    describe('createWebItem', () => {
      it('should create web item with required fields', () => {
        const item = engine.createWebItem(
          workspaceId,
          'https://example.com',
          'Test Page',
          { skipAutoDateFolder: true }
        ) as WebItem;

        expect(item.id).toBeDefined();
        expect(item.url).toBe('https://example.com');
        expect(item.title).toBe('Test Page');
        expect(item.itemType).toBe('web');
        expect(item.metadata.openCount).toBe(0);
      });

      it('should set favicon when provided', () => {
        const item = engine.createWebItem(
          workspaceId,
          'https://example.com',
          'Test Page',
          {
            favicon: 'https://example.com/favicon.ico',
            skipAutoDateFolder: true
          }
        ) as WebItem;

        expect(item.favicon).toBe('https://example.com/favicon.ico');
      });
    });

    describe('Duplicate Detection (FR-002a)', () => {
      it('should detect duplicate URL in same folder on same day', () => {
        const folder = engine.createFolder(workspaceId, 'Test Folder');

        const item1 = engine.createWebItem(
          workspaceId,
          'https://example.com',
          'Original',
          { folderId: folder.id }
        ) as WebItem;

        const result = engine.createWebItem(
          workspaceId,
          'https://example.com',
          'Duplicate',
          { folderId: folder.id }
        );

        expect(result).toHaveProperty('duplicate', true);
        if ('duplicate' in result && result.duplicate) {
          expect(result.existing.id).toBe(item1.id);
        }
      });

      it('should allow same URL in different folder', () => {
        const folder1 = engine.createFolder(workspaceId, 'Folder 1');
        const folder2 = engine.createFolder(workspaceId, 'Folder 2');

        const item1 = engine.createWebItem(
          workspaceId,
          'https://example.com',
          'Item 1',
          { folderId: folder1.id }
        ) as WebItem;

        const item2 = engine.createWebItem(
          workspaceId,
          'https://example.com',
          'Item 2',
          { folderId: folder2.id }
        ) as WebItem;

        expect(item2.id).not.toBe(item1.id);
      });

      it('should skip duplicate check when skipDuplicateCheck is true', () => {
        const folder = engine.createFolder(workspaceId, 'Test Folder');

        engine.createWebItem(
          workspaceId,
          'https://example.com',
          'Original',
          { folderId: folder.id }
        );

        const item2 = engine.createWebItem(
          workspaceId,
          'https://example.com',
          'Forced Duplicate',
          { folderId: folder.id, skipDuplicateCheck: true }
        ) as WebItem;

        expect(item2.id).toBeDefined();
      });
    });

    describe('Item CRUD Operations', () => {
      it('should get item by ID', () => {
        const created = engine.createWebItem(
          workspaceId,
          'https://example.com',
          'Test Item',
          { skipAutoDateFolder: true }
        ) as WebItem;

        const retrieved = engine.getItem(created.id);

        expect(retrieved).not.toBeNull();
        expect(retrieved?.id).toBe(created.id);
      });

      it('should update item', () => {
        const item = engine.createWebItem(
          workspaceId,
          'https://example.com',
          'Original Title',
          { skipAutoDateFolder: true }
        ) as WebItem;

        engine.updateItem(item.id, { title: 'Updated Title' });

        const updated = engine.getItem(item.id);
        expect(updated?.title).toBe('Updated Title');
      });

      it('should move item to different folder', () => {
        const folder1 = engine.createFolder(workspaceId, 'Folder 1');
        const folder2 = engine.createFolder(workspaceId, 'Folder 2');

        const item = engine.createWebItem(
          workspaceId,
          'https://example.com',
          'Test Item',
          { folderId: folder1.id }
        ) as WebItem;

        engine.moveItem(item.id, folder2.id);

        const updated = engine.getItem(item.id);
        expect(updated?.folderId).toBe(folder2.id);
      });

      it('should delete item', () => {
        const item = engine.createWebItem(
          workspaceId,
          'https://example.com',
          'Test Item',
          { skipAutoDateFolder: true }
        ) as WebItem;

        engine.deleteItem(item.id);

        const retrieved = engine.getItem(item.id);
        expect(retrieved).toBeNull();
      });
    });

    describe('getItemsInFolder', () => {
      it('should get items in specific folder', () => {
        const folder = engine.createFolder(workspaceId, 'Test Folder');

        engine.createWebItem(
          workspaceId,
          'https://example1.com',
          'Item 1',
          { folderId: folder.id }
        );

        engine.createWebItem(
          workspaceId,
          'https://example2.com',
          'Item 2',
          { folderId: folder.id }
        );

        const items = engine.getItemsInFolder(folder.id);
        expect(items).toHaveLength(2);
      });

      it('should get items at workspace root', () => {
        engine.createWebItem(
          workspaceId,
          'https://example.com',
          'Root Item',
          { skipAutoDateFolder: true }
        );

        const items = engine.getItemsInFolder(null, workspaceId);
        expect(items).toHaveLength(1);
      });
    });
  });

  describe('Note Item Management (T022)', () => {
    let workspaceId: string;

    beforeEach(() => {
      const workspace = engine.createWorkspace('Test Workspace');
      workspaceId = workspace.id;
    });

    it('should create note item', () => {
      const item = engine.createNoteItem(
        workspaceId,
        'Test Note',
        'Note content',
        { skipAutoDateFolder: true }
      );

      expect(item.id).toBeDefined();
      expect(item.itemType).toBe('note');
      expect(item.title).toBe('Test Note');
      expect(item.content).toBe('Note content');
    });

    it('should create note with empty content', () => {
      const item = engine.createNoteItem(
        workspaceId,
        'Empty Note',
        undefined,
        { skipAutoDateFolder: true }
      );

      expect(item.content).toBe('');
    });

    it('should place note in specified folder', () => {
      const folder = engine.createFolder(workspaceId, 'Notes');

      const item = engine.createNoteItem(
        workspaceId,
        'Test Note',
        'Content',
        { folderId: folder.id }
      );

      expect(item.folderId).toBe(folder.id);
    });
  });
});
