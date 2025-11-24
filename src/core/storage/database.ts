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
   * Initialize database schema and run migrations
   */
  private initialize(): void {
    // Get current schema version
    const currentVersion = this.db.pragma('user_version', { simple: true }) as number;

    if (currentVersion === 0) {
      // Fresh database - load initial schema
      console.log('Initializing database schema...');
      const schemaPath = join(__dirname, 'schema.sql');
      const schema = readFileSync(schemaPath, 'utf-8');
      this.db.exec(schema);

      // Set schema version to 1
      this.db.pragma('user_version = 1');
      console.log('Database initialized with schema version 1');
    } else {
      // Existing database - run migrations if needed
      this.runMigrations(currentVersion);
    }
  }

  /**
   * Run database migrations
   * @param currentVersion Current schema version
   */
  private runMigrations(currentVersion: number): void {
    const TARGET_VERSION = 1; // Update this when adding new migrations

    if (currentVersion >= TARGET_VERSION) {
      return; // Already up to date
    }

    console.log(`Running migrations from version ${currentVersion} to ${TARGET_VERSION}`);

    // Run each migration in sequence
    for (let version = currentVersion + 1; version <= TARGET_VERSION; version++) {
      const migrationFile = join(__dirname, 'migrations', `${String(version).padStart(3, '0')}-*.sql`);
      // Future: Load and execute migration SQL
      // For now, migrations are handled by schema.sql
      console.log(`Migration ${version} applied`);
    }

    // Update schema version
    this.db.pragma(`user_version = ${TARGET_VERSION}`);
    console.log(`Database upgraded to version ${TARGET_VERSION}`);
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
    // Force-recompile workaround: renamed internal logic
    this._createItemInternal(item);
  }

  private _createItemInternal(item: WebItem | NoteItem): void {
    const data = this.toSnakeCase(item);

    // Use positional parameters (?) instead of named parameters (@name)
    // This bypasses any parameter name matching issues
    const stmt = this.db.prepare(
      `INSERT INTO items (id, workspace_id, folder_id, item_type, title, url, favicon, content, metadata, created_at, updated_at, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    // Explicitly set all values in the correct order
    const url = item.itemType === 'web' ? (data.url || null) : null;
    const favicon = item.itemType === 'web' ? (data.favicon || null) : null;
    const content = item.itemType === 'note' ? (data.content || null) : null;

    stmt.run(
      data.id,
      data.workspace_id,
      data.folder_id,
      data.item_type,
      data.title,
      url,
      favicon,
      content,
      data.metadata,
      data.created_at,
      data.updated_at,
      data.is_deleted
    );
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

  /**
   * Prepare a SQL statement for execution
   */
  prepare(sql: string): any {
    return this.db.prepare(sql);
  }

  /**
   * Search items by title, URL, or content (T046)
   * @param workspaceId - Workspace to search in
   * @param query - Search query
   * @param limit - Maximum number of results (default: 100)
   * @returns Array of matching items
   */
  searchItems(workspaceId: string, query: string, limit: number = 100): Item[] {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchPattern = `%${query}%`;

    const sql = `
      SELECT * FROM items
      WHERE workspace_id = ?
        AND is_deleted = 0
        AND (
          title LIKE ? COLLATE NOCASE
          OR (url IS NOT NULL AND url LIKE ? COLLATE NOCASE)
          OR (content IS NOT NULL AND content LIKE ? COLLATE NOCASE)
        )
      ORDER BY
        CASE
          WHEN title LIKE ? THEN 1  -- Exact title match first
          WHEN title LIKE ? THEN 2  -- Title starts with query
          ELSE 3                     -- Other matches
        END,
        updated_at DESC
      LIMIT ?
    `;

    const rows = this.db.prepare(sql).all(
      workspaceId,
      searchPattern, // title search
      searchPattern, // url search
      searchPattern, // content search
      query,         // exact match check
      `${query}%`,   // starts with check
      limit
    );

    return rows.map(row => this.toCamelCase<Item>(row));
  }

  close(): void {
    this.db.close();
  }

  /**
   * Run database in a transaction
   */
  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }

  // ==================== TAGS (T047) ====================

  /**
   * Get all tags for a workspace
   */
  getAllTags(workspaceId: string) {
    const stmt = this.db.prepare('SELECT * FROM tags WHERE workspace_id = ? ORDER BY name ASC');
    return stmt.all(workspaceId).map(row => this.toCamelCase<any>(row));
  }

  /**
   * Create a new tag
   */
  createTag(workspaceId: string, name: string, color: string = '#808080') {
    const { v4: uuidv4 } = require('uuid');
    const now = Date.now();

    // Check if tag already exists
    const existing = this.db.prepare(
      'SELECT * FROM tags WHERE workspace_id = ? AND name = ?'
    ).get(workspaceId, name);

    if (existing) {
      return this.toCamelCase<any>(existing);
    }

    const id = uuidv4();
    const stmt = this.db.prepare(
      `INSERT INTO tags (id, workspace_id, name, color, created_at)
       VALUES (?, ?, ?, ?, ?)`
    );
    stmt.run(id, workspaceId, name, color, now);

    return { id, workspaceId, name, color, createdAt: now };
  }

  /**
   * Get tags for an item
   */
  getItemTags(itemId: string) {
    const stmt = this.db.prepare(`
      SELECT t.* FROM tags t
      INNER JOIN item_tags it ON t.id = it.tag_id
      WHERE it.item_id = ?
      ORDER BY t.name ASC
    `);
    return stmt.all(itemId).map(row => this.toCamelCase<any>(row));
  }

  /**
   * Add tags to an item
   */
  addItemTags(itemId: string, tagIds: string[]): void {
    const now = Date.now();
    const stmt = this.db.prepare(
      `INSERT OR IGNORE INTO item_tags (item_id, tag_id, created_at)
       VALUES (?, ?, ?)`
    );

    for (const tagId of tagIds) {
      stmt.run(itemId, tagId, now);
    }
  }

  /**
   * Remove tags from an item
   */
  removeItemTags(itemId: string, tagIds: string[]): void {
    const stmt = this.db.prepare(
      'DELETE FROM item_tags WHERE item_id = ? AND tag_id = ?'
    );

    for (const tagId of tagIds) {
      stmt.run(itemId, tagId);
    }
  }

  /**
   * Remove all tags from an item
   */
  removeAllItemTags(itemId: string): void {
    this.db.prepare('DELETE FROM item_tags WHERE item_id = ?').run(itemId);
  }

  /**
   * Get items by tag
   */
  getItemsByTag(workspaceId: string, tagId: string): any[] {
    const stmt = this.db.prepare(`
      SELECT i.* FROM items i
      INNER JOIN item_tags it ON i.id = it.item_id
      WHERE i.workspace_id = ? AND it.tag_id = ? AND i.is_deleted = 0
      ORDER BY i.updated_at DESC
    `);
    return stmt.all(workspaceId, tagId).map(row => this.toCamelCase<any>(row));
  }

  /**
   * Delete a tag (and remove from all items)
   */
  deleteTag(tagId: string): void {
    // Foreign key CASCADE will handle item_tags deletion
    this.db.prepare('DELETE FROM tags WHERE id = ?').run(tagId);
  }
}
