/**
 * Folder Tree Building Tests (T076)
 * Tests for building and traversing folder tree structures
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkspaceEngine, FolderNode } from '../../../src/core/workspace/workspace-engine';
import { WorkspaceDatabase } from '../../../src/core/storage/database';
import { v4 as uuidv4 } from 'uuid';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Folder Tree Building (T076)', () => {
  let db: WorkspaceDatabase;
  let engine: WorkspaceEngine;
  let dbPath: string;
  let workspaceId: string;

  beforeEach(() => {
    dbPath = join(tmpdir(), `test-tree-${uuidv4()}.db`);
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

  describe('Empty workspace', () => {
    it('should return empty array for workspace without folders', () => {
      const tree = engine.getFolderTree(workspaceId);
      expect(tree).toEqual([]);
    });
  });

  describe('Single level folders', () => {
    it('should return root folders only', () => {
      const folder1 = engine.createFolder(workspaceId, 'Folder 1');
      const folder2 = engine.createFolder(workspaceId, 'Folder 2');
      const folder3 = engine.createFolder(workspaceId, 'Folder 3');

      const tree = engine.getFolderTree(workspaceId);

      expect(tree).toHaveLength(3);
      expect(tree.map(n => n.folder.name)).toContain('Folder 1');
      expect(tree.map(n => n.folder.name)).toContain('Folder 2');
      expect(tree.map(n => n.folder.name)).toContain('Folder 3');
    });

    it('should include folder metadata', () => {
      const folder = engine.createFolder(workspaceId, 'Test Folder');
      const tree = engine.getFolderTree(workspaceId);

      expect(tree).toHaveLength(1);
      expect(tree[0].folder.id).toBe(folder.id);
      expect(tree[0].folder.name).toBe('Test Folder');
      expect(tree[0].folder.workspaceId).toBe(workspaceId);
    });
  });

  describe('Nested folders', () => {
    it('should build 2-level hierarchy', () => {
      const parent = engine.createFolder(workspaceId, 'Parent');
      const child = engine.createFolder(workspaceId, 'Child', parent.id);

      const tree = engine.getFolderTree(workspaceId);

      expect(tree).toHaveLength(1);
      expect(tree[0].folder.name).toBe('Parent');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].folder.name).toBe('Child');
    });

    it('should build 3-level hierarchy', () => {
      const level1 = engine.createFolder(workspaceId, 'Level 1');
      const level2 = engine.createFolder(workspaceId, 'Level 2', level1.id);
      const level3 = engine.createFolder(workspaceId, 'Level 3', level2.id);

      const tree = engine.getFolderTree(workspaceId);

      expect(tree).toHaveLength(1);
      expect(tree[0].folder.name).toBe('Level 1');
      expect(tree[0].children[0].folder.name).toBe('Level 2');
      expect(tree[0].children[0].children[0].folder.name).toBe('Level 3');
    });

    it('should build multiple branches', () => {
      const parent = engine.createFolder(workspaceId, 'Parent');
      const child1 = engine.createFolder(workspaceId, 'Child 1', parent.id);
      const child2 = engine.createFolder(workspaceId, 'Child 2', parent.id);
      const child3 = engine.createFolder(workspaceId, 'Child 3', parent.id);

      const tree = engine.getFolderTree(workspaceId);

      expect(tree).toHaveLength(1);
      expect(tree[0].children).toHaveLength(3);
    });
  });

  describe('Items in folders', () => {
    it('should include items in folder nodes', () => {
      const folder = engine.createFolder(workspaceId, 'Test Folder');
      engine.createWebItem(workspaceId, 'https://example.com', 'Test Item', {
        folderId: folder.id,
        skipAutoDateFolder: true
      });

      const tree = engine.getFolderTree(workspaceId);

      expect(tree).toHaveLength(1);
      expect(tree[0].items).toHaveLength(1);
      expect(tree[0].items[0].title).toBe('Test Item');
    });

    it('should include items in nested folders', () => {
      const parent = engine.createFolder(workspaceId, 'Parent');
      const child = engine.createFolder(workspaceId, 'Child', parent.id);

      engine.createWebItem(workspaceId, 'https://parent.com', 'Parent Item', {
        folderId: parent.id,
        skipAutoDateFolder: true
      });
      engine.createWebItem(workspaceId, 'https://child.com', 'Child Item', {
        folderId: child.id,
        skipAutoDateFolder: true
      });

      const tree = engine.getFolderTree(workspaceId);

      expect(tree[0].items).toHaveLength(1);
      expect(tree[0].items[0].title).toBe('Parent Item');
      expect(tree[0].children[0].items).toHaveLength(1);
      expect(tree[0].children[0].items[0].title).toBe('Child Item');
    });

    it('should calculate item count recursively', () => {
      const parent = engine.createFolder(workspaceId, 'Parent');
      const child1 = engine.createFolder(workspaceId, 'Child 1', parent.id);
      const child2 = engine.createFolder(workspaceId, 'Child 2', parent.id);

      // Add items to parent
      engine.createWebItem(workspaceId, 'https://p1.com', 'P1', {
        folderId: parent.id,
        skipAutoDateFolder: true
      });
      engine.createWebItem(workspaceId, 'https://p2.com', 'P2', {
        folderId: parent.id,
        skipAutoDateFolder: true
      });

      // Add items to children
      engine.createWebItem(workspaceId, 'https://c1.com', 'C1', {
        folderId: child1.id,
        skipAutoDateFolder: true
      });
      engine.createWebItem(workspaceId, 'https://c2-1.com', 'C2-1', {
        folderId: child2.id,
        skipAutoDateFolder: true
      });
      engine.createWebItem(workspaceId, 'https://c2-2.com', 'C2-2', {
        folderId: child2.id,
        skipAutoDateFolder: true
      });

      const tree = engine.getFolderTree(workspaceId);

      // Parent should have total count of 5 (2 direct + 3 in children)
      expect(tree[0].itemCount).toBe(5);
      // Child 1 should have count of 1
      expect(tree[0].children.find(c => c.folder.name === 'Child 1')?.itemCount).toBe(1);
      // Child 2 should have count of 2
      expect(tree[0].children.find(c => c.folder.name === 'Child 2')?.itemCount).toBe(2);
    });
  });

  describe('Mixed content', () => {
    it('should handle multiple root folders with nested children', () => {
      const root1 = engine.createFolder(workspaceId, 'Root 1');
      const root2 = engine.createFolder(workspaceId, 'Root 2');
      const root3 = engine.createFolder(workspaceId, 'Root 3');

      const child1_1 = engine.createFolder(workspaceId, 'Child 1.1', root1.id);
      const child1_2 = engine.createFolder(workspaceId, 'Child 1.2', root1.id);
      const child2_1 = engine.createFolder(workspaceId, 'Child 2.1', root2.id);

      const tree = engine.getFolderTree(workspaceId);

      expect(tree).toHaveLength(3);

      const r1 = tree.find(n => n.folder.name === 'Root 1');
      const r2 = tree.find(n => n.folder.name === 'Root 2');
      const r3 = tree.find(n => n.folder.name === 'Root 3');

      expect(r1?.children).toHaveLength(2);
      expect(r2?.children).toHaveLength(1);
      expect(r3?.children).toHaveLength(0);
    });
  });

  describe('Workspace isolation', () => {
    it('should only return folders for the specified workspace', () => {
      const workspace2 = engine.createWorkspace('Workspace 2');

      engine.createFolder(workspaceId, 'WS1 Folder');
      engine.createFolder(workspace2.id, 'WS2 Folder');

      const tree1 = engine.getFolderTree(workspaceId);
      const tree2 = engine.getFolderTree(workspace2.id);

      expect(tree1).toHaveLength(1);
      expect(tree1[0].folder.name).toBe('WS1 Folder');

      expect(tree2).toHaveLength(1);
      expect(tree2[0].folder.name).toBe('WS2 Folder');
    });
  });

  describe('Date folders', () => {
    it('should include auto-created date folders in tree', () => {
      // Creating item at root will create a date folder
      engine.createWebItem(workspaceId, 'https://example.com', 'Test Item');

      const tree = engine.getFolderTree(workspaceId);

      expect(tree).toHaveLength(1);
      expect(tree[0].folder.folderType).toBe('date');
    });

    it('should mix date folders with user folders', () => {
      // Create user folder
      engine.createFolder(workspaceId, 'My Folder');

      // Create item at root (will create date folder)
      engine.createWebItem(workspaceId, 'https://example.com', 'Test Item');

      const tree = engine.getFolderTree(workspaceId);

      expect(tree).toHaveLength(2);
      expect(tree.some(n => n.folder.folderType === 'user')).toBe(true);
      expect(tree.some(n => n.folder.folderType === 'date')).toBe(true);
    });
  });
});
