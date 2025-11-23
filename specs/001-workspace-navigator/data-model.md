# Data Model Specification: Workspace Navigator

**Feature**: Workspace Navigator
**Created**: 2025-11-22
**Status**: Finalized
**Purpose**: Complete schema definitions, relationships, and data flow documentation

## Table of Contents

1. [Entity-Relationship Overview](#1-entity-relationship-overview)
2. [Database Schema (SQLite)](#2-database-schema-sqlite)
3. [TypeScript Type Definitions](#3-typescript-type-definitions)
4. [Data Validation Rules](#4-data-validation-rules)
5. [Query Patterns](#5-query-patterns)
6. [Migration Strategy](#6-migration-strategy)
7. [Data Integrity Constraints](#7-data-integrity-constraints)

---

## 1. Entity-Relationship Overview

### ER Diagram (ASCII)

```
┌─────────────────────┐
│    Workspace        │
│─────────────────────│
│ PK id: string       │
│    name: string     │
│    created_at: int  │
│    updated_at: int  │
│    settings: JSON   │
└──────────┬──────────┘
           │ 1
           │
           │ has many
           │
           ├──────────────────────┐
           │ *                    │ *
┌──────────▼──────────┐  ┌────────▼──────────┐
│      Folder         │  │      Item         │
│─────────────────────│  │───────────────────│
│ PK id: string       │  │ PK id: string     │
│ FK workspace_id     │  │ FK workspace_id   │
│ FK parent_id (self) │  │ FK folder_id      │
│    name: string     │  │    item_type: str │
│    created_at: int  │  │    title: string  │
│    updated_at: int  │  │    created_at: int│
└──────────┬──────────┘  │    updated_at: int│
           │ 1            │    url: string?   │
           │              │    content: str?  │
           │              │    favicon: str?  │
           │ has many     │    metadata: JSON │
           │              └────────┬──────────┘
           │ *                     │ *
           └──────────────────────┐│
                                  ││
                                  ││ has many
                                  ││
                                  │└──────────┐
                                  │ *         │ *
                      ┌───────────▼──────┐  ┌─▼────────────────┐
                      │   Item (child)   │  │       Tag        │
                      │──────────────────│  │──────────────────│
                      │ FK parent_id     │  │ PK id: string    │
                      │    (folder_id)   │  │    name: string  │
                      └──────────────────┘  │    color: string │
                                            └─────────┬────────┘
                                                      │ *
                                                      │
                                                      │ many-to-many
                                                      │
                                            ┌─────────▼────────┐
                                            │   ItemTag        │
                                            │──────────────────│
                                            │ FK item_id       │
                                            │ FK tag_id        │
                                            │    created_at    │
                                            └──────────────────┘
```

### Key Relationships

1. **Workspace → Folder**: One-to-Many (1:N)
   - Each workspace contains zero or more folders
   - Folders cannot exist without a workspace (CASCADE DELETE)

2. **Workspace → Item**: One-to-Many (1:N)
   - Each workspace contains zero or more items
   - Items cannot exist without a workspace (CASCADE DELETE)

3. **Folder → Folder**: Self-Referential (Tree Structure)
   - Each folder can have a parent folder (parent_id)
   - Root folders have NULL parent_id
   - Supports unlimited nesting depth

4. **Folder → Item**: One-to-Many (1:N)
   - Each folder contains zero or more items
   - Items with NULL folder_id are "orphaned" (appears at workspace root)

5. **Item → Tag**: Many-to-Many (N:M)
   - Each item can have multiple tags
   - Each tag can be applied to multiple items
   - Junction table: ItemTag

---

## 2. Database Schema (SQLite)

### Schema Version Management

```sql
-- Meta table for schema versioning
CREATE TABLE IF NOT EXISTS _schema_metadata (
  version INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL,
  description TEXT NOT NULL
);

-- Current version: 1
INSERT INTO _schema_metadata (version, applied_at, description)
VALUES (1, CAST(strftime('%s', 'now') AS INTEGER) * 1000, 'Initial schema');
```

### Table: `workspaces`

```sql
CREATE TABLE IF NOT EXISTS workspaces (
  -- Primary key: UUIDv4 generated client-side
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id) = 36),

  -- Name (user-defined, required)
  name TEXT NOT NULL CHECK(length(trim(name)) > 0),

  -- Timestamps (milliseconds since Unix epoch)
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  updated_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),

  -- Settings (JSON blob)
  -- Example: {"theme": "dark", "defaultAIProvider": "chatgpt"}
  settings TEXT DEFAULT '{}' CHECK(json_valid(settings)),

  -- Soft delete flag (for future trash feature)
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK(is_deleted IN (0, 1))
);

-- Indexes
CREATE INDEX idx_workspaces_name ON workspaces(name);
CREATE INDEX idx_workspaces_created_at ON workspaces(created_at DESC);
CREATE INDEX idx_workspaces_is_deleted ON workspaces(is_deleted) WHERE is_deleted = 0;

-- Trigger: Update updated_at on modification
CREATE TRIGGER trg_workspaces_updated_at
AFTER UPDATE ON workspaces
FOR EACH ROW
WHEN OLD.updated_at = NEW.updated_at
BEGIN
  UPDATE workspaces
  SET updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
  WHERE id = NEW.id;
END;
```

### Table: `folders`

```sql
CREATE TABLE IF NOT EXISTS folders (
  -- Primary key: UUIDv4
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id) = 36),

  -- Foreign key: workspace
  workspace_id TEXT NOT NULL,

  -- Foreign key: parent folder (NULL for root folders)
  parent_id TEXT DEFAULT NULL,

  -- Name (user-defined or auto-generated for date folders)
  name TEXT NOT NULL CHECK(length(trim(name)) > 0),

  -- Type: 'user' (user-created) or 'date' (auto-generated DD.MM.YYYY)
  folder_type TEXT NOT NULL DEFAULT 'user' CHECK(folder_type IN ('user', 'date')),

  -- Timestamps
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  updated_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),

  -- Soft delete
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK(is_deleted IN (0, 1)),

  -- Foreign key constraints
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE,

  -- Prevent cycles: parent_id cannot equal id
  CHECK(parent_id IS NULL OR parent_id != id)
);

-- Indexes
CREATE INDEX idx_folders_workspace_id ON folders(workspace_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_folders_name ON folders(name);
CREATE INDEX idx_folders_folder_type ON folders(folder_type);
CREATE INDEX idx_folders_is_deleted ON folders(is_deleted) WHERE is_deleted = 0;

-- Composite index for querying child folders
CREATE INDEX idx_folders_workspace_parent ON folders(workspace_id, parent_id);

-- Trigger: Update updated_at
CREATE TRIGGER trg_folders_updated_at
AFTER UPDATE ON folders
FOR EACH ROW
WHEN OLD.updated_at = NEW.updated_at
BEGIN
  UPDATE folders
  SET updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
  WHERE id = NEW.id;
END;

-- Trigger: Prevent circular parent relationships (depth check)
-- Note: SQLite doesn't support recursive triggers, so this is enforced in application logic
```

### Table: `items`

```sql
CREATE TABLE IF NOT EXISTS items (
  -- Primary key: UUIDv4
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id) = 36),

  -- Foreign key: workspace
  workspace_id TEXT NOT NULL,

  -- Foreign key: folder (NULL = workspace root)
  folder_id TEXT DEFAULT NULL,

  -- Item type: 'web' or 'note'
  item_type TEXT NOT NULL CHECK(item_type IN ('web', 'note')),

  -- Title (user-defined or auto-extracted from page title)
  title TEXT NOT NULL CHECK(length(trim(title)) > 0),

  -- Timestamps
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  updated_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),

  -- Web item specific fields (NULL for notes)
  url TEXT DEFAULT NULL CHECK(
    (item_type = 'web' AND url IS NOT NULL AND length(url) > 0)
    OR (item_type = 'note' AND url IS NULL)
  ),
  favicon TEXT DEFAULT NULL, -- Base64 encoded or URL

  -- Note item specific fields (NULL for web items)
  content TEXT DEFAULT NULL CHECK(
    (item_type = 'note' AND content IS NOT NULL)
    OR (item_type = 'web' AND content IS NULL)
  ),

  -- Metadata (JSON blob)
  -- Example: {"scrollPosition": 1234, "lastAccessedAt": 1700000000000}
  metadata TEXT DEFAULT '{}' CHECK(json_valid(metadata)),

  -- Soft delete
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK(is_deleted IN (0, 1)),

  -- Foreign key constraints
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_items_workspace_id ON items(workspace_id);
CREATE INDEX idx_items_folder_id ON items(folder_id);
CREATE INDEX idx_items_item_type ON items(item_type);
CREATE INDEX idx_items_created_at ON items(created_at DESC);
CREATE INDEX idx_items_is_deleted ON items(is_deleted) WHERE is_deleted = 0;

-- Composite index for duplication detection (FR-002a)
CREATE INDEX idx_items_workspace_url_created ON items(workspace_id, url, created_at DESC);

-- Full-text search index (FR-010)
CREATE VIRTUAL TABLE items_fts USING fts5(
  item_id UNINDEXED,
  title,
  content,
  content='items',
  content_rowid='rowid'
);

-- Trigger: Populate FTS index on insert
CREATE TRIGGER trg_items_fts_insert
AFTER INSERT ON items
BEGIN
  INSERT INTO items_fts(item_id, title, content)
  VALUES (NEW.id, NEW.title, COALESCE(NEW.content, ''));
END;

-- Trigger: Update FTS index on update
CREATE TRIGGER trg_items_fts_update
AFTER UPDATE ON items
BEGIN
  UPDATE items_fts
  SET title = NEW.title, content = COALESCE(NEW.content, '')
  WHERE item_id = NEW.id;
END;

-- Trigger: Delete from FTS index on delete
CREATE TRIGGER trg_items_fts_delete
AFTER DELETE ON items
BEGIN
  DELETE FROM items_fts WHERE item_id = OLD.id;
END;

-- Trigger: Update updated_at
CREATE TRIGGER trg_items_updated_at
AFTER UPDATE ON items
FOR EACH ROW
WHEN OLD.updated_at = NEW.updated_at
BEGIN
  UPDATE items
  SET updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
  WHERE id = NEW.id;
END;
```

### Table: `tags`

```sql
CREATE TABLE IF NOT EXISTS tags (
  -- Primary key: UUIDv4
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id) = 36),

  -- Tag name (unique per workspace)
  name TEXT NOT NULL CHECK(length(trim(name)) > 0),

  -- Color (hex code)
  color TEXT NOT NULL DEFAULT '#808080' CHECK(color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),

  -- Foreign key: workspace
  workspace_id TEXT NOT NULL,

  -- Timestamps
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),

  -- Foreign key constraint
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Unique constraint: one tag name per workspace
  UNIQUE(workspace_id, name)
);

-- Indexes
CREATE INDEX idx_tags_workspace_id ON tags(workspace_id);
CREATE INDEX idx_tags_name ON tags(name);
```

### Table: `item_tags` (Junction Table)

```sql
CREATE TABLE IF NOT EXISTS item_tags (
  -- Composite primary key
  item_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,

  -- Timestamp when tag was applied
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),

  -- Foreign key constraints
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,

  PRIMARY KEY (item_id, tag_id)
);

-- Indexes
CREATE INDEX idx_item_tags_item_id ON item_tags(item_id);
CREATE INDEX idx_item_tags_tag_id ON item_tags(tag_id);
```

### Table: `session_state` (Application State)

```sql
CREATE TABLE IF NOT EXISTS session_state (
  -- Singleton table: only one row with id = 1
  id INTEGER PRIMARY KEY CHECK(id = 1),

  -- Last active workspace
  active_workspace_id TEXT DEFAULT NULL,

  -- Open tabs (JSON array of item IDs)
  -- Example: ["item-uuid-1", "item-uuid-2", "item-uuid-3"]
  open_tabs TEXT DEFAULT '[]' CHECK(json_valid(open_tabs)),

  -- Active tab index
  active_tab_index INTEGER DEFAULT 0 CHECK(active_tab_index >= 0),

  -- AI provider selection
  ai_provider TEXT DEFAULT 'chatgpt' CHECK(ai_provider IN ('chatgpt', 'claude', 'gemini', 'none')),

  -- Window state (JSON)
  -- Example: {"width": 1920, "height": 1080, "x": 0, "y": 0, "isMaximized": false}
  window_state TEXT DEFAULT '{}' CHECK(json_valid(window_state)),

  -- Last updated timestamp
  updated_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),

  -- Foreign key constraint
  FOREIGN KEY (active_workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL
);

-- Initialize with default row
INSERT OR IGNORE INTO session_state (id) VALUES (1);

-- Trigger: Update updated_at
CREATE TRIGGER trg_session_state_updated_at
AFTER UPDATE ON session_state
FOR EACH ROW
BEGIN
  UPDATE session_state
  SET updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
  WHERE id = 1;
END;
```

### Table: `ai_sessions` (AI Provider Cookies)

```sql
CREATE TABLE IF NOT EXISTS ai_sessions (
  -- Primary key: provider name
  provider TEXT PRIMARY KEY CHECK(provider IN ('chatgpt', 'claude', 'gemini')),

  -- Serialized cookies (JSON array)
  -- Example: [{"name": "session_token", "value": "...", "domain": ".openai.com"}]
  cookies TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(cookies)),

  -- Last accessed timestamp
  last_accessed_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),

  -- Session validity
  is_valid INTEGER NOT NULL DEFAULT 0 CHECK(is_valid IN (0, 1))
);

-- Initialize providers
INSERT OR IGNORE INTO ai_sessions (provider) VALUES ('chatgpt'), ('claude'), ('gemini');
```

---

## 3. TypeScript Type Definitions

### Core Entities

```typescript
// src/types/entities.ts

/**
 * Base entity interface with common fields
 */
interface BaseEntity {
  id: string; // UUIDv4
  createdAt: number; // Unix timestamp (milliseconds)
  updatedAt: number; // Unix timestamp (milliseconds)
}

/**
 * Workspace entity (FR-001)
 */
export interface Workspace extends BaseEntity {
  name: string;
  settings: WorkspaceSettings;
  isDeleted: boolean;
}

export interface WorkspaceSettings {
  theme?: 'light' | 'dark';
  defaultAIProvider?: 'chatgpt' | 'claude' | 'gemini' | 'none';
  autoDateFolders?: boolean; // Default: true (FR-005)
  tabSoftLimit?: number; // Default: 20 (FR-012a)
  autosaveDebounceMs?: number; // Default: 500 (FR-015)
}

/**
 * Folder entity (FR-006)
 */
export interface Folder extends BaseEntity {
  workspaceId: string;
  parentId: string | null; // NULL = root folder
  name: string;
  folderType: 'user' | 'date'; // 'date' for auto-generated DD.MM.YYYY folders
  isDeleted: boolean;
}

/**
 * Item base interface (polymorphic)
 */
export interface Item extends BaseEntity {
  workspaceId: string;
  folderId: string | null; // NULL = workspace root
  itemType: 'web' | 'note';
  title: string;
  metadata: ItemMetadata;
  isDeleted: boolean;
}

/**
 * Web item (FR-004)
 */
export interface WebItem extends Item {
  itemType: 'web';
  url: string;
  favicon: string | null; // Base64 data URL or remote URL
}

/**
 * Note item (FR-004)
 */
export interface NoteItem extends Item {
  itemType: 'note';
  content: string; // Markdown content
}

/**
 * Item metadata (extensible)
 */
export interface ItemMetadata {
  scrollPosition?: number; // For web items
  lastAccessedAt?: number; // Unix timestamp
  openCount?: number; // Number of times opened
  customIcon?: string; // User-defined emoji or icon
}

/**
 * Tag entity (FR-009)
 */
export interface Tag extends BaseEntity {
  workspaceId: string;
  name: string;
  color: string; // Hex color code
}

/**
 * Item-Tag relationship
 */
export interface ItemTag {
  itemId: string;
  tagId: string;
  createdAt: number;
}

/**
 * Session state (FR-003a, FR-003c)
 */
export interface SessionState {
  id: 1; // Singleton
  activeWorkspaceId: string | null;
  openTabs: string[]; // Array of item IDs
  activeTabIndex: number;
  aiProvider: 'chatgpt' | 'claude' | 'gemini' | 'none';
  windowState: WindowState;
  updatedAt: number;
}

export interface WindowState {
  width: number;
  height: number;
  x: number;
  y: number;
  isMaximized: boolean;
}

/**
 * AI provider session
 */
export interface AISession {
  provider: 'chatgpt' | 'claude' | 'gemini';
  cookies: Cookie[];
  lastAccessedAt: number;
  isValid: boolean;
}

export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
}
```

### Type Guards

```typescript
// src/types/guards.ts

export function isWebItem(item: Item): item is WebItem {
  return item.itemType === 'web';
}

export function isNoteItem(item: Item): item is NoteItem {
  return item.itemType === 'note';
}

export function isDateFolder(folder: Folder): boolean {
  return folder.folderType === 'date';
}

export function isRootFolder(folder: Folder): boolean {
  return folder.parentId === null;
}
```

---

## 4. Data Validation Rules

### Validation Functions

```typescript
// src/core/validation.ts

import { z } from 'zod'; // Using Zod for runtime validation

/**
 * UUID v4 schema
 */
const uuidSchema = z.string().uuid();

/**
 * Workspace validation
 */
export const workspaceSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(255),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  settings: z.object({
    theme: z.enum(['light', 'dark']).optional(),
    defaultAIProvider: z.enum(['chatgpt', 'claude', 'gemini', 'none']).optional(),
    autoDateFolders: z.boolean().optional(),
    tabSoftLimit: z.number().int().min(1).max(100).optional(),
    autosaveDebounceMs: z.number().int().min(100).max(5000).optional()
  }).optional(),
  isDeleted: z.boolean()
});

/**
 * Folder validation
 */
export const folderSchema = z.object({
  id: uuidSchema,
  workspaceId: uuidSchema,
  parentId: uuidSchema.nullable(),
  name: z.string().min(1).max(255),
  folderType: z.enum(['user', 'date']),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  isDeleted: z.boolean()
}).refine(
  (data) => data.id !== data.parentId,
  { message: 'Folder cannot be its own parent' }
);

/**
 * URL validation (Constitution I.2)
 */
export function validateURL(urlString: string): URL | null {
  try {
    const url = new URL(urlString);

    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

/**
 * Web item validation
 */
export const webItemSchema = z.object({
  id: uuidSchema,
  workspaceId: uuidSchema,
  folderId: uuidSchema.nullable(),
  itemType: z.literal('web'),
  title: z.string().min(1).max(500),
  url: z.string().refine(
    (url) => validateURL(url) !== null,
    { message: 'Invalid URL format' }
  ),
  favicon: z.string().nullable(),
  metadata: z.record(z.unknown()),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  isDeleted: z.boolean()
});

/**
 * Note item validation
 */
export const noteItemSchema = z.object({
  id: uuidSchema,
  workspaceId: uuidSchema,
  folderId: uuidSchema.nullable(),
  itemType: z.literal('note'),
  title: z.string().min(1).max(500),
  content: z.string(),
  metadata: z.record(z.unknown()),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  isDeleted: z.boolean()
});

/**
 * Tag validation
 */
export const tagSchema = z.object({
  id: uuidSchema,
  workspaceId: uuidSchema,
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  createdAt: z.number().int().positive()
});

/**
 * Date folder name validation (DD.MM.YYYY)
 */
export function isValidDateFolderName(name: string): boolean {
  const regex = /^\d{2}\.\d{2}\.\d{4}$/;
  if (!regex.test(name)) return false;

  // Parse and validate date
  const [day, month, year] = name.split('.').map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Generate date folder name for today
 */
export function generateDateFolderName(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}
```

---

## 5. Query Patterns

### Common Queries

```typescript
// src/core/storage/queries.ts

import { Database } from 'better-sqlite3';
import { Workspace, Folder, Item, WebItem, NoteItem, Tag } from '../types/entities';

export class StorageQueries {
  constructor(private db: Database) {}

  /**
   * Get all workspaces (ordered by most recent)
   */
  getAllWorkspaces(): Workspace[] {
    return this.db
      .prepare<[], Workspace>(
        `SELECT * FROM workspaces WHERE is_deleted = 0 ORDER BY updated_at DESC`
      )
      .all();
  }

  /**
   * Get workspace by ID
   */
  getWorkspaceById(id: string): Workspace | null {
    return this.db
      .prepare<[string], Workspace>(
        `SELECT * FROM workspaces WHERE id = ? AND is_deleted = 0`
      )
      .get(id) || null;
  }

  /**
   * Get root folders for a workspace
   */
  getRootFolders(workspaceId: string): Folder[] {
    return this.db
      .prepare<[string], Folder>(
        `SELECT * FROM folders
         WHERE workspace_id = ? AND parent_id IS NULL AND is_deleted = 0
         ORDER BY created_at DESC`
      )
      .all(workspaceId);
  }

  /**
   * Get child folders of a parent folder
   */
  getChildFolders(parentId: string): Folder[] {
    return this.db
      .prepare<[string], Folder>(
        `SELECT * FROM folders
         WHERE parent_id = ? AND is_deleted = 0
         ORDER BY created_at DESC`
      )
      .all(parentId);
  }

  /**
   * Get all items in a folder
   */
  getItemsInFolder(folderId: string): Item[] {
    return this.db
      .prepare<[string], Item>(
        `SELECT * FROM items
         WHERE folder_id = ? AND is_deleted = 0
         ORDER BY created_at DESC`
      )
      .all(folderId);
  }

  /**
   * Get orphaned items (no folder assigned)
   */
  getOrphanedItems(workspaceId: string): Item[] {
    return this.db
      .prepare<[string], Item>(
        `SELECT * FROM items
         WHERE workspace_id = ? AND folder_id IS NULL AND is_deleted = 0
         ORDER BY created_at DESC`
      )
      .all(workspaceId);
  }

  /**
   * Full-text search across items (FR-010)
   */
  searchItems(workspaceId: string, query: string): Item[] {
    return this.db
      .prepare<[string, string], Item>(
        `SELECT items.* FROM items
         INNER JOIN items_fts ON items.id = items_fts.item_id
         WHERE items.workspace_id = ? AND items_fts MATCH ?
         ORDER BY rank`
      )
      .all(workspaceId, query);
  }

  /**
   * Check for duplicate URL (FR-002a)
   * Returns existing item if:
   * - Same URL
   * - Created today
   * - In the same folder (or both at root)
   */
  findDuplicateWebItem(
    workspaceId: string,
    url: string,
    folderId: string | null
  ): WebItem | null {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTimestamp = todayStart.getTime();

    const candidates = this.db
      .prepare<[string, string, number], WebItem>(
        `SELECT * FROM items
         WHERE workspace_id = ? AND url = ? AND created_at >= ? AND is_deleted = 0
         ORDER BY created_at DESC`
      )
      .all(workspaceId, url, todayTimestamp);

    // Find first item in same folder
    return candidates.find((item) => item.folderId === folderId) || null;
  }

  /**
   * Get or create date folder for today (FR-005)
   */
  getOrCreateDateFolder(workspaceId: string): Folder {
    const folderName = generateDateFolderName();

    // Check if exists
    const existing = this.db
      .prepare<[string, string], Folder>(
        `SELECT * FROM folders
         WHERE workspace_id = ? AND name = ? AND folder_type = 'date' AND is_deleted = 0`
      )
      .get(workspaceId, folderName);

    if (existing) return existing;

    // Create new date folder
    const id = crypto.randomUUID();
    const now = Date.now();

    this.db
      .prepare(
        `INSERT INTO folders (id, workspace_id, parent_id, name, folder_type, created_at, updated_at)
         VALUES (?, ?, NULL, ?, 'date', ?, ?)`
      )
      .run(id, workspaceId, folderName, now, now);

    return this.db
      .prepare<[string], Folder>('SELECT * FROM folders WHERE id = ?')
      .get(id)!;
  }

  /**
   * Get all tags for an item
   */
  getItemTags(itemId: string): Tag[] {
    return this.db
      .prepare<[string], Tag>(
        `SELECT tags.* FROM tags
         INNER JOIN item_tags ON tags.id = item_tags.tag_id
         WHERE item_tags.item_id = ?
         ORDER BY tags.name`
      )
      .all(itemId);
  }

  /**
   * Get items by tag
   */
  getItemsByTag(tagId: string): Item[] {
    return this.db
      .prepare<[string], Item>(
        `SELECT items.* FROM items
         INNER JOIN item_tags ON items.id = item_tags.item_id
         WHERE item_tags.tag_id = ? AND items.is_deleted = 0
         ORDER BY items.created_at DESC`
      )
      .all(tagId);
  }

  /**
   * Get session state (singleton)
   */
  getSessionState(): SessionState {
    return this.db
      .prepare<[], SessionState>('SELECT * FROM session_state WHERE id = 1')
      .get()!;
  }

  /**
   * Update session state
   */
  updateSessionState(updates: Partial<SessionState>): void {
    const fields = Object.keys(updates)
      .filter((key) => key !== 'id' && key !== 'updatedAt')
      .map((key) => `${key} = @${key}`)
      .join(', ');

    this.db
      .prepare(`UPDATE session_state SET ${fields} WHERE id = 1`)
      .run(updates);
  }
}
```

---

## 6. Migration Strategy

### Migration Files

Each migration is a separate SQL file with version number:

```
src/core/storage/migrations/
├── 001_initial_schema.sql
├── 002_add_folder_types.sql (future)
└── 003_add_item_metadata.sql (future)
```

### Migration Runner

```typescript
// src/core/storage/migrator.ts

import { Database } from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export class Migrator {
  constructor(private db: Database) {}

  /**
   * Get current schema version
   */
  private getCurrentVersion(): number {
    try {
      const result = this.db
        .prepare<[], { version: number }>(
          'SELECT MAX(version) as version FROM _schema_metadata'
        )
        .get();
      return result?.version || 0;
    } catch {
      return 0; // Table doesn't exist yet
    }
  }

  /**
   * Apply migration file
   */
  private applyMigration(version: number, sql: string, description: string): void {
    this.db.transaction(() => {
      // Execute migration SQL
      this.db.exec(sql);

      // Record migration
      this.db
        .prepare(
          'INSERT INTO _schema_metadata (version, applied_at, description) VALUES (?, ?, ?)'
        )
        .run(version, Date.now(), description);
    })();
  }

  /**
   * Run all pending migrations
   */
  async migrate(): Promise<void> {
    const currentVersion = this.getCurrentVersion();
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      const match = file.match(/^(\d+)_(.+)\.sql$/);
      if (!match) continue;

      const version = parseInt(match[1], 10);
      const description = match[2].replace(/_/g, ' ');

      if (version <= currentVersion) continue;

      console.log(`Applying migration ${version}: ${description}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      this.applyMigration(version, sql, description);
    }
  }
}
```

---

## 7. Data Integrity Constraints

### Constraint Summary

| Constraint | Implementation | Enforcement |
|------------|----------------|-------------|
| **Primary Keys** | UUIDv4 (client-generated) | SQLite PRIMARY KEY |
| **Foreign Keys** | workspace_id, folder_id, parent_id | SQLite FOREIGN KEY with CASCADE |
| **Unique Constraints** | (workspace_id, tag name) | SQLite UNIQUE index |
| **Check Constraints** | item_type IN ('web', 'note') | SQLite CHECK |
| **NOT NULL** | Required fields | SQLite NOT NULL |
| **Circular Folder Prevention** | parent_id != id | Application logic + CHECK |
| **Orphan Prevention** | CASCADE DELETE | SQLite ON DELETE CASCADE |
| **JSON Validation** | json_valid() | SQLite CHECK |
| **Date Folder Format** | DD.MM.YYYY regex | Application validation |

### Integrity Validation on Startup (FR-003b)

```typescript
// src/core/storage/integrity.ts

export class IntegrityChecker {
  constructor(private db: Database) {}

  /**
   * Run all integrity checks
   */
  async validateIntegrity(): Promise<IntegrityReport> {
    const report: IntegrityReport = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // 1. SQLite integrity check
    const sqliteCheck = this.db.prepare('PRAGMA integrity_check').get() as { integrity_check: string };
    if (sqliteCheck.integrity_check !== 'ok') {
      report.isValid = false;
      report.errors.push(`SQLite integrity check failed: ${sqliteCheck.integrity_check}`);
    }

    // 2. Foreign key check
    const fkViolations = this.db.prepare('PRAGMA foreign_key_check').all();
    if (fkViolations.length > 0) {
      report.isValid = false;
      report.errors.push(`Foreign key violations: ${fkViolations.length}`);
    }

    // 3. Circular folder detection
    const folders = this.db.prepare<[], Folder>('SELECT * FROM folders').all();
    for (const folder of folders) {
      if (this.hasCircularParent(folder.id)) {
        report.isValid = false;
        report.errors.push(`Circular folder detected: ${folder.id}`);
      }
    }

    // 4. Orphaned items check (warning only)
    const orphanCount = this.db
      .prepare<[], { count: number }>(
        `SELECT COUNT(*) as count FROM items
         WHERE folder_id IS NOT NULL
         AND folder_id NOT IN (SELECT id FROM folders)`
      )
      .get()?.count || 0;

    if (orphanCount > 0) {
      report.warnings.push(`${orphanCount} items reference non-existent folders`);
    }

    return report;
  }

  /**
   * Detect circular folder hierarchy
   */
  private hasCircularParent(folderId: string, visited = new Set<string>()): boolean {
    if (visited.has(folderId)) return true;
    visited.add(folderId);

    const folder = this.db
      .prepare<[string], Folder>('SELECT * FROM folders WHERE id = ?')
      .get(folderId);

    if (!folder || !folder.parentId) return false;

    return this.hasCircularParent(folder.parentId, visited);
  }
}

export interface IntegrityReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

---

## 8. Data Flow Examples

### Example 1: Creating a New Web Item (FR-002, FR-005)

```typescript
// User navigates to URL: https://example.com
async function handleNavigationComplete(
  workspaceId: string,
  url: string,
  title: string,
  favicon: string | null
): Promise<WebItem> {
  // Step 1: Check for duplicates (FR-002a)
  const duplicate = queries.findDuplicateWebItem(workspaceId, url, null);
  if (duplicate) {
    // Focus existing tab instead of creating new item
    eventBus.emit('focus-tab', duplicate.id);
    return duplicate;
  }

  // Step 2: Get or create date folder (FR-005)
  const dateFolder = queries.getOrCreateDateFolder(workspaceId);

  // Step 3: Create web item
  const id = crypto.randomUUID();
  const now = Date.now();

  db.prepare(
    `INSERT INTO items (id, workspace_id, folder_id, item_type, title, url, favicon, created_at, updated_at)
     VALUES (?, ?, ?, 'web', ?, ?, ?, ?, ?)`
  ).run(id, workspaceId, dateFolder.id, title, url, favicon, now, now);

  // Step 4: Return created item
  return db.prepare<[string], WebItem>('SELECT * FROM items WHERE id = ?').get(id)!;
}
```

### Example 2: Autosaving a Note (FR-015)

```typescript
// User types in Markdown editor
let autosaveTimer: NodeJS.Timeout | null = null;

function handleNoteContentChange(noteId: string, content: string): void {
  // Clear existing timer
  if (autosaveTimer) clearTimeout(autosaveTimer);

  // Set 500ms debounce
  autosaveTimer = setTimeout(() => {
    // Save content
    const now = Date.now();
    db.prepare(
      `UPDATE items SET content = ?, updated_at = ? WHERE id = ?`
    ).run(content, now, noteId);

    // Update timestamp indicator
    const timestamp = new Date(now).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    eventBus.emit('autosave-complete', { noteId, timestamp });

    autosaveTimer = null;
  }, 500);
}
```

### Example 3: Session Restore (FR-003c)

```typescript
// Application startup
async function restoreSession(): Promise<void> {
  // Step 1: Validate integrity (FR-003b)
  const integrityCheck = await integrityChecker.validateIntegrity();
  if (!integrityCheck.isValid) {
    // Show recovery dialog
    await showIntegrityErrorDialog(integrityCheck.errors);
    return;
  }

  // Step 2: Load session state
  const session = queries.getSessionState();

  // Step 3: Restore workspace
  if (session.activeWorkspaceId) {
    const workspace = queries.getWorkspaceById(session.activeWorkspaceId);
    if (workspace) {
      eventBus.emit('workspace-loaded', workspace);
    }
  }

  // Step 4: Restore tabs
  for (const itemId of session.openTabs) {
    const item = queries.getItemById(itemId);
    if (item) {
      eventBus.emit('open-tab', item, { restoring: true });
    }
  }

  // Step 5: Focus active tab
  eventBus.emit('focus-tab-index', session.activeTabIndex);
}
```

---

**Document Status**: Finalized
**Next Step**: Refer to [implementation-strategy.md](implementation-strategy.md) for implementation details.
