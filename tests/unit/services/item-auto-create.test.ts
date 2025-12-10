/**
 * Auto Item Creation Tests (T048)
 * Tests for automatic item creation with date folder assignment
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkspaceEngine } from '../../../src/core/workspace/workspace-engine';
import { WorkspaceDatabase } from '../../../src/core/storage/database';
import { v4 as uuidv4 } from 'uuid';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { WebItem, NoteItem } from '../../../src/types/entities';

describe('Auto Item Creation (T048)', () => {
  let db: WorkspaceDatabase;
  let engine: WorkspaceEngine;
  let dbPath: string;
  let workspaceId: string;

  beforeEach(() => {
    dbPath = join(tmpdir(), `test-auto-create-${uuidv4()}.db`);
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

  describe('Web item creation', () => {
    it('should create web item with required fields', () => {
      const folder = engine.createFolder(workspaceId, 'Test Folder');
      const item = engine.createWebItem(
        workspaceId,
        'https://example.com',
        'Test Item',
        { folderId: folder.id }
      ) as WebItem;

      expect(item.id).toBeDefined();
      expect(item.workspaceId).toBe(workspaceId);
      expect(item.folderId).toBe(folder.id);
      expect(item.itemType).toBe('web');
      expect(item.url).toBe('https://example.com');
      expect(item.title).toBe('Test Item');
      expect(item.isDeleted).toBe(false);
    });

    it('should set timestamps', () => {
      const folder = engine.createFolder(workspaceId, 'Test Folder');
      const before = Date.now();
      const item = engine.createWebItem(
        workspaceId,
        'https://example.com',
        'Test Item',
        { folderId: folder.id }
      ) as WebItem;
      const after = Date.now();

      expect(item.createdAt).toBeGreaterThanOrEqual(before);
      expect(item.createdAt).toBeLessThanOrEqual(after);
      expect(item.updatedAt).toBeGreaterThanOrEqual(before);
      expect(item.updatedAt).toBeLessThanOrEqual(after);
    });

    it('should set optional favicon', () => {
      const folder = engine.createFolder(workspaceId, 'Test Folder');
      const item = engine.createWebItem(
        workspaceId,
        'https://example.com',
        'Test Item',
        { folderId: folder.id, favicon: 'https://example.com/favicon.ico' }
      ) as WebItem;

      expect(item.favicon).toBe('https://example.com/favicon.ico');
    });

    it('should default favicon to null', () => {
      const folder = engine.createFolder(workspaceId, 'Test Folder');
      const item = engine.createWebItem(
        workspaceId,
        'https://example.com',
        'Test Item',
        { folderId: folder.id }
      ) as WebItem;

      expect(item.favicon).toBeNull();
    });

    it('should initialize metadata', () => {
      const folder = engine.createFolder(workspaceId, 'Test Folder');
      const item = engine.createWebItem(
        workspaceId,
        'https://example.com',
        'Test Item',
        { folderId: folder.id }
      ) as WebItem;

      expect(item.metadata).toBeDefined();
      expect(item.metadata.lastAccessedAt).toBeDefined();
      expect(item.metadata.openCount).toBe(0);
    });
  });

  describe('Note item creation', () => {
    it('should create note item with required fields', () => {
      const folder = engine.createFolder(workspaceId, 'Test Folder');
      const item = engine.createNoteItem(
        workspaceId,
        'My Note',
        'Note content here',
        { folderId: folder.id }
      ) as NoteItem;

      expect(item.id).toBeDefined();
      expect(item.workspaceId).toBe(workspaceId);
      expect(item.folderId).toBe(folder.id);
      expect(item.itemType).toBe('note');
      expect(item.title).toBe('My Note');
      expect(item.content).toBe('Note content here');
      expect(item.isDeleted).toBe(false);
    });

    it('should allow empty content', () => {
      const folder = engine.createFolder(workspaceId, 'Test Folder');
      const item = engine.createNoteItem(
        workspaceId,
        'Empty Note',
        '',
        { folderId: folder.id }
      ) as NoteItem;

      expect(item.content).toBe('');
    });

    it('should default content to empty string', () => {
      const folder = engine.createFolder(workspaceId, 'Test Folder');
      const item = engine.createNoteItem(
        workspaceId,
        'Note without content',
        undefined,
        { folderId: folder.id }
      ) as NoteItem;

      expect(item.content).toBe('');
    });
  });

  describe('Auto date folder assignment (FR-005)', () => {
    it('should auto-create date folder for web items at root', () => {
      const item = engine.createWebItem(
        workspaceId,
        'https://example.com',
        'Test Item'
      ) as WebItem;

      expect(item.folderId).not.toBeNull();

      // Get folder tree to verify date folder was created
      const tree = engine.getFolderTree(workspaceId);
      expect(tree.length).toBeGreaterThan(0);
      expect(tree[0].folder.folderType).toBe('date');
    });

    it('should auto-create date folder for note items at root', () => {
      const item = engine.createNoteItem(
        workspaceId,
        'Test Note',
        'Content'
      ) as NoteItem;

      expect(item.folderId).not.toBeNull();

      const tree = engine.getFolderTree(workspaceId);
      expect(tree.length).toBeGreaterThan(0);
      expect(tree[0].folder.folderType).toBe('date');
    });

    it('should reuse existing date folder', () => {
      // Create two items - should go to same date folder
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
    });

    it('should skip auto date folder when folderId provided', () => {
      const userFolder = engine.createFolder(workspaceId, 'User Folder');

      const item = engine.createWebItem(
        workspaceId,
        'https://example.com',
        'Test Item',
        { folderId: userFolder.id }
      ) as WebItem;

      expect(item.folderId).toBe(userFolder.id);
    });

    it('should skip auto date folder when skipAutoDateFolder is true', () => {
      const item = engine.createWebItem(
        workspaceId,
        'https://example.com',
        'Test Item',
        { skipAutoDateFolder: true }
      ) as WebItem;

      expect(item.folderId).toBeNull();
    });

    it('should respect autoDateFolders workspace setting', () => {
      // Disable auto date folders in workspace settings
      engine.updateWorkspace(workspaceId, {
        settings: { autoDateFolders: false }
      });

      const item = engine.createWebItem(
        workspaceId,
        'https://example.com',
        'Test Item'
      ) as WebItem;

      expect(item.folderId).toBeNull();
    });
  });

  describe('Date folder naming', () => {
    it('should create folder with today date name', () => {
      engine.createWebItem(
        workspaceId,
        'https://example.com',
        'Test Item'
      );

      const tree = engine.getFolderTree(workspaceId);
      const dateFolder = tree.find(n => n.folder.folderType === 'date');

      expect(dateFolder).toBeDefined();

      // Date format should match DD.MM.YYYY
      const datePattern = /^\d{2}\.\d{2}\.\d{4}$/;
      expect(dateFolder!.folder.name).toMatch(datePattern);

      // Should be today's date
      const today = new Date();
      const expectedName = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
      expect(dateFolder!.folder.name).toBe(expectedName);
    });
  });

  describe('Item retrieval', () => {
    it('should be retrievable by ID after creation', () => {
      const folder = engine.createFolder(workspaceId, 'Test Folder');
      const created = engine.createWebItem(
        workspaceId,
        'https://example.com',
        'Test Item',
        { folderId: folder.id }
      ) as WebItem;

      const retrieved = engine.getItem(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.title).toBe('Test Item');
    });

    it('should appear in folder items list', () => {
      const folder = engine.createFolder(workspaceId, 'Test Folder');
      const item = engine.createWebItem(
        workspaceId,
        'https://example.com',
        'Test Item',
        { folderId: folder.id }
      ) as WebItem;

      const items = engine.getItemsInFolder(folder.id);

      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(item.id);
    });

    it('should appear in folder tree', () => {
      const folder = engine.createFolder(workspaceId, 'Test Folder');
      engine.createWebItem(
        workspaceId,
        'https://example.com',
        'Test Item',
        { folderId: folder.id }
      );

      const tree = engine.getFolderTree(workspaceId);
      const folderNode = tree.find(n => n.folder.id === folder.id);

      expect(folderNode).toBeDefined();
      expect(folderNode!.items).toHaveLength(1);
      expect(folderNode!.items[0].title).toBe('Test Item');
    });
  });

  describe('UUID generation', () => {
    it('should generate unique IDs for each item', () => {
      const folder = engine.createFolder(workspaceId, 'Test Folder');

      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const item = engine.createWebItem(
          workspaceId,
          `https://example${i}.com`,
          `Item ${i}`,
          { folderId: folder.id, skipDuplicateCheck: true }
        ) as WebItem;
        ids.add(item.id);
      }

      // All IDs should be unique
      expect(ids.size).toBe(100);
    });

    it('should generate valid UUID format', () => {
      const folder = engine.createFolder(workspaceId, 'Test Folder');
      const item = engine.createWebItem(
        workspaceId,
        'https://example.com',
        'Test Item',
        { folderId: folder.id }
      ) as WebItem;

      // UUID v4 format
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(item.id).toMatch(uuidPattern);
    });
  });
});
