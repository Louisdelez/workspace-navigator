/**
 * Database layer for Workspace Navigator
 * Uses better-sqlite3 for synchronous SQLite operations
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import type {
  Workspace,
  Folder,
  Item,
  WebItem,
  NoteItem,
  SessionState
} from '../../types/entities';

export class WorkspaceDatabase {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL'); // Better concurrency
    this.db.pragma('foreign_keys = ON'); // Enforce foreign keys
    this.initialize();
  }

  /**
   * Initialize database schema
   */
  private initialize(): void {
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    this.db.exec(schema);
  }

  /**
   * Convert snake_case DB row to camelCase TypeScript object
   */
  private toCamelCase<T>(row: any): T {
    const result: any = {};
    for (const key in row) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

      // Parse JSON fields
      if (['settings', 'metadata', 'windowState', 'openTabs'].includes(camelKey)) {
        result[camelKey] = row[key] ? JSON.parse(row[key]) : {};
      } else if (camelKey === 'isDeleted') {
        result[camelKey] = row[key] === 1;
      } else {
        result[camelKey] = row[key];
      }
    }
    return result as T;
  }

  /**
   * Convert camelCase TypeScript object to snake_case DB row
   */
  private toSnakeCase(obj: any): any {
    const result: any = {};
    for (const key in obj) {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

      // Stringify JSON fields
      if (['settings', 'metadata', 'windowState', 'openTabs'].includes(key)) {
        result[snakeKey] = JSON.stringify(obj[key]);
      } else if (key === 'isDeleted') {
        result[snakeKey] = obj[key] ? 1 : 0;
      } else {
        result[snakeKey] = obj[key];
      }
    }
    return result;
  }

  // ==================== WORKSPACES ====================

  getAllWorkspaces(): Workspace[] {
    const stmt = this.db.prepare('SELECT * FROM workspaces WHERE is_deleted = 0 ORDER BY updated_at DESC');
    return stmt.all().map(row => this.toCamelCase<Workspace>(row));
  }

  getWorkspaceById(id: string): Workspace | null {
    const stmt = this.db.prepare('SELECT * FROM workspaces WHERE id = ? AND is_deleted = 0');
    const row = stmt.get(id);
    return row ? this.toCamelCase<Workspace>(row) : null;
  }

  createWorkspace(workspace: Workspace): void {
    const data = this.toSnakeCase(workspace);
    const stmt = this.db.prepare(
      `INSERT INTO workspaces (id, name, created_at, updated_at, settings, is_deleted)
       VALUES (@id, @name, @created_at, @updated_at, @settings, @is_deleted)`
    );
    stmt.run(data);
  }

  updateWorkspace(id: string, updates: Partial<Workspace>): void {
    const data = this.toSnakeCase(updates);
    const fields = Object.keys(data)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map(key => `${key} = @${key}`)
      .join(', ');

    const stmt = this.db.prepare(`UPDATE workspaces SET ${fields} WHERE id = @id`);
    stmt.run({ ...data, id });
  }

  deleteWorkspace(id: string, hard: boolean = false): void {
    if (hard) {
      this.db.prepare('DELETE FROM workspaces WHERE id = ?').run(id);
    } else {
      this.db.prepare('UPDATE workspaces SET is_deleted = 1 WHERE id = ?').run(id);
    }
  }

  // ==================== FOLDERS ====================

  getRootFolders(workspaceId: string): Folder[] {
    const stmt = this.db.prepare(
      `SELECT * FROM folders
       WHERE workspace_id = ? AND parent_id IS NULL AND is_deleted = 0
       ORDER BY created_at DESC`
    );
    return stmt.all(workspaceId).map(row => this.toCamelCase<Folder>(row));
  }

  getChildFolders(parentId: string): Folder[] {
    const stmt = this.db.prepare(
      `SELECT * FROM folders
       WHERE parent_id = ? AND is_deleted = 0
       ORDER BY created_at DESC`
    );
    return stmt.all(parentId).map(row => this.toCamelCase<Folder>(row));
  }

  getFolderById(id: string): Folder | null {
    const stmt = this.db.prepare('SELECT * FROM folders WHERE id = ? AND is_deleted = 0');
    const row = stmt.get(id);
    return row ? this.toCamelCase<Folder>(row) : null;
  }

  createFolder(folder: Folder): void {
    const data = this.toSnakeCase(folder);
    const stmt = this.db.prepare(
      `INSERT INTO folders (id, workspace_id, parent_id, name, folder_type, created_at, updated_at, is_deleted)
       VALUES (@id, @workspace_id, @parent_id, @name, @folder_type, @created_at, @updated_at, @is_deleted)`
    );
    stmt.run(data);
  }

  updateFolder(id: string, updates: Partial<Folder>): void {
    const data = this.toSnakeCase(updates);
    const fields = Object.keys(data)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map(key => `${key} = @${key}`)
      .join(', ');

    const stmt = this.db.prepare(`UPDATE folders SET ${fields} WHERE id = @id`);
    stmt.run({ ...data, id });
  }

  deleteFolder(id: string): void {
    this.db.prepare('UPDATE folders SET is_deleted = 1 WHERE id = ?').run(id);
  }

  /**
   * Get or create date folder for today
   */
  getOrCreateDateFolder(workspaceId: string, folderName: string): Folder {
    const existing = this.db.prepare(
      `SELECT * FROM folders
       WHERE workspace_id = ? AND name = ? AND folder_type = 'date' AND is_deleted = 0`
    ).get(workspaceId, folderName);

    if (existing) {
      return this.toCamelCase<Folder>(existing);
    }

    // Create new date folder
    const { v4: uuidv4 } = require('uuid');
    const now = Date.now();
    const folder: Folder = {
      id: uuidv4(),
      workspaceId,
      parentId: null,
      name: folderName,
      folderType: 'date',
      createdAt: now,
      updatedAt: now,
      isDeleted: false
    };

    this.createFolder(folder);
    return folder;
  }

  // ==================== ITEMS ====================

  getItemsInFolder(folderId: string | null, workspaceId?: string): Item[] {
    let stmt;
    let params: any[];

    if (folderId === null && workspaceId) {
      // Get orphaned items at workspace root
      stmt = this.db.prepare(
        `SELECT * FROM items
         WHERE workspace_id = ? AND folder_id IS NULL AND is_deleted = 0
         ORDER BY created_at DESC`
      );
      params = [workspaceId];
    } else {
      stmt = this.db.prepare(
        `SELECT * FROM items
         WHERE folder_id = ? AND is_deleted = 0
         ORDER BY created_at DESC`
      );
      params = [folderId];
    }

    return stmt.all(...params).map(row => this.toCamelCase<Item>(row));
  }

  getItemById(id: string): Item | null {
    const stmt = this.db.prepare('SELECT * FROM items WHERE id = ? AND is_deleted = 0');
    const row = stmt.get(id);
    return row ? this.toCamelCase<Item>(row) : null;
  }

  createItem(item: WebItem | NoteItem): void {
    const data = this.toSnakeCase(item);

    // Ensure all required fields exist with null defaults for missing ones
    const itemData = {
      ...data,
      url: data.url || null,
      favicon: data.favicon || null,
      content: data.content || null
    };

    const stmt = this.db.prepare(
      `INSERT INTO items (id, workspace_id, folder_id, item_type, title, url, favicon, content, metadata, created_at, updated_at, is_deleted)
       VALUES (@id, @workspace_id, @folder_id, @item_type, @title, @url, @favicon, @content, @metadata, @created_at, @updated_at, @is_deleted)`
    );
    stmt.run(itemData);
  }

  updateItem(id: string, updates: Partial<Item>): void {
    const data = this.toSnakeCase(updates);
    const fields = Object.keys(data)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map(key => `${key} = @${key}`)
      .join(', ');

    const stmt = this.db.prepare(`UPDATE items SET ${fields} WHERE id = @id`);
    stmt.run({ ...data, id });
  }

  deleteItem(id: string): void {
    this.db.prepare('UPDATE items SET is_deleted = 1 WHERE id = ?').run(id);
  }

  /**
   * Find duplicate web item (same URL, today, same folder)
   */
  findDuplicateWebItem(workspaceId: string, url: string, folderId: string | null): WebItem | null {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTimestamp = todayStart.getTime();

    const stmt = this.db.prepare(
      `SELECT * FROM items
       WHERE workspace_id = ? AND url = ? AND created_at >= ? AND is_deleted = 0
       ORDER BY created_at DESC`
    );

    const candidates = stmt.all(workspaceId, url, todayTimestamp);
    const match = candidates.find((item: any) => item.folder_id === folderId);

    return match ? this.toCamelCase<WebItem>(match) : null;
  }

  // ==================== SESSION STATE ====================

  getSessionState(): SessionState {
    const stmt = this.db.prepare('SELECT * FROM session_state WHERE id = 1');
    const row = stmt.get();
    return this.toCamelCase<SessionState>(row);
  }

  updateSessionState(updates: Partial<SessionState>): void {
    const data = this.toSnakeCase(updates);
    const fields = Object.keys(data)
      .filter(key => key !== 'id' && key !== 'updated_at')
      .map(key => `${key} = @${key}`)
      .join(', ');

    const stmt = this.db.prepare(`UPDATE session_state SET ${fields} WHERE id = 1`);
    stmt.run(data);
  }

  // ==================== UTILITY ====================

  close(): void {
    this.db.close();
  }

  /**
   * Run database in a transaction
   */
  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }
}
