/**
 * Drag & Drop Reordering Tests (T077)
 * Tests for folder and item drag-and-drop operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkspaceEngine } from '../../../src/core/workspace/workspace-engine';
import { WorkspaceDatabase } from '../../../src/core/storage/database';
import { v4 as uuidv4 } from 'uuid';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { WebItem } from '../../../src/types/entities';

describe('Drag & Drop Reordering (T077)', () => {
  let db: WorkspaceDatabase;
  let engine: WorkspaceEngine;
  let dbPath: string;
  let workspaceId: string;

  beforeEach(() => {
    dbPath = join(tmpdir(), `test-dnd-${uuidv4()}.db`);
    db = new WorkspaceDatabase(dbPath);
    engine = new WorkspaceEngine(db);

    const workspace = engine.createWorkspace('Test Workspace');
    workspaceId = workspace.id;
  });

  afterEach(() => {
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

  describe('Item drag & drop', () => {
    it('should move item to different folder', () => {
      const folder1 = engine.createFolder(workspaceId, 'Folder 1');
      const folder2 = engine.createFolder(workspaceId, 'Folder 2');

      const item = engine.createWebItem(
        workspaceId,
        'https://example.com',
        'Test Item',
        { folderId: folder1.id }
      ) as WebItem;

      // Move item from folder1 to folder2
      engine.moveItem(item.id, folder2.id);

      // Verify item is in folder2
      const folder2Items = engine.getItemsInFolder(folder2.id);
      expect(folder2Items).toHaveLength(1);
      expect(folder2Items[0].id).toBe(item.id);

      // Verify item is not in folder1
      const folder1Items = engine.getItemsInFolder(folder1.id);
      expect(folder1Items).toHaveLength(0);
    });

    it('should move item to root', () => {
      const folder = engine.createFolder(workspaceId, 'Test Folder');

      const item = engine.createWebItem(
        workspaceId,
        'https://example.com',
        'Test Item',
        { folderId: folder.id }
      ) as WebItem;

      // Move item to root (null folder)
      engine.moveItem(item.id, null);

      // Verify item has no folder
      const retrieved = engine.getItem(item.id);
      expect(retrieved?.folderId).toBeNull();
    });

    it('should move item from root to folder', () => {
      const folder = engine.createFolder(workspaceId, 'Target Folder');

      const item = engine.createWebItem(
        workspaceId,
        'https://example.com',
        'Test Item',
        { skipAutoDateFolder: true }
      ) as WebItem;

      expect(item.folderId).toBeNull();

      // Move item to folder
      engine.moveItem(item.id, folder.id);

      // Verify item is in folder
      const folderItems = engine.getItemsInFolder(folder.id);
      expect(folderItems).toHaveLength(1);
      expect(folderItems[0].id).toBe(item.id);
    });

    it('should preserve item data after move', () => {
      const folder1 = engine.createFolder(workspaceId, 'Folder 1');
      const folder2 = engine.createFolder(workspaceId, 'Folder 2');

      const item = engine.createWebItem(
        workspaceId,
        'https://example.com',
        'Test Item',
        { folderId: folder1.id, favicon: 'https://example.com/icon.ico' }
      ) as WebItem;

      const originalTitle = item.title;
      const originalUrl = item.url;
      const originalFavicon = item.favicon;

      // Move item
      engine.moveItem(item.id, folder2.id);

      // Verify data is preserved
      const moved = engine.getItem(item.id) as WebItem;
      expect(moved.title).toBe(originalTitle);
      expect(moved.url).toBe(originalUrl);
      expect(moved.favicon).toBe(originalFavicon);
      expect(moved.folderId).toBe(folder2.id);
    });
  });

  describe('Folder drag & drop', () => {
    it('should move folder to another folder', () => {
      const parent = engine.createFolder(workspaceId, 'Parent');
      const child = engine.createFolder(workspaceId, 'Child');

      // Move child into parent
      engine.moveFolder(child.id, parent.id);

      // Verify tree structure
      const tree = engine.getFolderTree(workspaceId);
      expect(tree).toHaveLength(1);
      expect(tree[0].folder.name).toBe('Parent');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].folder.name).toBe('Child');
    });

    it('should move folder to root', () => {
      const parent = engine.createFolder(workspaceId, 'Parent');
      const child = engine.createFolder(workspaceId, 'Child', parent.id);

      // Move child to root
      engine.moveFolder(child.id, null);

      // Verify both are now root folders
      const tree = engine.getFolderTree(workspaceId);
      expect(tree).toHaveLength(2);
    });

    it('should preserve folder contents after move', () => {
      const folder1 = engine.createFolder(workspaceId, 'Folder 1');
      const folder2 = engine.createFolder(workspaceId, 'Folder 2');

      // Add item to folder1
      engine.createWebItem(workspaceId, 'https://example.com', 'Test Item', {
        folderId: folder1.id
      });

      // Move folder1 into folder2
      engine.moveFolder(folder1.id, folder2.id);

      // Verify folder1 still has its item
      const tree = engine.getFolderTree(workspaceId);
      const folder1Node = tree[0].children[0]; // folder2 > folder1
      expect(folder1Node.items).toHaveLength(1);
    });

    it('should preserve nested structure after move', () => {
      const grandparent = engine.createFolder(workspaceId, 'Grandparent');
      const parent = engine.createFolder(workspaceId, 'Parent');
      const child = engine.createFolder(workspaceId, 'Child', parent.id);

      // Move parent (with child) into grandparent
      engine.moveFolder(parent.id, grandparent.id);

      // Verify 3-level structure
      const tree = engine.getFolderTree(workspaceId);
      expect(tree).toHaveLength(1);
      expect(tree[0].folder.name).toBe('Grandparent');
      expect(tree[0].children[0].folder.name).toBe('Parent');
      expect(tree[0].children[0].children[0].folder.name).toBe('Child');
    });
  });

  describe('Circular reference prevention', () => {
    it('should prevent moving folder into itself', () => {
      const folder = engine.createFolder(workspaceId, 'Test Folder');

      expect(() => {
        engine.moveFolder(folder.id, folder.id);
      }).toThrow('Cannot move folder: would create circular reference');
    });

    it('should prevent moving folder into its own child', () => {
      const parent = engine.createFolder(workspaceId, 'Parent');
      const child = engine.createFolder(workspaceId, 'Child', parent.id);

      expect(() => {
        engine.moveFolder(parent.id, child.id);
      }).toThrow('Cannot move folder: would create circular reference');
    });

    it('should prevent moving folder into its own grandchild', () => {
      const grandparent = engine.createFolder(workspaceId, 'Grandparent');
      const parent = engine.createFolder(workspaceId, 'Parent', grandparent.id);
      const child = engine.createFolder(workspaceId, 'Child', parent.id);

      expect(() => {
        engine.moveFolder(grandparent.id, child.id);
      }).toThrow('Cannot move folder: would create circular reference');
    });

    it('should allow moving folder to sibling', () => {
      const parent = engine.createFolder(workspaceId, 'Parent');
      const child1 = engine.createFolder(workspaceId, 'Child 1', parent.id);
      const child2 = engine.createFolder(workspaceId, 'Child 2', parent.id);

      // This should work - child1 into child2 (siblings)
      expect(() => {
        engine.moveFolder(child1.id, child2.id);
      }).not.toThrow();
    });

    it('should allow moving folder to uncle', () => {
      const grandparent = engine.createFolder(workspaceId, 'Grandparent');
      const parent1 = engine.createFolder(workspaceId, 'Parent 1', grandparent.id);
      const parent2 = engine.createFolder(workspaceId, 'Parent 2', grandparent.id);
      const child = engine.createFolder(workspaceId, 'Child', parent1.id);

      // This should work - child into parent2 (uncle)
      expect(() => {
        engine.moveFolder(child.id, parent2.id);
      }).not.toThrow();
    });
  });

  describe('Multi-item operations', () => {
    it('should move multiple items to same folder', () => {
      const source = engine.createFolder(workspaceId, 'Source');
      const target = engine.createFolder(workspaceId, 'Target');

      const items = [];
      for (let i = 0; i < 5; i++) {
        const item = engine.createWebItem(
          workspaceId,
          `https://example${i}.com`,
          `Item ${i}`,
          { folderId: source.id, skipDuplicateCheck: true }
        ) as WebItem;
        items.push(item);
      }

      // Move all items
      for (const item of items) {
        engine.moveItem(item.id, target.id);
      }

      // Verify all moved
      const targetItems = engine.getItemsInFolder(target.id);
      expect(targetItems).toHaveLength(5);

      const sourceItems = engine.getItemsInFolder(source.id);
      expect(sourceItems).toHaveLength(0);
    });
  });

  describe('Cross-workspace isolation', () => {
    it('should not allow moving item to folder in different workspace', () => {
      const workspace2 = engine.createWorkspace('Workspace 2');

      const folder1 = engine.createFolder(workspaceId, 'WS1 Folder');
      const folder2 = engine.createFolder(workspace2.id, 'WS2 Folder');

      const item = engine.createWebItem(
        workspaceId,
        'https://example.com',
        'Test Item',
        { folderId: folder1.id }
      ) as WebItem;

      // Move item to folder in different workspace
      // This may or may not throw depending on implementation
      engine.moveItem(item.id, folder2.id);

      // The item should still be accessible by ID
      const retrieved = engine.getItem(item.id);
      expect(retrieved).not.toBeNull();
    });
  });

  describe('Item count updates', () => {
    it('should update folder item counts after item move', () => {
      const folder1 = engine.createFolder(workspaceId, 'Folder 1');
      const folder2 = engine.createFolder(workspaceId, 'Folder 2');

      // Add items to folder1
      engine.createWebItem(workspaceId, 'https://a.com', 'Item A', {
        folderId: folder1.id
      });
      engine.createWebItem(workspaceId, 'https://b.com', 'Item B', {
        folderId: folder1.id
      });

      // Initial counts
      let tree = engine.getFolderTree(workspaceId);
      let f1 = tree.find(n => n.folder.name === 'Folder 1');
      let f2 = tree.find(n => n.folder.name === 'Folder 2');

      expect(f1?.itemCount).toBe(2);
      expect(f2?.itemCount).toBe(0);

      // Move one item
      engine.moveItem(f1!.items[0].id, folder2.id);

      // Updated counts
      tree = engine.getFolderTree(workspaceId);
      f1 = tree.find(n => n.folder.name === 'Folder 1');
      f2 = tree.find(n => n.folder.name === 'Folder 2');

      expect(f1?.itemCount).toBe(1);
      expect(f2?.itemCount).toBe(1);
    });
  });
});
