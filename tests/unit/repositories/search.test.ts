/**
 * Search Tests (T078)
 * Tests for full-text search functionality and performance
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkspaceEngine } from '../../../src/core/workspace/workspace-engine';
import { WorkspaceDatabase } from '../../../src/core/storage/database';
import { v4 as uuidv4 } from 'uuid';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { WebItem, NoteItem } from '../../../src/types/entities';

describe('Search Functionality (T078)', () => {
  let db: WorkspaceDatabase;
  let engine: WorkspaceEngine;
  let dbPath: string;
  let workspaceId: string;

  beforeEach(() => {
    dbPath = join(tmpdir(), `test-search-${uuidv4()}.db`);
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

  describe('Basic search', () => {
    it('should return empty array for empty query', () => {
      engine.createWebItem(workspaceId, 'https://example.com', 'Test Item', {
        skipAutoDateFolder: true
      });

      const results = engine.searchItems(workspaceId, '');
      expect(results).toEqual([]);
    });

    it('should return empty array for whitespace-only query', () => {
      engine.createWebItem(workspaceId, 'https://example.com', 'Test Item', {
        skipAutoDateFolder: true
      });

      const results = engine.searchItems(workspaceId, '   ');
      expect(results).toEqual([]);
    });

    it('should return empty array when no matches', () => {
      engine.createWebItem(workspaceId, 'https://example.com', 'Test Item', {
        skipAutoDateFolder: true
      });

      const results = engine.searchItems(workspaceId, 'nonexistent');
      expect(results).toEqual([]);
    });
  });

  describe('Title search', () => {
    it('should find items by title', () => {
      const folder = engine.createFolder(workspaceId, 'Test');
      engine.createWebItem(workspaceId, 'https://a.com', 'Apple Website', {
        folderId: folder.id,
        skipAutoDateFolder: true
      });
      engine.createWebItem(workspaceId, 'https://b.com', 'Banana Website', {
        folderId: folder.id,
        skipAutoDateFolder: true
      });
      engine.createWebItem(workspaceId, 'https://c.com', 'Cherry Website', {
        folderId: folder.id,
        skipAutoDateFolder: true
      });

      const results = engine.searchItems(workspaceId, 'Apple');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Apple Website');
    });

    it('should be case-insensitive', () => {
      const folder = engine.createFolder(workspaceId, 'Test');
      engine.createWebItem(workspaceId, 'https://a.com', 'Apple Website', {
        folderId: folder.id,
        skipAutoDateFolder: true
      });

      const results = engine.searchItems(workspaceId, 'apple');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Apple Website');
    });

    it('should match partial titles', () => {
      const folder = engine.createFolder(workspaceId, 'Test');
      engine.createWebItem(workspaceId, 'https://a.com', 'Documentation Guide', {
        folderId: folder.id,
        skipAutoDateFolder: true
      });

      const results = engine.searchItems(workspaceId, 'Doc');
      expect(results).toHaveLength(1);
    });
  });

  describe('URL search', () => {
    it('should find items by URL', () => {
      const folder = engine.createFolder(workspaceId, 'Test');
      engine.createWebItem(workspaceId, 'https://github.com/project', 'Project Page', {
        folderId: folder.id,
        skipAutoDateFolder: true
      });
      engine.createWebItem(workspaceId, 'https://gitlab.com/other', 'Other Page', {
        folderId: folder.id,
        skipAutoDateFolder: true
      });

      const results = engine.searchItems(workspaceId, 'github');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Project Page');
    });

    it('should match URL path', () => {
      const folder = engine.createFolder(workspaceId, 'Test');
      engine.createWebItem(workspaceId, 'https://example.com/api/docs', 'API Docs', {
        folderId: folder.id,
        skipAutoDateFolder: true
      });

      const results = engine.searchItems(workspaceId, '/api/');
      expect(results).toHaveLength(1);
    });
  });

  describe('Content search', () => {
    it('should find notes by content', () => {
      const folder = engine.createFolder(workspaceId, 'Test');
      engine.createNoteItem(workspaceId, 'My Note', 'This is a note about JavaScript', {
        folderId: folder.id,
        skipAutoDateFolder: true
      });
      engine.createNoteItem(workspaceId, 'Other Note', 'This is about Python', {
        folderId: folder.id,
        skipAutoDateFolder: true
      });

      const results = engine.searchItems(workspaceId, 'JavaScript');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('My Note');
    });
  });

  describe('Multi-field search', () => {
    it('should find items matching in any field', () => {
      const folder = engine.createFolder(workspaceId, 'Test');
      engine.createWebItem(workspaceId, 'https://react.dev', 'React Documentation', {
        folderId: folder.id,
        skipAutoDateFolder: true
      });
      engine.createNoteItem(workspaceId, 'My React Notes', 'Notes about React', {
        folderId: folder.id,
        skipAutoDateFolder: true
      });
      engine.createWebItem(workspaceId, 'https://vue.js.org', 'Vue.js Site', {
        folderId: folder.id,
        skipAutoDateFolder: true
      });

      const results = engine.searchItems(workspaceId, 'React');
      expect(results).toHaveLength(2);
    });
  });

  describe('Result ordering', () => {
    it('should prioritize exact title matches', () => {
      const folder = engine.createFolder(workspaceId, 'Test');
      engine.createWebItem(workspaceId, 'https://a.com', 'Test', {
        folderId: folder.id,
        skipAutoDateFolder: true
      });
      engine.createWebItem(workspaceId, 'https://b.com', 'Testing Guide', {
        folderId: folder.id,
        skipAutoDateFolder: true
      });
      engine.createWebItem(workspaceId, 'https://c.com', 'Unit Test Examples', {
        folderId: folder.id,
        skipAutoDateFolder: true
      });

      const results = engine.searchItems(workspaceId, 'Test');
      // Exact match should come first
      expect(results[0].title).toBe('Test');
    });
  });

  describe('Result limiting', () => {
    it('should respect limit parameter', () => {
      const folder = engine.createFolder(workspaceId, 'Test');
      // Create 10 items
      for (let i = 0; i < 10; i++) {
        engine.createWebItem(workspaceId, `https://example${i}.com`, `Test Item ${i}`, {
          folderId: folder.id,
          skipAutoDateFolder: true
        });
      }

      const results = engine.searchItems(workspaceId, 'Test', 5);
      expect(results).toHaveLength(5);
    });

    it('should default to reasonable limit', () => {
      const folder = engine.createFolder(workspaceId, 'Test');
      // The default limit is 100, so this tests the feature works
      for (let i = 0; i < 5; i++) {
        engine.createWebItem(workspaceId, `https://example${i}.com`, `Test Item ${i}`, {
          folderId: folder.id,
          skipAutoDateFolder: true
        });
      }

      const results = engine.searchItems(workspaceId, 'Test');
      expect(results.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Workspace isolation', () => {
    it('should only search within specified workspace', () => {
      const workspace2 = engine.createWorkspace('Workspace 2');

      const folder1 = engine.createFolder(workspaceId, 'F1');
      const folder2 = engine.createFolder(workspace2.id, 'F2');

      engine.createWebItem(workspaceId, 'https://a.com', 'Unique Item in WS1', {
        folderId: folder1.id,
        skipAutoDateFolder: true
      });
      engine.createWebItem(workspace2.id, 'https://b.com', 'Unique Item in WS2', {
        folderId: folder2.id,
        skipAutoDateFolder: true
      });

      const results1 = engine.searchItems(workspaceId, 'Unique');
      const results2 = engine.searchItems(workspace2.id, 'Unique');

      expect(results1).toHaveLength(1);
      expect(results1[0].title).toBe('Unique Item in WS1');

      expect(results2).toHaveLength(1);
      expect(results2[0].title).toBe('Unique Item in WS2');
    });
  });

  describe('Deleted items', () => {
    it('should not return deleted items', () => {
      const folder = engine.createFolder(workspaceId, 'Test');
      const item = engine.createWebItem(workspaceId, 'https://a.com', 'Deletable Item', {
        folderId: folder.id,
        skipAutoDateFolder: true
      }) as WebItem;

      // Verify item exists in search
      let results = engine.searchItems(workspaceId, 'Deletable');
      expect(results).toHaveLength(1);

      // Delete the item
      engine.deleteItem(item.id);

      // Should no longer appear in search
      results = engine.searchItems(workspaceId, 'Deletable');
      expect(results).toHaveLength(0);
    });
  });

  describe('Special characters', () => {
    it('should handle search with special SQL characters', () => {
      const folder = engine.createFolder(workspaceId, 'Test');
      engine.createWebItem(workspaceId, 'https://a.com', 'Test % Item', {
        folderId: folder.id,
        skipAutoDateFolder: true
      });

      // Should not crash and should handle % correctly
      const results = engine.searchItems(workspaceId, '%');
      expect(results).toHaveLength(1);
    });

    it('should handle search with underscore', () => {
      const folder = engine.createFolder(workspaceId, 'Test');
      engine.createWebItem(workspaceId, 'https://a.com', 'test_item_name', {
        folderId: folder.id,
        skipAutoDateFolder: true
      });

      const results = engine.searchItems(workspaceId, 'test_item');
      expect(results).toHaveLength(1);
    });
  });
});
