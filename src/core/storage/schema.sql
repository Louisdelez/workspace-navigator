-- Workspace Navigator Database Schema
-- Based on data-model.md specifications
-- SQLite version 3.42+

-- Schema version metadata
CREATE TABLE IF NOT EXISTS _schema_metadata (
  version INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL,
  description TEXT NOT NULL
);

-- Current version: 1
INSERT OR IGNORE INTO _schema_metadata (version, applied_at, description)
VALUES (1, CAST(strftime('%s', 'now') AS INTEGER) * 1000, 'Initial schema');

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id) = 36),
  name TEXT NOT NULL CHECK(length(trim(name)) > 0),
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  updated_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  settings TEXT DEFAULT '{}' CHECK(json_valid(settings)),
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK(is_deleted IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_workspaces_name ON workspaces(name);
CREATE INDEX IF NOT EXISTS idx_workspaces_created_at ON workspaces(created_at DESC);

-- Update trigger for workspaces
CREATE TRIGGER IF NOT EXISTS trg_workspaces_updated_at
AFTER UPDATE ON workspaces
FOR EACH ROW
WHEN OLD.updated_at = NEW.updated_at
BEGIN
  UPDATE workspaces
  SET updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
  WHERE id = NEW.id;
END;

-- Folders table
CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id) = 36),
  workspace_id TEXT NOT NULL,
  parent_id TEXT DEFAULT NULL,
  name TEXT NOT NULL CHECK(length(trim(name)) > 0),
  folder_type TEXT NOT NULL DEFAULT 'user' CHECK(folder_type IN ('user', 'date')),
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  updated_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK(is_deleted IN (0, 1)),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE,
  CHECK(parent_id IS NULL OR parent_id != id)
);

CREATE INDEX IF NOT EXISTS idx_folders_workspace_id ON folders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_workspace_parent ON folders(workspace_id, parent_id);

-- Update trigger for folders
CREATE TRIGGER IF NOT EXISTS trg_folders_updated_at
AFTER UPDATE ON folders
FOR EACH ROW
WHEN OLD.updated_at = NEW.updated_at
BEGIN
  UPDATE folders
  SET updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
  WHERE id = NEW.id;
END;

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id) = 36),
  workspace_id TEXT NOT NULL,
  folder_id TEXT DEFAULT NULL,
  item_type TEXT NOT NULL CHECK(item_type IN ('web', 'note')),
  title TEXT NOT NULL CHECK(length(trim(title)) > 0),
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  updated_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  url TEXT DEFAULT NULL CHECK(
    (item_type = 'web' AND url IS NOT NULL AND length(url) > 0)
    OR (item_type = 'note' AND url IS NULL)
  ),
  favicon TEXT DEFAULT NULL,
  content TEXT DEFAULT NULL CHECK(
    (item_type = 'note' AND content IS NOT NULL)
    OR (item_type = 'web' AND content IS NULL)
  ),
  metadata TEXT DEFAULT '{}' CHECK(json_valid(metadata)),
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK(is_deleted IN (0, 1)),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_items_workspace_id ON items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_items_folder_id ON items(folder_id);
CREATE INDEX IF NOT EXISTS idx_items_item_type ON items(item_type);
CREATE INDEX IF NOT EXISTS idx_items_workspace_url_created ON items(workspace_id, url, created_at DESC);

-- Update trigger for items
CREATE TRIGGER IF NOT EXISTS trg_items_updated_at
AFTER UPDATE ON items
FOR EACH ROW
WHEN OLD.updated_at = NEW.updated_at
BEGIN
  UPDATE items
  SET updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
  WHERE id = NEW.id;
END;

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id) = 36),
  name TEXT NOT NULL CHECK(length(trim(name)) > 0),
  color TEXT NOT NULL DEFAULT '#808080' CHECK(color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  workspace_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  UNIQUE(workspace_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tags_workspace_id ON tags(workspace_id);

-- Item-Tag junction table
CREATE TABLE IF NOT EXISTS item_tags (
  item_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_item_tags_item_id ON item_tags(item_id);
CREATE INDEX IF NOT EXISTS idx_item_tags_tag_id ON item_tags(tag_id);

-- Session state table (singleton)
CREATE TABLE IF NOT EXISTS session_state (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  active_workspace_id TEXT DEFAULT NULL,
  open_tabs TEXT DEFAULT '[]' CHECK(json_valid(open_tabs)),
  active_tab_index INTEGER DEFAULT 0 CHECK(active_tab_index >= 0),
  ai_provider TEXT DEFAULT 'none' CHECK(ai_provider IN ('chatgpt', 'claude', 'gemini', 'none')),
  window_state TEXT DEFAULT '{}' CHECK(json_valid(window_state)),
  updated_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  FOREIGN KEY (active_workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL
);

-- Initialize session state
INSERT OR IGNORE INTO session_state (id) VALUES (1);

-- Update trigger for session_state
CREATE TRIGGER IF NOT EXISTS trg_session_state_updated_at
AFTER UPDATE ON session_state
FOR EACH ROW
BEGIN
  UPDATE session_state
  SET updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
  WHERE id = 1;
END;
