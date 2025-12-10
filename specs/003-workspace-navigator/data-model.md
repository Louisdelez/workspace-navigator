# Data Model: Workspace Navigator

**Feature Branch**: `003-workspace-navigator`
**Date**: 2025-12-09
**Plan**: [plan.md](./plan.md)

## Overview

This document defines the data model for Workspace Navigator, including SQLite schema, TypeScript entities, and validation rules. The model supports the hierarchical workspace structure, multi-tab browsing, markdown notes, and session persistence.

---

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│    Workspace    │       │   AIProvider    │
│─────────────────│       │─────────────────│
│ id (PK)         │       │ id (PK)         │
│ name            │       │ name            │
│ createdAt       │       │ url             │
│ updatedAt       │       │ partition       │
│ isDefault       │       │ lastUsed        │
└────────┬────────┘       └─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│     Folder      │
│─────────────────│
│ id (PK)         │
│ workspaceId (FK)│──────┐
│ parentId (FK)   │◄─────┘ (self-reference)
│ name            │
│ displayOrder    │
│ isDateFolder    │
│ createdAt       │
│ updatedAt       │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐       ┌─────────────────┐
│      Item       │       │       Tab       │
│─────────────────│       │─────────────────│
│ id (PK)         │◄──────│ itemId (FK)     │
│ folderId (FK)   │       │ id (PK)         │
│ type            │       │ position        │
│ title           │       │ isActive        │
│ url             │       │ scrollPosition  │
│ content         │       │ createdAt       │
│ favicon         │       │ lastAccessedAt  │
│ displayOrder    │       └─────────────────┘
│ createdAt       │
│ updatedAt       │
│ lastAccessedAt  │
└─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│  SessionState   │       │   AppSettings   │
│─────────────────│       │─────────────────│
│ id (PK)         │       │ key (PK)        │
│ key             │       │ value           │
│ value (JSON)    │       │ updatedAt       │
│ updatedAt       │       └─────────────────┘
└─────────────────┘
```

---

## SQLite Schema

### Migration 001: Initial Schema

```sql
-- Enable foreign key support
PRAGMA foreign_keys = ON;

-- Workspaces table
CREATE TABLE workspaces (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Ensure only one default workspace
CREATE UNIQUE INDEX idx_workspaces_default ON workspaces(is_default) WHERE is_default = 1;

-- Folders table (hierarchical structure)
CREATE TABLE folders (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    parent_id TEXT REFERENCES folders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_date_folder INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_folders_workspace ON folders(workspace_id);
CREATE INDEX idx_folders_parent ON folders(parent_id);
CREATE INDEX idx_folders_date ON folders(is_date_folder, name) WHERE is_date_folder = 1;

-- Items table (web pages and notes)
CREATE TABLE items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    folder_id TEXT NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('web', 'note')),
    title TEXT NOT NULL,
    url TEXT,
    content TEXT,
    favicon TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_accessed_at TEXT
);

CREATE INDEX idx_items_folder ON items(folder_id);
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_url ON items(url) WHERE url IS NOT NULL;
CREATE INDEX idx_items_search ON items(title, url);

-- Full-text search for items
CREATE VIRTUAL TABLE items_fts USING fts5(
    title,
    url,
    content,
    content='items',
    content_rowid='rowid'
);

-- FTS triggers for automatic sync
CREATE TRIGGER items_fts_insert AFTER INSERT ON items BEGIN
    INSERT INTO items_fts(rowid, title, url, content)
    VALUES (NEW.rowid, NEW.title, NEW.url, NEW.content);
END;

CREATE TRIGGER items_fts_update AFTER UPDATE ON items BEGIN
    INSERT INTO items_fts(items_fts, rowid, title, url, content)
    VALUES ('delete', OLD.rowid, OLD.title, OLD.url, OLD.content);
    INSERT INTO items_fts(rowid, title, url, content)
    VALUES (NEW.rowid, NEW.title, NEW.url, NEW.content);
END;

CREATE TRIGGER items_fts_delete AFTER DELETE ON items BEGIN
    INSERT INTO items_fts(items_fts, rowid, title, url, content)
    VALUES ('delete', OLD.rowid, OLD.title, OLD.url, OLD.content);
END;

-- Tabs table (open tabs state)
CREATE TABLE tabs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 0,
    scroll_position INTEGER DEFAULT 0,
    navigation_state TEXT, -- JSON: history, canGoBack, canGoForward
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_accessed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_tabs_item ON tabs(item_id);
CREATE UNIQUE INDEX idx_tabs_active ON tabs(is_active) WHERE is_active = 1;

-- AI Providers table
CREATE TABLE ai_providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    partition TEXT NOT NULL,
    last_used_at TEXT,
    is_enabled INTEGER NOT NULL DEFAULT 1
);

-- Default AI providers
INSERT INTO ai_providers (id, name, url, partition) VALUES
    ('chatgpt', 'ChatGPT', 'https://chat.openai.com', 'persist:ai-chatgpt'),
    ('claude', 'Claude', 'https://claude.ai', 'persist:ai-claude'),
    ('gemini', 'Gemini', 'https://gemini.google.com', 'persist:ai-gemini');

-- Session state table (key-value store for app state)
CREATE TABLE session_state (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL, -- JSON
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_session_state_key ON session_state(key);

-- App settings table
CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL, -- JSON
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Schema version tracking
CREATE TABLE schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO schema_migrations (version) VALUES (1);
```

---

## TypeScript Entity Definitions

### Core Entities

```typescript
// src/types/entities.ts

export type ItemType = 'web' | 'note';
export type AIProviderType = 'chatgpt' | 'claude' | 'gemini';

export interface Workspace {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Folder {
  id: string;
  workspaceId: string;
  parentId: string | null;
  name: string;
  displayOrder: number;
  isDateFolder: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Virtual (not stored)
  children?: Folder[];
  items?: Item[];
}

export interface Item {
  id: string;
  folderId: string;
  type: ItemType;
  title: string;
  url: string | null;       // Required for 'web' type
  content: string | null;   // Required for 'note' type
  favicon: string | null;   // Base64 or data URL
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date | null;
}

export interface Tab {
  id: string;
  itemId: string;
  position: number;
  isActive: boolean;
  scrollPosition: number;
  navigationState: NavigationState | null;
  createdAt: Date;
  lastAccessedAt: Date;
  // Virtual (joined)
  item?: Item;
}

export interface NavigationState {
  history: string[];
  currentIndex: number;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface AIProvider {
  id: AIProviderType;
  name: string;
  url: string;
  partition: string;
  lastUsedAt: Date | null;
  isEnabled: boolean;
}

export interface SessionState {
  id: string;
  key: string;
  value: unknown; // JSON parsed
  updatedAt: Date;
}

export interface AppSettings {
  key: string;
  value: unknown; // JSON parsed
  updatedAt: Date;
}
```

### Tree Node (UI representation)

```typescript
// src/types/tree.ts

export type TreeNodeType = 'folder' | 'item';

export interface TreeNode {
  id: string;
  type: TreeNodeType;
  name: string;
  depth: number;
  isExpanded: boolean;
  parentId: string | null;
  hasChildren: boolean;
  // Folder-specific
  isDateFolder?: boolean;
  // Item-specific
  itemType?: ItemType;
  url?: string;
  favicon?: string;
}

export interface FlattenedTree {
  nodes: TreeNode[];
  nodeMap: Map<string, TreeNode>;
}
```

---

## Validation Rules

### Zod Schemas

```typescript
// src/types/schemas.ts

import { z } from 'zod';

// Workspace
export const WorkspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  isDefault: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(255),
});

// Folder
export const FolderSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
  name: z.string().min(1).max(255),
  displayOrder: z.number().int().min(0),
  isDateFolder: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateFolderSchema = z.object({
  workspaceId: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
  name: z.string().min(1).max(255),
});

export const MoveFolderSchema = z.object({
  folderId: z.string().uuid(),
  newParentId: z.string().uuid().nullable(),
  newPosition: z.number().int().min(0),
});

// Item
export const ItemTypeSchema = z.enum(['web', 'note']);

export const ItemSchema = z.object({
  id: z.string().uuid(),
  folderId: z.string().uuid(),
  type: ItemTypeSchema,
  title: z.string().min(1).max(500),
  url: z.string().url().nullable(),
  content: z.string().nullable(),
  favicon: z.string().nullable(),
  displayOrder: z.number().int().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastAccessedAt: z.date().nullable(),
});

export const CreateWebItemSchema = z.object({
  folderId: z.string().uuid(),
  url: z.string().url(),
  title: z.string().min(1).max(500).optional(),
  favicon: z.string().optional(),
});

export const CreateNoteItemSchema = z.object({
  folderId: z.string().uuid(),
  title: z.string().min(1).max(500),
  content: z.string().optional(),
});

export const MoveItemSchema = z.object({
  itemId: z.string().uuid(),
  newFolderId: z.string().uuid(),
  newPosition: z.number().int().min(0),
});

export const UpdateNoteContentSchema = z.object({
  itemId: z.string().uuid(),
  content: z.string(),
});

// Tab
export const TabSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  position: z.number().int().min(0),
  isActive: z.boolean(),
  scrollPosition: z.number().int().min(0),
  navigationState: z.object({
    history: z.array(z.string()),
    currentIndex: z.number().int().min(0),
    canGoBack: z.boolean(),
    canGoForward: z.boolean(),
  }).nullable(),
  createdAt: z.date(),
  lastAccessedAt: z.date(),
});

export const OpenTabSchema = z.object({
  itemId: z.string().uuid(),
});

export const ReorderTabsSchema = z.object({
  tabIds: z.array(z.string().uuid()),
});

// Search
export const SearchQuerySchema = z.object({
  query: z.string().min(1).max(200),
  workspaceId: z.string().uuid().optional(),
  type: ItemTypeSchema.optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export const SearchResultSchema = z.object({
  item: ItemSchema,
  matchType: z.enum(['title', 'url', 'content']),
  snippet: z.string().optional(),
});
```

---

## State Transitions

### Item Lifecycle

```
┌─────────────┐     navigate      ┌─────────────┐
│   (none)    │ ───────────────►  │   Created   │
└─────────────┘                   └──────┬──────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
            ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
            │   In Tab      │    │   Archived    │    │   Deleted     │
            │   (opened)    │    │   (closed)    │    │               │
            └───────┬───────┘    └───────┬───────┘    └───────────────┘
                    │                    │
                    │    close tab       │    re-open
                    └────────────────────┴────────────────────┘
```

### Tab State Machine

```
┌─────────────┐      open item      ┌─────────────┐
│   (none)    │ ───────────────────►│   Active    │
└─────────────┘                     └──────┬──────┘
                                           │
                       ┌───────────────────┼───────────────────┐
                       │ switch tab        │ close tab         │
                       ▼                   │                   ▼
               ┌───────────────┐           │           ┌───────────────┐
               │   Inactive    │           │           │   Closed      │
               │  (suspended)  │◄──────────┘           │  (destroyed)  │
               └───────────────┘  switch to            └───────────────┘
                       │
                       │ switch to this tab
                       │
                       ▼
               ┌───────────────┐
               │   Active      │
               │  (resumed)    │
               └───────────────┘
```

---

## Indexes and Query Patterns

### Primary Query Patterns

| Query | Index Used | Expected Performance |
|-------|------------|---------------------|
| Get folders by workspace | `idx_folders_workspace` | < 1ms |
| Get items by folder | `idx_items_folder` | < 1ms |
| Search items by title/URL/content | `items_fts` | < 100ms for 10k items |
| Find item by URL (duplicate check) | `idx_items_url` | < 1ms |
| Get today's date folder | `idx_folders_date` | < 1ms |
| Get active tab | `idx_tabs_active` | < 1ms |

### Caching Strategy

```typescript
// In-memory cache layers
interface CacheConfig {
  // Full workspace tree (hot path)
  workspaceTree: {
    ttl: 'session', // Never expires during session
    invalidateOn: ['folder:create', 'folder:move', 'folder:delete'],
  },

  // Item metadata (accessed frequently)
  itemMetadata: {
    ttl: 300_000, // 5 minutes
    maxItems: 1000,
    invalidateOn: ['item:update', 'item:delete'],
  },

  // Search results (expensive to compute)
  searchResults: {
    ttl: 30_000, // 30 seconds
    maxQueries: 50,
    invalidateOn: ['item:create', 'item:update', 'item:delete'],
  },
}
```

---

## Migration Strategy

### Version Tracking

Each migration is stored in `schema_migrations` table with its version number and application timestamp.

### Migration Execution

```typescript
// src/main/database/migrations/runner.ts

interface Migration {
  version: number;
  up: string;   // SQL to apply
  down: string; // SQL to rollback
}

async function runMigrations(db: Database, migrations: Migration[]): Promise<void> {
  const applied = db.prepare('SELECT version FROM schema_migrations').all();
  const appliedVersions = new Set(applied.map(r => r.version));

  for (const migration of migrations.sort((a, b) => a.version - b.version)) {
    if (!appliedVersions.has(migration.version)) {
      db.transaction(() => {
        db.exec(migration.up);
        db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(migration.version);
      })();
    }
  }
}
```

### Future Migrations

- **V2**: Add tags support for items
- **V3**: Add workspace sharing metadata (prep for cloud sync)
- **V4**: Add item revision history

---

## Data Integrity Rules

1. **Workspace**: Must have at least one workspace (created on first launch)
2. **Folder**: Cannot be its own parent (no circular references)
3. **Item**:
   - `url` required and valid for type='web'
   - `content` can be null for new notes
4. **Tab**: Only one tab can be active at a time
5. **Cascade Deletes**: Deleting a folder deletes all child folders and items
6. **URL Uniqueness**: Soft constraint - detect duplicates but allow if user confirms
